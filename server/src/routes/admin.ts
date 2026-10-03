import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { telegramAuth, requireAdmin } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// All admin routes require auth + admin role
router.use(telegramAuth);
router.use(requireAdmin);

// ═══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      revenueResult,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { status: { not: 'INACTIVE' } } }),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
      prisma.order.count(),
      prisma.order.count({ where: { orderStatus: 'PENDING' } }),
      prisma.order.count({ where: { orderStatus: 'COMPLETED' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { orderStatus: { not: 'CANCELLED' } },
      }),
    ]);

    res.json({
      totalUsers,
      totalProducts,
      outOfStockProducts,
      totalOrders,
      pendingOrders,
      completedOrders,
      revenue: revenueResult._sum.total || 0,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/products', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';
    const categoryId = req.query.categoryId as string | undefined;
    const status = req.query.status as string | undefined;

    const where: any = {};
    if (search) {
      where.OR = [
        { nameEn: { contains: search, mode: 'insensitive' } },
        { nameRu: { contains: search, mode: 'insensitive' } },
        { nameUz: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { unit: true, category: true },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/products', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { nameUz, nameRu, nameEn, descriptionUz, descriptionRu, descriptionEn, price, categoryId, unitId, stockQuantity, sku, barcode, sortOrder, status } = req.body;

    if (!nameUz || !nameRu || !nameEn || !price || !categoryId || !unitId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Required fields: nameUz, nameRu, nameEn, price, categoryId, unitId' });
    }

    const product = await prisma.product.create({
      data: {
        nameUz,
        nameRu,
        nameEn,
        descriptionUz: descriptionUz || null,
        descriptionRu: descriptionRu || null,
        descriptionEn: descriptionEn || null,
        price: parseInt(price, 10),
        categoryId,
        unitId,
        stockQuantity: stockQuantity ? parseInt(stockQuantity, 10) : 0,
        sku: sku || null,
        barcode: barcode || null,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        status: status || 'ACTIVE',
        photo: req.file ? `/uploads/${req.file.filename}` : null,
      },
      include: { unit: true, category: true },
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/products/:id', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = {};

    const fields = ['nameUz', 'nameRu', 'nameEn', 'descriptionUz', 'descriptionRu', 'descriptionEn', 'categoryId', 'unitId', 'sku', 'barcode', 'status'];
    for (const field of fields) {
      if (req.body[field] !== undefined) data[field] = req.body[field];
    }

    if (req.body.price !== undefined) data.price = parseInt(req.body.price, 10);
    if (req.body.stockQuantity !== undefined) data.stockQuantity = parseInt(req.body.stockQuantity, 10);
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder, 10);
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { unit: true, category: true },
    });

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    // Clean up dependent relations to avoid foreign key violations
    await prisma.favorite.deleteMany({ where: { productId: id } });
    await prisma.basketItem.deleteMany({ where: { productId: id } });
    await prisma.banner.updateMany({ where: { productId: id }, data: { productId: null } });
    await prisma.news.updateMany({ where: { productId: id }, data: { productId: null } });
    await prisma.orderItem.deleteMany({ where: { productId: id } });

    await prisma.product.delete({ where: { id } });
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json(categories);
  } catch (error) {
    console.error('Admin get categories error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/categories', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { nameUz, nameRu, nameEn, sortOrder, isActive } = req.body;

    if (!nameUz || !nameRu || !nameEn) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Required: nameUz, nameRu, nameEn' });
    }

    const category = await prisma.category.create({
      data: {
        nameUz,
        nameRu,
        nameEn,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== 'false',
        photo: req.file ? `/uploads/${req.file.filename}` : null,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/categories/:id', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = {};

    if (req.body.nameUz !== undefined) data.nameUz = req.body.nameUz;
    if (req.body.nameRu !== undefined) data.nameRu = req.body.nameRu;
    if (req.body.nameEn !== undefined) data.nameEn = req.body.nameEn;
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder, 10);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true';
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Disconnect products before deleting category or set fallback
    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'CATEGORY_NOT_EMPTY', message: `Cannot delete category: ${productCount} products belong to it.` });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// UNITS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/units', async (_req: Request, res: Response) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        _count: { select: { products: true } },
      },
    });
    res.json(units);
  } catch (error) {
    console.error('Admin get units error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/units', async (req: Request, res: Response) => {
  try {
    const { nameUz, nameRu, nameEn, isActive } = req.body;

    if (!nameUz || !nameRu || !nameEn) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Required: nameUz, nameRu, nameEn' });
    }

    const unit = await prisma.unit.create({
      data: { nameUz, nameRu, nameEn, isActive: isActive !== false },
    });

    res.status(201).json(unit);
  } catch (error) {
    console.error('Create unit error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/units/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = {};

    if (req.body.nameUz !== undefined) data.nameUz = req.body.nameUz;
    if (req.body.nameRu !== undefined) data.nameRu = req.body.nameRu;
    if (req.body.nameEn !== undefined) data.nameEn = req.body.nameEn;
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

    const unit = await prisma.unit.update({
      where: { id },
      data,
    });

    res.json(unit);
  } catch (error) {
    console.error('Update unit error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const search = (req.query.search as string) || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { telegramUsername: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          telegramId: true,
          telegramUsername: true,
          firstName: true,
          lastName: true,
          phone: true,
          fullName: true,
          role: true,
          isActive: true,
          lastActivityAt: true,
          createdAt: true,
          _count: { select: { orders: true, favorites: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users: users.map(u => ({ ...u, telegramId: u.telegramId.toString() })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/users/:id/toggle-block', async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id as string } });
    if (!user) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const updated = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isActive: !user.isActive },
    });

    res.json({ ...updated, telegramId: updated.telegramId.toString() });
  } catch (error) {
    console.error('Toggle block error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ORDERS (admin)
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/orders', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
    const skip = (page - 1) * limit;
    const status = req.query.status as string | undefined;
    const paymentStatus = req.query.paymentStatus as string | undefined;

    const where: any = {};
    if (status) where.orderStatus = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          user: {
            select: { id: true, telegramId: true, firstName: true, lastName: true, telegramUsername: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders: orders.map(o => ({
        ...o,
        user: { ...o.user, telegramId: o.user.telegramId.toString() },
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Admin get orders error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id as string },
      include: {
        items: true,
        user: {
          select: { id: true, telegramId: true, firstName: true, lastName: true, telegramUsername: true, phone: true },
        },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!order) return res.status(404).json({ error: 'ORDER_NOT_FOUND' });

    res.json({
      ...order,
      user: { ...order.user, telegramId: order.user.telegramId.toString() },
    });
  } catch (error) {
    console.error('Admin get order error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const { status, note } = req.body;
    const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: 'Invalid order status' });
    }

    const updateData: any = { orderStatus: status };
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const [order] = await prisma.$transaction([
      prisma.order.update({
        where: { id: req.params.id as string },
        data: updateData,
        include: { items: true },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: req.params.id as string,
          status,
          note: note || null,
          changedBy: req.user!.id,
        },
      }),
    ]);

    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/orders/:id/payment-status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const validStatuses = ['UNPAID', 'PAYMENT_SUBMITTED', 'PAID', 'PAYMENT_REJECTED'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'INVALID_STATUS', message: 'Invalid payment status' });
    }

    const order = await prisma.order.update({
      where: { id: req.params.id as string },
      data: { paymentStatus: status },
    });

    res.json(order);
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BANK ACCOUNTS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/bank-accounts', async (_req: Request, res: Response) => {
  try {
    const accounts = await prisma.bankAccount.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/bank-accounts', async (req: Request, res: Response) => {
  try {
    const { bankName, accountNumber, holderName, branchInfo, sortOrder, isActive } = req.body;
    if (!bankName || !accountNumber || !holderName) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Required: bankName, accountNumber, holderName' });
    }

    const account = await prisma.bankAccount.create({
      data: {
        bankName,
        accountNumber,
        holderName,
        branchInfo: branchInfo || null,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== false,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/bank-accounts/:id', async (req: Request, res: Response) => {
  try {
    const data: any = {};
    const fields = ['bankName', 'accountNumber', 'holderName', 'branchInfo'];
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder, 10);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive;

    const account = await prisma.bankAccount.update({
      where: { id: req.params.id as string },
      data,
    });

    res.json(account);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/bank-accounts/:id', async (req: Request, res: Response) => {
  try {
    await prisma.bankAccount.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Bank account deleted successfully' });
  } catch (error) {
    console.error('Delete bank account error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NEWS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/news', async (_req: Request, res: Response) => {
  try {
    const news = await prisma.news.findMany({
      orderBy: { createdAt: 'desc' },
      include: { product: { select: { id: true, nameEn: true } } },
    });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/news', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const { titleUz, titleRu, titleEn, descriptionUz, descriptionRu, descriptionEn, productId, status } = req.body;
    if (!titleUz || !titleRu || !titleEn) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Required: titleUz, titleRu, titleEn' });
    }

    const news = await prisma.news.create({
      data: {
        titleUz, titleRu, titleEn,
        descriptionUz: descriptionUz || null,
        descriptionRu: descriptionRu || null,
        descriptionEn: descriptionEn || null,
        productId: productId || null,
        status: status || 'DRAFT',
        photo: req.file ? `/uploads/${req.file.filename}` : null,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });

    res.status(201).json(news);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/news/:id', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const data: any = {};
    const fields = ['titleUz', 'titleRu', 'titleEn', 'descriptionUz', 'descriptionRu', 'descriptionEn', 'productId', 'status'];
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f] || null;
    }
    if (req.body.status === 'PUBLISHED' && !data.publishedAt) data.publishedAt = new Date();
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    const news = await prisma.news.update({ where: { id: req.params.id as string }, data });
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/news/:id', async (req: Request, res: Response) => {
  try {
    await prisma.news.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// BANNERS
// ═══════════════════════════════════════════════════════════════════════════════

router.get('/banners', async (_req: Request, res: Response) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { product: { select: { id: true, nameEn: true } } },
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.post('/banners', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Photo is required' });
    }

    const { descriptionUz, descriptionRu, descriptionEn, productId, sortOrder, isActive } = req.body;

    const banner = await prisma.banner.create({
      data: {
        photo: `/uploads/${req.file.filename}`,
        descriptionUz: descriptionUz || null,
        descriptionRu: descriptionRu || null,
        descriptionEn: descriptionEn || null,
        productId: productId || null,
        sortOrder: sortOrder ? parseInt(sortOrder, 10) : 0,
        isActive: isActive !== 'false',
      },
    });

    res.status(201).json(banner);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.patch('/banners/:id', upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const data: any = {};
    const fields = ['descriptionUz', 'descriptionRu', 'descriptionEn', 'productId'];
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f] || null;
    }
    if (req.body.sortOrder !== undefined) data.sortOrder = parseInt(req.body.sortOrder, 10);
    if (req.body.isActive !== undefined) data.isActive = req.body.isActive === 'true';
    if (req.file) data.photo = `/uploads/${req.file.filename}`;

    const banner = await prisma.banner.update({ where: { id: req.params.id as string }, data });
    res.json(banner);
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

router.delete('/banners/:id', async (req: Request, res: Response) => {
  try {
    await prisma.banner.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR' });
  }
});

export default router;
