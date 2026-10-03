import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { telegramAuth } from '../middleware/auth';

const router = Router();
router.use(telegramAuth);

/**
 * GET /api/basket
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.basketItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: {
          include: { unit: true },
        },
      },
      orderBy: { addedAt: 'desc' },
    });

    const total = items.reduce((sum, item) => {
      if (item.product.status === 'ACTIVE') {
        return sum + item.product.price * item.quantity;
      }
      return sum;
    }, 0);

    res.json({
      items: items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        addedAt: item.addedAt,
        product: item.product,
      })),
      total,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error('Get basket error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/basket — Add item to basket
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    if (!productId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'productId required' });
    }

    // Verify product is active
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'PRODUCT_NOT_AVAILABLE', message: 'Product is not available' });
    }

    if (product.stockQuantity < qty) {
      return res.status(400).json({ error: 'INSUFFICIENT_STOCK', message: 'Not enough stock' });
    }

    // Upsert basket item
    const item = await prisma.basketItem.upsert({
      where: {
        userId_productId: { userId: req.user!.id, productId },
      },
      update: { quantity: { increment: qty } },
      create: { userId: req.user!.id, productId, quantity: qty },
      include: { product: { include: { unit: true } } },
    });

    res.json(item);
  } catch (error) {
    console.error('Add to basket error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/basket/:productId — Update quantity
 */
router.patch('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const quantity = parseInt(req.body.quantity, 10);

    if (!quantity || quantity < 1) {
      return res.status(400).json({ error: 'INVALID_QUANTITY', message: 'Quantity must be at least 1' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (product && product.stockQuantity < quantity) {
      return res.status(400).json({ error: 'INSUFFICIENT_STOCK', message: 'Not enough stock' });
    }

    const item = await prisma.basketItem.update({
      where: {
        userId_productId: { userId: req.user!.id, productId },
      },
      data: { quantity },
      include: { product: { include: { unit: true } } },
    });

    res.json(item);
  } catch (error) {
    console.error('Update basket error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/basket/:productId — Remove single item
 */
router.delete('/:productId', async (req: Request, res: Response) => {
  try {
    await prisma.basketItem.delete({
      where: {
        userId_productId: { userId: req.user!.id, productId: req.params.productId as string },
      },
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from basket error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/basket — Clear basket
 */
router.delete('/', async (req: Request, res: Response) => {
  try {
    await prisma.basketItem.deleteMany({ where: { userId: req.user!.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Clear basket error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
