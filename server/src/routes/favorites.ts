import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { telegramAuth } from '../middleware/auth';

const router = Router();
router.use(telegramAuth);

/**
 * GET /api/favorites
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: { unit: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      favorites: favorites.map(f => ({
        id: f.id,
        productId: f.productId,
        createdAt: f.createdAt,
        product: f.product,
      })),
      count: favorites.length,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/favorites/:productId — Toggle favorite
 */
router.post('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      res.status(404).json({ error: 'PRODUCT_NOT_FOUND' });
      return;
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        userId_productId: { userId: req.user!.id, productId },
      },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ favorited: false });
    } else {
      await prisma.favorite.create({
        data: { userId: req.user!.id, productId },
      });
      res.json({ favorited: true });
    }
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/favorites/ids — Get list of favorited product IDs (lightweight)
 */
router.get('/ids', async (req: Request, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      select: { productId: true },
    });

    res.json(favorites.map(f => f.productId));
  } catch (error) {
    console.error('Get favorite ids error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
