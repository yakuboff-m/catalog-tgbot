import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create units
  const units = await Promise.all([
    prisma.unit.upsert({
      where: { id: 'unit-pcs' },
      update: {},
      create: { id: 'unit-pcs', nameUz: 'dona', nameRu: 'шт', nameEn: 'pcs' },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-kg' },
      update: {},
      create: { id: 'unit-kg', nameUz: 'kg', nameRu: 'кг', nameEn: 'kg' },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-box' },
      update: {},
      create: { id: 'unit-box', nameUz: 'quti', nameRu: 'кор', nameEn: 'box' },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-bottle' },
      update: {},
      create: { id: 'unit-bottle', nameUz: 'shisha', nameRu: 'бут', nameEn: 'bottle' },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-pack' },
      update: {},
      create: { id: 'unit-pack', nameUz: 'paket', nameRu: 'уп', nameEn: 'pack' },
    }),
    prisma.unit.upsert({
      where: { id: 'unit-liter' },
      update: {},
      create: { id: 'unit-liter', nameUz: 'litr', nameRu: 'л', nameEn: 'liter' },
    }),
  ]);

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { id: 'cat-beverages' },
      update: {},
      create: {
        id: 'cat-beverages',
        nameUz: 'Ichimliklar',
        nameRu: 'Напитки',
        nameEn: 'Beverages',
        sortOrder: 1,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-food' },
      update: {},
      create: {
        id: 'cat-food',
        nameUz: 'Oziq-ovqat',
        nameRu: 'Продукты',
        nameEn: 'Food',
        sortOrder: 2,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-snacks' },
      update: {},
      create: {
        id: 'cat-snacks',
        nameUz: 'Gazaklar',
        nameRu: 'Закуски',
        nameEn: 'Snacks',
        sortOrder: 3,
      },
    }),
    prisma.category.upsert({
      where: { id: 'cat-household' },
      update: {},
      create: {
        id: 'cat-household',
        nameUz: 'Uy-ro\'zg\'or',
        nameRu: 'Хозтовары',
        nameEn: 'Household',
        sortOrder: 4,
      },
    }),
  ]);

  // Create sample products
  await Promise.all([
    prisma.product.upsert({
      where: { id: 'prod-cola' },
      update: {},
      create: {
        id: 'prod-cola',
        nameUz: 'Coca Cola',
        nameRu: 'Кока Кола',
        nameEn: 'Coca Cola',
        descriptionUz: 'Serinletuvchi ichimlik 500ml',
        descriptionRu: 'Освежающий напиток 500мл',
        descriptionEn: 'Refreshing beverage 500ml',
        price: 3000,
        categoryId: 'cat-beverages',
        unitId: 'unit-bottle',
        stockQuantity: 100,
        sortOrder: 1,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-rice' },
      update: {},
      create: {
        id: 'prod-rice',
        nameUz: 'Guruch',
        nameRu: 'Рис',
        nameEn: 'Rice',
        descriptionUz: 'Premium sifatli guruch',
        descriptionRu: 'Рис премиум качества',
        descriptionEn: 'Premium quality rice',
        price: 20000,
        categoryId: 'cat-food',
        unitId: 'unit-kg',
        stockQuantity: 50,
        sortOrder: 1,
      },
    }),
    prisma.product.upsert({
      where: { id: 'prod-chips' },
      update: {},
      create: {
        id: 'prod-chips',
        nameUz: 'Kartoshka chipslari',
        nameRu: 'Картофельные чипсы',
        nameEn: 'Potato Chips',
        descriptionUz: 'Tuzlangan kartoshka chipslari',
        descriptionRu: 'Солёные картофельные чипсы',
        descriptionEn: 'Salted potato chips',
        price: 5000,
        categoryId: 'cat-snacks',
        unitId: 'unit-pack',
        stockQuantity: 200,
        sortOrder: 1,
      },
    }),
  ]);

  // Create a bank account
  await prisma.bankAccount.upsert({
    where: { id: 'bank-main' },
    update: {},
    create: {
      id: 'bank-main',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      holderName: 'Shop Owner',
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('✅ Seed complete!');
  console.log(`   ${units.length} units`);
  console.log(`   ${categories.length} categories`);
  console.log(`   3 products`);
  console.log(`   1 bank account`);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
