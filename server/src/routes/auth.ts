import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { config } from '../config';
import { telegramAuth, telegramInitDataAuth } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/telegram
 * Authenticate via Telegram initData, returns JWT + user data
 */
router.post('/telegram', telegramInitDataAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        phone: true,
        fullName: true,
        address: true,
        buildingNumber: true,
        homeNumber: true,
        entranceCode: true,
        language: true,
        theme: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' });
    }

    const isAdmin = Boolean(config.telegram.adminChatId && user.telegramId.toString() === config.telegram.adminChatId);
    let role = user.role;
    if (isAdmin && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      });
      role = 'SUPER_ADMIN';
    }

    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId.toString(),
        role,
      },
      config.jwt.secret,
      { expiresIn: 604800 } // 7 days in seconds
    );

    res.json({
      token,
      user: {
        ...user,
        role,
        telegramId: user.telegramId.toString(),
      },
    });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'AUTH_ERROR', message: 'Authentication failed' });
  }
});

/**
 * POST /api/auth/dev-login
 * Development-only login for testing as Admin or Customer
 */
router.post('/dev-login', async (req: Request, res: Response) => {
  if (!config.isDev()) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Dev login only available in development' });
  }

  try {
    const role = (req.body.role === 'ADMIN' ? 'ADMIN' : 'CUSTOMER') as 'ADMIN' | 'CUSTOMER';
    const tgId = role === 'ADMIN' ? BigInt(999999999) : BigInt(888888888);
    const firstName = role === 'ADMIN' ? 'Dev Admin' : 'Dev Customer';

    let user = await prisma.user.findUnique({
      where: { telegramId: tgId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: tgId,
          firstName,
          lastName: 'Tester',
          telegramUsername: role === 'ADMIN' ? 'dev_admin' : 'dev_customer',
          fullName: `${firstName} Tester`,
          phone: '010-1234-5678',
          address: 'Seoul, Gangnam-gu, Teheran-ro 152',
          buildingNumber: '101',
          homeNumber: '502',
          entranceCode: '*1234#',
          language: 'en',
          theme: 'system',
          role: role,
          isActive: true,
        },
      });
    } else if (user.role !== role) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role },
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        telegramId: user.telegramId.toString(),
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: 604800 }
    );

    res.json({
      token,
      user: {
        ...user,
        telegramId: user.telegramId.toString(),
      },
    });
  } catch (error) {
    console.error('Dev login error:', error);
    res.status(500).json({ error: 'DEV_LOGIN_FAILED' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', telegramAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        phone: true,
        fullName: true,
        address: true,
        buildingNumber: true,
        homeNumber: true,
        entranceCode: true,
        language: true,
        theme: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' });
    }

    const isAdmin = Boolean(config.telegram.adminChatId && user.telegramId.toString() === config.telegram.adminChatId);
    let role = user.role;
    if (isAdmin && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: 'SUPER_ADMIN' },
      });
      role = 'SUPER_ADMIN';
    }

    res.json({
      ...user,
      role,
      telegramId: user.telegramId.toString(),
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/auth/profile
 * Update user profile (delivery info, preferences)
 */
router.patch('/profile', telegramAuth, async (req: Request, res: Response) => {
  try {
    const { phone, fullName, address, buildingNumber, homeNumber, entranceCode, language, theme } = req.body;

    const updateData: Record<string, any> = {};
    if (phone !== undefined) updateData.phone = phone;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (address !== undefined) updateData.address = address;
    if (buildingNumber !== undefined) updateData.buildingNumber = buildingNumber;
    if (homeNumber !== undefined) updateData.homeNumber = homeNumber;
    if (entranceCode !== undefined) updateData.entranceCode = entranceCode;
    if (language !== undefined && ['uz', 'ru', 'en'].includes(language)) {
      updateData.language = language;
    }
    if (theme !== undefined && ['system', 'light', 'dark'].includes(theme)) {
      updateData.theme = theme;
    }

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        firstName: true,
        lastName: true,
        phone: true,
        fullName: true,
        address: true,
        buildingNumber: true,
        homeNumber: true,
        entranceCode: true,
        language: true,
        theme: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.json({
      ...user,
      telegramId: user.telegramId.toString(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
