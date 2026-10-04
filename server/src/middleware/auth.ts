import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { validateTelegramInitData } from '../utils/telegram';
import { UserRole } from '@prisma/client';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        telegramId: bigint;
        role: UserRole;
      };
    }
  }
}

/**
 * Strictly authenticates via Telegram initData.
 * Dedicated for POST /api/auth/telegram login endpoint.
 * Ignores any cached Bearer token to prevent cross-account impersonation.
 */
export async function telegramInitDataAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Telegram authentication data required' });
    }

    const parsed = validateTelegramInitData(initData);
    if (!parsed) {
      return res.status(401).json({ error: 'INVALID_TELEGRAM_AUTH', message: 'Invalid Telegram authentication data' });
    }

    const isAdmin = Boolean(config.telegram.adminChatId && parsed.user.id.toString() === config.telegram.adminChatId);
    const targetRole: UserRole = isAdmin ? 'SUPER_ADMIN' : 'CUSTOMER';

    // Find or create user via upsert to prevent race conditions
    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(parsed.user.id) },
      update: {
        firstName: parsed.user.first_name,
        lastName: parsed.user.last_name || null,
        telegramUsername: parsed.user.username || null,
        ...(isAdmin ? { role: 'SUPER_ADMIN' } : {}),
        lastActivityAt: new Date(),
      },
      create: {
        telegramId: BigInt(parsed.user.id),
        firstName: parsed.user.first_name,
        lastName: parsed.user.last_name || null,
        telegramUsername: parsed.user.username || null,
        language: parsed.user.language_code || 'en',
        role: targetRole,
      },
    });

    if (!user.isActive) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Account is blocked' });
    }

    req.user = {
      id: user.id,
      telegramId: user.telegramId,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Telegram initData auth error:', error);
    res.status(500).json({ error: 'AUTH_ERROR', message: 'Authentication failed' });
  }
}

/**
 * Authenticates a user via JWT token or Telegram initData.
 * For API requests. If both are provided, ensures token matches the current Telegram user.
 */
export async function telegramAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const initData = req.headers['x-telegram-init-data'] as string;

    let parsedInitData: ReturnType<typeof validateTelegramInitData> | null = null;
    if (initData) {
      parsedInitData = validateTelegramInitData(initData);
    }

    // Check for JWT token
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          telegramId: string;
          role: UserRole;
        };

        // SAFETY: If initData is provided, verify token matches the active Telegram user
        if (parsedInitData && decoded.telegramId !== parsedInitData.user.id.toString()) {
          // Token belongs to a different Telegram user! Discard token and fall through to initData auth
        } else {
          const isAdmin = Boolean(config.telegram.adminChatId && decoded.telegramId === config.telegram.adminChatId);
          const effectiveRole = isAdmin ? 'SUPER_ADMIN' : decoded.role;
          
          req.user = {
            id: decoded.userId,
            telegramId: BigInt(decoded.telegramId),
            role: effectiveRole,
          };
          return next();
        }
      } catch {
        // Token invalid, fall through
      }
    }

    // Fall back to Telegram initData if available
    if (parsedInitData) {
      const isAdmin = Boolean(config.telegram.adminChatId && parsedInitData.user.id.toString() === config.telegram.adminChatId);
      const targetRole: UserRole = isAdmin ? 'SUPER_ADMIN' : 'CUSTOMER';

      let user = await prisma.user.findUnique({
        where: { telegramId: BigInt(parsedInitData.user.id) },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: BigInt(parsedInitData.user.id),
            firstName: parsedInitData.user.first_name,
            lastName: parsedInitData.user.last_name || null,
            telegramUsername: parsedInitData.user.username || null,
            language: parsedInitData.user.language_code || 'en',
            role: targetRole,
          },
        });
      } else {
        const newRole = isAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' ? 'SUPER_ADMIN' : user.role;
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: parsedInitData.user.first_name,
            lastName: parsedInitData.user.last_name || null,
            telegramUsername: parsedInitData.user.username || null,
            role: newRole,
            lastActivityAt: new Date(),
          },
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'FORBIDDEN', message: 'Account is blocked' });
      }

      req.user = {
        id: user.id,
        telegramId: user.telegramId,
        role: user.role,
      };

      return next();
    }

    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'AUTH_ERROR', message: 'Authentication failed' });
  }
}

/**
 * Requires the user to have ADMIN or SUPER_ADMIN role.
 * Must be used after telegramAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Admin access required' });
  }

  next();
}

/**
 * Optional auth — if initData/token present, authenticate; otherwise continue as guest.
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const initData = req.headers['x-telegram-init-data'] as string;

  if (authHeader || initData) {
    return telegramAuth(req, res, next);
  }
  
  next();
}
