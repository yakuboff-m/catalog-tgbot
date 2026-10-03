import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/news — Published news (public)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const news = await prisma.news.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      include: {
        product: {
          select: { id: true, nameUz: true, nameRu: true, nameEn: true, photo: true, price: true },
        },
      },
    });
    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
