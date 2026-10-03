import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

/**
 * GET /api/products
 * Get products with pagination, filtering, sorting
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const sort = (req.query.sort as string) || 'sortOrder';
    const order = (req.query.order as string) || 'asc';
    const categoryId = req.query.categoryId as string | undefined;
    const status = req.query.status as string | undefined;
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: 'INACTIVE' },
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status === 'OUT_OF_STOCK') {
      where.status = 'OUT_OF_STOCK';
    }

    const orderBy: Record<string, string> = {};
    if (['price', 'createdAt', 'sortOrder', 'stockQuantity'].includes(sort)) {
      orderBy[sort] = order === 'desc' ? 'desc' : 'asc';
    } else {
      orderBy.sortOrder = 'asc';
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          unit: true,
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/products/search
 * Search products across all languages
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    if (!q) {
      return res.json({ products: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const searchTerm = `%${q}%`;

    const where: any = {
      status: { not: 'INACTIVE' },
      OR: [
        { nameUz: { contains: q, mode: 'insensitive' } },
        { nameRu: { contains: q, mode: 'insensitive' } },
        { nameEn: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ],
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sortOrder: 'asc' },
        include: {
          unit: true,
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/products/:id
 * Get single product detail
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id as string },
      include: {
        unit: true,
        category: true,
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'PRODUCT_NOT_FOUND', message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
