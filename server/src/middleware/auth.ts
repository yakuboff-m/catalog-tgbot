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
 * Authenticates a user via Telegram initData.
 * On first login, creates the user record.
 * Returns a JWT for subsequent requests.
 */
export async function telegramAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    // Check for JWT token first (subsequent requests)
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, config.jwt.secret) as {
          userId: string;
          telegramId: string;
          role: UserRole;
        };

        const isAdmin = Boolean(config.telegram.adminChatId && decoded.telegramId === config.telegram.adminChatId);
        const effectiveRole = isAdmin ? 'SUPER_ADMIN' : decoded.role;
        
        req.user = {
          id: decoded.userId,
          telegramId: BigInt(decoded.telegramId),
          role: effectiveRole,
        };
        return next();
      } catch {
        // Token invalid, fall through
      }
    }

    // Check for Telegram initData
    const initData = req.headers['x-telegram-init-data'] as string;
    if (!initData) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const parsed = validateTelegramInitData(initData);
    if (!parsed) {
      return res.status(401).json({ error: 'INVALID_TELEGRAM_AUTH', message: 'Invalid Telegram authentication data' });
    }

    const isAdmin = Boolean(config.telegram.adminChatId && parsed.user.id.toString() === config.telegram.adminChatId);
    const targetRole: UserRole = isAdmin ? 'SUPER_ADMIN' : 'CUSTOMER';

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { telegramId: BigInt(parsed.user.id) },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: BigInt(parsed.user.id),
          firstName: parsed.user.first_name,
          lastName: parsed.user.last_name || null,
          telegramUsername: parsed.user.username || null,
          language: parsed.user.language_code || 'en',
          role: targetRole,
        },
      });
    } else {
      const newRole = isAdmin && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN' ? 'SUPER_ADMIN' : user.role;
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: parsed.user.first_name,
          lastName: parsed.user.last_name || null,
          telegramUsername: parsed.user.username || null,
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

    next();
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
