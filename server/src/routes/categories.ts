import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { telegramAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/categories
 * Get all active categories (public)
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE' },
            },
          },
        },
      },
    });

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/categories/:id/products
 * Get products for a specific category
 */
router.get('/:id/products', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sort = (req.query.sort as string) || 'sortOrder';
    const order = (req.query.order as string) || 'asc';
    const skip = (page - 1) * limit;

    const orderBy: Record<string, string> = {};
    if (['price', 'createdAt', 'sortOrder', 'stockQuantity'].includes(sort)) {
      orderBy[sort] = order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.sortOrder = 'asc';
    }

    const category = await prisma.category.findUnique({
      where: { id, isActive: true },
    });

    if (!category) {
      return res.status(404).json({ error: 'CATEGORY_NOT_FOUND', message: 'Category not found' });
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: { categoryId: id, status: { not: 'INACTIVE' } },
        orderBy,
        skip,
        take: limit,
        include: {
          unit: true,
          category: true,
        },
      }),
      prisma.product.count({
        where: { categoryId: id, status: { not: 'INACTIVE' } },
      }),
    ]);

    res.json({
      category,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
