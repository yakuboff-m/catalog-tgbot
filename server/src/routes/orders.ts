import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { telegramAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { sendAdminOrderNotification } from '../bot';
import { getLocalizedName } from '../utils/localization';

const router = Router();
router.use(telegramAuth);

/**
 * GET /api/orders — Customer's orders
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user!.id },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      }),
      prisma.order.count({ where: { userId: req.user!.id } }),
    ]);

    res.json({
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/orders/:id — Single order detail
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/orders — Create order (atomic, transaction-safe)
 * Optionally accepts proof file (multipart/form-data)
 */
router.post('/', upload.single('proof'), async (req: Request, res: Response) => {
  try {
    const { fullName, phone, address, buildingNumber, homeNumber, entranceCode, saveInfo } = req.body;

    // 1. Load user
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) return res.status(401).json({ error: 'UNAUTHORIZED' });

    // 2. Resolve delivery info
    const customerName = fullName || user.fullName || `${user.firstName} ${user.lastName || ''}`.trim();
    const customerPhone = phone || user.phone;
    const deliveryAddress = address || user.address;

    if (!customerName || !customerPhone || !deliveryAddress) {
      return res.status(400).json({
        error: 'DELIVERY_INFO_REQUIRED',
        message: 'Full name, phone, and address are required',
      });
    }

    // 3. Load basket
    const basketItems = await prisma.basketItem.findMany({
      where: { userId: req.user!.id },
      include: {
        product: { include: { unit: true } },
      },
    });

    if (basketItems.length === 0) {
      return res.status(400).json({ error: 'BASKET_EMPTY', message: 'Your basket is empty' });
    }

    // 4. Validate all products and calculate totals
    const orderItems: Array<{
      productId: string;
      productName: string;
      productPhoto: string | null;
      unitName: string;
      unitPrice: number;
      quantity: number;
      total: number;
    }> = [];

    for (const item of basketItems) {
      const product = item.product;

      if (product.status !== 'ACTIVE') {
        return res.status(400).json({
          error: 'PRODUCT_NOT_AVAILABLE',
          message: `Product "${product.nameEn}" is no longer available`,
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          error: 'INSUFFICIENT_STOCK',
          message: `Not enough stock for "${product.nameEn}". Available: ${product.stockQuantity}`,
        });
      }

      orderItems.push({
        productId: product.id,
        productName: product.nameEn,
        productPhoto: product.photo,
        unitName: product.unit.nameEn,
        unitPrice: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);

    // 5. Generate order number
    const lastOrder = await prisma.order.findFirst({ orderBy: { createdAt: 'desc' } });
    const seq = lastOrder ? parseInt(lastOrder.orderNumber.replace('ORD-', '')) + 1 : 10001;
    const orderNumber = `ORD-${seq}`;

    const proofImage = req.file ? `/uploads/${req.file.filename}` : null;

    // 6. Create order atomically
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          customerName,
          customerPhone,
          deliveryAddress,
          buildingNumber: buildingNumber || user.buildingNumber || null,
          homeNumber: homeNumber || user.homeNumber || null,
          entranceCode: entranceCode || user.entranceCode || null,
          subtotal,
          total: subtotal,
          paymentProofImage: proofImage,
          paymentStatus: proofImage ? 'PAYMENT_SUBMITTED' : 'UNPAID',
          paymentSubmittedAt: proofImage ? new Date() : null,
          items: {
            create: orderItems,
          },
          statusHistory: {
            create: {
              status: 'PENDING',
              note: proofImage ? 'Order placed with payment receipt' : 'Order placed',
            },
          },
        },
        include: { items: true },
      });

      // Deduct stock
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
          },
        });
      }

      // Clear basket
      await tx.basketItem.deleteMany({ where: { userId: req.user!.id } });

      // Save delivery info if requested
      if (saveInfo) {
        await tx.user.update({
          where: { id: req.user!.id },
          data: {
            fullName: customerName,
            phone: customerPhone,
            address: deliveryAddress,
            buildingNumber: buildingNumber || user.buildingNumber || null,
            homeNumber: homeNumber || user.homeNumber || null,
            entranceCode: entranceCode || user.entranceCode || null,
          },
        });
      }

      return newOrder;
    });

    // 7. Send rich admin notification with interactive buttons and receipt photo
    sendAdminOrderNotification(order, order.paymentProofImage).catch(console.error);

    res.status(201).json(order);
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'ORDER_CREATION_FAILED', message: 'Failed to create order' });
  }
});

/**
 * POST /api/orders/:id/payment-proof — Upload payment proof
 */
router.post('/:id/payment-proof', upload.single('proof'), async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id as string, userId: req.user!.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Payment proof image required' });
    }

    const proofPath = `/uploads/${req.file.filename}`;

    const updated = await prisma.order.update({
      where: { id: req.params.id as string },
      data: {
        paymentProofImage: proofPath,
        paymentStatus: 'PAYMENT_SUBMITTED',
        paymentSubmittedAt: new Date(),
      },
      include: { items: true },
    });

    // Notify admin with receipt photo and interactive action buttons
    sendAdminOrderNotification(updated, proofPath).catch(console.error);

    res.json(updated);
  } catch (error) {
    console.error('Upload payment proof error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
