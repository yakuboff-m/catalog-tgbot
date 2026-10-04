// ─── Localization System ──────────────────────────────────────────────────────
// Supports: uz (Uzbek), ru (Russian), en (English)

export type Language = 'uz' | 'ru' | 'en';

type TranslationKey = keyof typeof translations.en;

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.categories': 'Categories',
    'nav.favorites': 'Favorites',
    'nav.orders': 'Orders',
    'nav.profile': 'Profile',

    // Header
    'header.search': 'Search products...',
    'header.basket': 'Basket',

    // Home
    'home.popular': 'Popular Products',
    'home.new': 'New Arrivals',
    'home.categories': 'Categories',
    'home.news': 'News',
    'home.viewAll': 'View All',
    'home.welcomeBanner': 'Welcome to our shop!',
    'home.priceBanner': 'Best prices guaranteed',
    'home.uncompletedOrder': 'You have an uncompleted order',
    'home.completeOrder': 'Complete',
    'home.pendingOrderReceipt': 'Awaiting payment receipt',
    'home.uploadReceipt': 'Upload Receipt',

    // Product
    'product.addToBasket': 'Add to Basket',
    'product.outOfStock': 'Out of Stock',
    'product.inStock': 'In Stock',
    'product.description': 'Description',
    'product.category': 'Category',

    // Basket
    'basket.title': 'Basket',
    'basket.empty': 'Your basket is empty',
    'basket.emptyDesc': 'Start shopping to add products',
    'basket.startShopping': 'Start Shopping',
    'basket.total': 'Total',
    'basket.checkout': 'Checkout',
    'basket.clear': 'Clear Basket',
    'basket.items': 'items',

    // Favorites
    'favorites.title': 'Favorites',
    'favorites.empty': "You haven't added any favorites yet",
    'favorites.emptyDesc': 'Tap the heart icon on products you love',

    // Orders
    'orders.title': 'My Orders',
    'orders.empty': "You haven't placed any orders yet",
    'orders.emptyDesc': 'Your order history will appear here',
    'orders.orderNumber': 'Order',
    'orders.placed': 'Placed',
    'orders.items': 'items',

    // Order Status
    'status.PENDING': 'Pending',
    'status.CONFIRMED': 'Confirmed',
    'status.PROCESSING': 'Processing',
    'status.READY': 'Ready',
    'status.COMPLETED': 'Completed',
    'status.CANCELLED': 'Cancelled',

    // Payment Status
    'payment.UNPAID': 'Unpaid',
    'payment.PAYMENT_SUBMITTED': 'Payment Submitted',
    'payment.PAID': 'Paid',
    'payment.PAYMENT_REJECTED': 'Payment Rejected',

    // Checkout
    'checkout.title': 'Checkout',
    'checkout.deliveryInfo': 'Delivery Information',
    'checkout.fullName': 'Full Name',
    'checkout.phone': 'Phone Number',
    'checkout.address': 'Address',
    'checkout.building': 'Building Number',
    'checkout.home': 'Apartment/Home',
    'checkout.entrance': 'Entrance Code',
    'checkout.optional': 'optional',
    'checkout.save': 'Save Information',
    'checkout.placeOrder': 'Place Order',
    'checkout.confirm': 'Confirm & Place Order',
    'checkout.edit': 'Edit',
    'checkout.orderSummary': 'Order Summary',
    'checkout.subtotal': 'Subtotal',
    'checkout.deliveryFee': 'Delivery Fee',
    'checkout.free': 'Free',
    'checkout.step2Title': 'Step 2: Payment & Receipt',
    'checkout.step2Desc': 'Please transfer the amount to the bank account below and upload a receipt screenshot.',
    'checkout.orderAccepted': 'Your order is accepted 🎉',
    'checkout.orderAcceptedDesc': 'Your payment receipt was submitted and sent for admin review!',
    'checkout.awaitingPayment': 'Awaiting Payment',
    'checkout.amountToTransfer': 'Amount to transfer:',
    'checkout.bankDetails': 'Payment Details (Bank Transfer)',
    'checkout.holder': 'Holder',
    'checkout.tapToCopy': 'tap to copy',
    'checkout.uploadReceipt': 'Upload Payment Receipt (Screenshot)',
    'checkout.uploadReceiptDesc': 'Upload transfer screenshot from your banking app. The order is processed after receipt is uploaded.',
    'checkout.receiptRequired': 'Required',
    'checkout.receiptUploaded': 'Uploaded',
    'checkout.receiptAlert': 'Please upload the payment receipt screenshot first!',
    'checkout.receiptAccepted': 'Receipt accepted (Admin reviewing)',
    'checkout.uploadAnother': 'Upload another receipt',
    'checkout.chooseReceipt': 'Choose receipt screenshot',
    'checkout.chooseReceiptSub': 'Tap to choose image or take photo',
    'checkout.uploadAndFinish': 'Upload Receipt & Complete',
    'checkout.uploadLater': 'Upload later (Back to Home)',
    'checkout.viewOrders': 'View My Orders',
    'checkout.backHome': 'Back to Home',
    'checkout.pendingBannerTitle': 'Unfinished Order',
    'checkout.pendingBannerSub': 'Awaiting receipt upload',
    'checkout.pendingBannerDesc': 'Upload receipt to complete order',
    'checkout.uploadReceiptBtn': 'Upload Receipt',
    'checkout.noBanks': 'Please contact the shop admin for bank account details.',
    'checkout.destinationSummary': 'Order & Delivery Summary',
    'checkout.deliveringTo': 'Delivering to:',
    'checkout.enterAddressAbove': '(Please enter address above)',
    'checkout.buildingLabel': 'Bldg',
    'checkout.homeLabel': 'Apt/Room',
    'checkout.confirmAndProceed': 'Confirm',
    'checkout.backToBasket': 'Back to Basket',
    'checkout.itemsCount': 'items',
    'checkout.uploading': 'Uploading...',
    'checkout.wait': 'Please wait...',
    'checkout.copy': 'Copy',
    'checkout.copied': 'Copied!',

    // Payment
    'payment.title': 'Payment Information',
    'payment.bank': 'Bank',
    'payment.account': 'Account Number',
    'payment.holder': 'Account Holder',
    'payment.amount': 'Amount',
    'payment.copy': 'Copy',
    'payment.copied': 'Copied!',
    'payment.uploadProof': 'Upload Payment Proof',

    // Profile
    'profile.title': 'Profile',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
    'profile.deliveryInfo': 'Delivery Information',
    'profile.savedInfo': 'Saved delivery info',
    'profile.noInfo': 'No delivery info saved',

    // Theme
    'theme.system': 'System',
    'theme.light': 'Light',
    'theme.dark': 'Dark',

    // General
    'general.loading': 'Loading...',
    'general.error': 'Something went wrong',
    'general.retry': 'Retry',
    'general.cancel': 'Cancel',
    'general.confirm': 'Confirm',
    'general.save': 'Save',
    'general.delete': 'Delete',
    'general.edit': 'Edit',
    'general.back': 'Back',
    'general.search': 'Search',
    'general.noResults': 'No results found',
    'general.seeAll': 'See All',

    // Admin
    'admin.dashboard': 'Dashboard',
    'admin.products': 'Products',
    'admin.categories': 'Categories',
    'admin.units': 'Units',
    'admin.orders': 'Orders',
    'admin.users': 'Users',
    'admin.news': 'News',
    'admin.banners': 'Banners',
    'admin.bankAccounts': 'Bank Accounts',
    'admin.settings': 'Settings',
    'admin.totalUsers': 'Total Users',
    'admin.totalOrders': 'Total Orders',
    'admin.pendingOrders': 'Pending Orders',
    'admin.totalProducts': 'Total Products',
    'admin.revenue': 'Revenue',
  },

  ru: {
    // Navigation
    'nav.home': 'Главная',
    'nav.categories': 'Категории',
    'nav.favorites': 'Избранное',
    'nav.orders': 'Заказы',
    'nav.profile': 'Профиль',

    // Header
    'header.search': 'Поиск товаров...',
    'header.basket': 'Корзина',

    // Home
    'home.popular': 'Популярные товары',
    'home.new': 'Новинки',
    'home.categories': 'Категории',
    'home.news': 'Новости',
    'home.viewAll': 'Все',
    'home.welcomeBanner': 'Добро пожаловать в наш магазин!',
    'home.priceBanner': 'Лучшие цены гарантированы',
    'home.uncompletedOrder': 'У вас незавершенный заказ',
    'home.completeOrder': 'Завершить',
    'home.pendingOrderReceipt': 'Ожидает чек об оплате',
    'home.uploadReceipt': 'Загрузить чек',

    // Product
    'product.addToBasket': 'В корзину',
    'product.outOfStock': 'Нет в наличии',
    'product.inStock': 'В наличии',
    'product.description': 'Описание',
    'product.category': 'Категория',

    // Basket
    'basket.title': 'Корзина',
    'basket.empty': 'Ваша корзина пуста',
    'basket.emptyDesc': 'Начните покупки',
    'basket.startShopping': 'Начать покупки',
    'basket.total': 'Итого',
    'basket.checkout': 'Оформить',
    'basket.clear': 'Очистить',
    'basket.items': 'товаров',

    // Favorites
    'favorites.title': 'Избранное',
    'favorites.empty': 'Нет избранных товаров',
    'favorites.emptyDesc': 'Нажмите на сердечко, чтобы добавить',

    // Orders
    'orders.title': 'Мои заказы',
    'orders.empty': 'Нет заказов',
    'orders.emptyDesc': 'История заказов появится здесь',
    'orders.orderNumber': 'Заказ',
    'orders.placed': 'Создан',
    'orders.items': 'товаров',

    // Order Status
    'status.PENDING': 'Ожидает',
    'status.CONFIRMED': 'Подтверждён',
    'status.PROCESSING': 'Обрабатывается',
    'status.READY': 'Готов',
    'status.COMPLETED': 'Завершён',
    'status.CANCELLED': 'Отменён',

    // Payment Status
    'payment.UNPAID': 'Не оплачен',
    'payment.PAYMENT_SUBMITTED': 'Оплата отправлена',
    'payment.PAID': 'Оплачен',
    'payment.PAYMENT_REJECTED': 'Оплата отклонена',

    // Checkout
    'checkout.title': 'Оформление',
    'checkout.deliveryInfo': 'Информация о доставке',
    'checkout.fullName': 'Полное имя',
    'checkout.phone': 'Номер телефона',
    'checkout.address': 'Адрес',
    'checkout.building': 'Номер здания',
    'checkout.home': 'Квартира/Дом',
    'checkout.entrance': 'Код входа',
    'checkout.optional': 'необязательно',
    'checkout.save': 'Сохранить',
    'checkout.placeOrder': 'Оформить заказ',
    'checkout.confirm': 'Подтвердить и заказать',
    'checkout.edit': 'Изменить',
    'checkout.orderSummary': 'Итого заказа',
    'checkout.subtotal': 'Подитог',
    'checkout.deliveryFee': 'Доставка',
    'checkout.free': 'Бесплатно',
    'checkout.step2Title': 'Шаг 2: Оплата и чек',
    'checkout.step2Desc': 'Пожалуйста, переведите сумму на банковский счет ниже и загрузите скриншот чека.',
    'checkout.orderAccepted': 'Ваш заказ принят 🎉',
    'checkout.orderAcceptedDesc': 'Чек об оплате успешно принят и передан администратору!',
    'checkout.awaitingPayment': 'Ожидает оплаты',
    'checkout.amountToTransfer': 'Сумма к переводу:',
    'checkout.bankDetails': 'Реквизиты для оплаты (Банк. перевод)',
    'checkout.holder': 'Владелец',
    'checkout.tapToCopy': 'нажмите',
    'checkout.uploadReceipt': 'Загрузка чека об оплате (скриншот)',
    'checkout.uploadReceiptDesc': 'Загрузите скриншот перевода из банковского приложения. Заказ оформляется после загрузки чека.',
    'checkout.receiptRequired': 'Обязательно',
    'checkout.receiptUploaded': 'Загружен',
    'checkout.receiptAlert': 'Пожалуйста, сначала загрузите скриншот чека!',
    'checkout.receiptAccepted': 'Чек принят (Администратор проверяет)',
    'checkout.uploadAnother': 'Загрузить другой чек',
    'checkout.chooseReceipt': 'Выбрать скриншот чека',
    'checkout.chooseReceiptSub': 'Нажмите, чтобы выбрать фото или снять на камеру',
    'checkout.uploadAndFinish': 'Загрузить чек и завершить',
    'checkout.uploadLater': 'Загрузить позже (На главную)',
    'checkout.viewOrders': 'Посмотреть мои заказы',
    'checkout.backHome': 'Вернуться на главную',
    'checkout.pendingBannerTitle': 'Незавершенный заказ',
    'checkout.pendingBannerSub': 'Ожидает загрузки чека',
    'checkout.pendingBannerDesc': 'Загрузите чек для завершения заказа',
    'checkout.uploadReceiptBtn': 'Загрузить чек',
    'checkout.noBanks': 'Свяжитесь с администратором для получения реквизитов.',
    'checkout.destinationSummary': 'Сводка заказа и доставки',
    'checkout.deliveringTo': 'Адрес доставки:',
    'checkout.enterAddressAbove': '(Укажите адрес выше)',
    'checkout.buildingLabel': 'Здание',
    'checkout.homeLabel': 'Кв/Офис',
    'checkout.confirmAndProceed': 'Подтвердить',
    'checkout.backToBasket': 'Назад в корзину',
    'checkout.itemsCount': 'товаров',
    'checkout.uploading': 'Загрузка...',
    'checkout.wait': 'Подождите...',
    'checkout.copy': 'Копировать',
    'checkout.copied': 'Скопировано!',

    // Payment
    'payment.title': 'Платёжная информация',
    'payment.bank': 'Банк',
    'payment.account': 'Номер счёта',
    'payment.holder': 'Владелец счёта',
    'payment.amount': 'Сумма',
    'payment.copy': 'Копировать',
    'payment.copied': 'Скопировано!',
    'payment.uploadProof': 'Загрузить чек',

    // Profile
    'profile.title': 'Профиль',
    'profile.language': 'Язык',
    'profile.theme': 'Тема',
    'profile.deliveryInfo': 'Данные доставки',
    'profile.savedInfo': 'Сохранённые данные',
    'profile.noInfo': 'Нет сохранённых данных',

    // Theme
    'theme.system': 'Системная',
    'theme.light': 'Светлая',
    'theme.dark': 'Тёмная',

    // General
    'general.loading': 'Загрузка...',
    'general.error': 'Что-то пошло не так',
    'general.retry': 'Повторить',
    'general.cancel': 'Отмена',
    'general.confirm': 'Подтвердить',
    'general.save': 'Сохранить',
    'general.delete': 'Удалить',
    'general.edit': 'Изменить',
    'general.back': 'Назад',
    'general.search': 'Поиск',
    'general.noResults': 'Ничего не найдено',
    'general.seeAll': 'Все',

    // Admin
    'admin.dashboard': 'Панель',
    'admin.products': 'Товары',
    'admin.categories': 'Категории',
    'admin.units': 'Единицы',
    'admin.orders': 'Заказы',
    'admin.users': 'Пользователи',
    'admin.news': 'Новости',
    'admin.banners': 'Баннеры',
    'admin.bankAccounts': 'Банк. счета',
    'admin.settings': 'Настройки',
    'admin.totalUsers': 'Всего пользователей',
    'admin.totalOrders': 'Всего заказов',
    'admin.pendingOrders': 'Ожидающих',
    'admin.totalProducts': 'Всего товаров',
    'admin.revenue': 'Выручка',
  },

  uz: {
    // Navigation
    'nav.home': 'Bosh sahifa',
    'nav.categories': 'Kategoriyalar',
    'nav.favorites': 'Sevimlilar',
    'nav.orders': 'Buyurtmalar',
    'nav.profile': 'Profil',

    // Header
    'header.search': 'Mahsulot qidirish...',
    'header.basket': 'Savat',

    // Home
    'home.popular': 'Mashhur mahsulotlar',
    'home.new': 'Yangi mahsulotlar',
    'home.categories': 'Kategoriyalar',
    'home.news': 'Yangiliklar',
    'home.viewAll': 'Hammasi',
    'home.welcomeBanner': "Do'konimizga xush kelibsiz!",
    'home.priceBanner': 'Eng yaxshi narxlar kafolatlanadi',
    'home.uncompletedOrder': 'Tugallanmagan buyurtmangiz bor',
    'home.completeOrder': 'Yakunlash',
    'home.pendingOrderReceipt': "To'lov cheki kutilmoqda",
    'home.uploadReceipt': 'Chekni yuklash',

    // Product
    'product.addToBasket': 'Savatga qo\'shish',
    'product.outOfStock': 'Mavjud emas',
    'product.inStock': 'Mavjud',
    'product.description': 'Tavsif',
    'product.category': 'Kategoriya',

    // Basket
    'basket.title': 'Savat',
    'basket.empty': 'Savatingiz bo\'sh',
    'basket.emptyDesc': 'Xarid qilishni boshlang',
    'basket.startShopping': 'Xarid qilish',
    'basket.total': 'Jami',
    'basket.checkout': 'Buyurtma berish',
    'basket.clear': 'Tozalash',
    'basket.items': 'ta mahsulot',

    // Favorites
    'favorites.title': 'Sevimlilar',
    'favorites.empty': 'Hali sevimli mahsulotlar yo\'q',
    'favorites.emptyDesc': 'Yoqtirgan mahsulotlaringizga yurakchani bosing',

    // Orders
    'orders.title': 'Buyurtmalarim',
    'orders.empty': 'Hali buyurtma bermadingiz',
    'orders.emptyDesc': 'Buyurtmalar tarixi shu yerda ko\'rinadi',
    'orders.orderNumber': 'Buyurtma',
    'orders.placed': 'Yaratilgan',
    'orders.items': 'ta mahsulot',

    // Order Status
    'status.PENDING': 'Kutilmoqda',
    'status.CONFIRMED': 'Tasdiqlangan',
    'status.PROCESSING': 'Jarayonda',
    'status.READY': 'Tayyor',
    'status.COMPLETED': 'Bajarildi',
    'status.CANCELLED': 'Bekor qilindi',

    // Payment Status
    'payment.UNPAID': 'To\'lanmagan',
    'payment.PAYMENT_SUBMITTED': 'To\'lov yuborildi',
    'payment.PAID': 'To\'langan',
    'payment.PAYMENT_REJECTED': 'To\'lov rad etildi',

    // Checkout
    'checkout.title': 'Buyurtma berish',
    'checkout.deliveryInfo': 'Yetkazib berish ma\'lumotlari',
    'checkout.fullName': 'To\'liq ism',
    'checkout.phone': 'Telefon raqami',
    'checkout.address': 'Manzil',
    'checkout.building': 'Bino raqami',
    'checkout.home': 'Uy/Xonadon',
    'checkout.entrance': 'Kirish kodi',
    'checkout.optional': 'ixtiyoriy',
    'checkout.save': 'Saqlash',
    'checkout.placeOrder': 'Buyurtma berish',
    'checkout.confirm': 'Tasdiqlash va buyurtma berish',
    'checkout.edit': 'Tahrirlash',
    'checkout.orderSummary': 'Buyurtma xulosasi',
    'checkout.subtotal': 'Oraliq jami',
    'checkout.deliveryFee': 'Yetkazib berish',
    'checkout.free': 'Bepul',
    'checkout.step2Title': "2-Bosqich: To'lov va Chek yuklash",
    'checkout.step2Desc': "Buyurtmani yakunlash uchun quyidagi bank hisobiga to'lov qiling va pastda chek skrinshotini yuklang.",
    'checkout.orderAccepted': 'Buyurtmangiz qabul qilindi 🎉',
    'checkout.orderAcceptedDesc': "To'lov chekingiz muvaffaqiyatli qabul qilindi va admin tekshiruviga yuborildi!",
    'checkout.awaitingPayment': "To'lov kutilmoqda",
    'checkout.amountToTransfer': "O'tkazilishi kerak bo'lgan summa:",
    'checkout.bankDetails': "To'lov ma'lumotlari (Bank Transfer)",
    'checkout.holder': 'Egasi',
    'checkout.tapToCopy': 'bosing',
    'checkout.uploadReceipt': "To'lov tasdig'ini yuklash (Screenshot)",
    'checkout.uploadReceiptDesc': "Bank ilovasidan o'tkazma chekining skrinshotini yuklang. Chek yuklangachgina buyurtma qabul qilinadi.",
    'checkout.receiptRequired': 'Majburiy',
    'checkout.receiptUploaded': 'Yuklangan',
    'checkout.receiptAlert': "Iltimos, avval to'lov cheki skrinshotini yuklang!",
    'checkout.receiptAccepted': 'Chek qabul qilindi (Admin tekshirmoqda)',
    'checkout.uploadAnother': 'Boshqa chek yuklash',
    'checkout.chooseReceipt': 'Chek skrinshotini tanlash',
    'checkout.chooseReceiptSub': 'Rasm tanlash yoki kameradan tushirish uchun bosing',
    'checkout.uploadAndFinish': 'Chekni yuklash va yakunlash',
    'checkout.uploadLater': 'Keyinroq yuklayman (Bosh sahifaga)',
    'checkout.viewOrders': "Buyurtmalarimni ko'rish",
    'checkout.backHome': 'Bosh sahifaga qaytish',
    'checkout.pendingBannerTitle': 'Yakunlanmagan buyurtma',
    'checkout.pendingBannerSub': 'Chek hali yuklanmagan',
    'checkout.pendingBannerDesc': 'Chek yuklash va buyurtmani yakunlash',
    'checkout.uploadReceiptBtn': 'Chek yuklash',
    'checkout.noBanks': "Bank hisob raqami haqida ma'lumot olish uchun do'kon admini bilan bog'laning.",
    'checkout.destinationSummary': 'Buyurtma va yetkazib berish xulosasi',
    'checkout.deliveringTo': 'Qaysi manzilga buyurtma berilmoqda:',
    'checkout.enterAddressAbove': '(Manzil yuqorida kiritilishi kerak)',
    'checkout.buildingLabel': 'Bino',
    'checkout.homeLabel': 'Uy/Xona',
    'checkout.confirmAndProceed': 'Tasdiqlash',
    'checkout.backToBasket': 'Savatga qaytish',
    'checkout.itemsCount': 'ta mahsulot',
    'checkout.uploading': 'Yuklanmoqda...',
    'checkout.wait': 'Kuting...',
    'checkout.copy': 'Nusxalash',
    'checkout.copied': 'Nusxalandi!',

    // Payment
    'payment.title': 'To\'lov ma\'lumotlari',
    'payment.bank': 'Bank',
    'payment.account': 'Hisob raqami',
    'payment.holder': 'Hisob egasi',
    'payment.amount': 'Summa',
    'payment.copy': 'Nusxalash',
    'payment.copied': 'Nusxalandi!',
    'payment.uploadProof': 'To\'lov tasdig\'ini yuklash',

    // Profile
    'profile.title': 'Profil',
    'profile.language': 'Til',
    'profile.theme': 'Mavzu',
    'profile.deliveryInfo': 'Yetkazib berish ma\'lumotlari',
    'profile.savedInfo': 'Saqlangan ma\'lumotlar',
    'profile.noInfo': 'Saqlangan ma\'lumot yo\'q',

    // Theme
    'theme.system': 'Tizim',
    'theme.light': 'Yorug\'',
    'theme.dark': 'Qorong\'u',

    // General
    'general.loading': 'Yuklanmoqda...',
    'general.error': 'Xatolik yuz berdi',
    'general.retry': 'Qayta urinish',
    'general.cancel': 'Bekor qilish',
    'general.confirm': 'Tasdiqlash',
    'general.save': 'Saqlash',
    'general.delete': 'O\'chirish',
    'general.edit': 'Tahrirlash',
    'general.back': 'Orqaga',
    'general.search': 'Qidirish',
    'general.noResults': 'Natija topilmadi',
    'general.seeAll': 'Hammasi',

    // Admin
    'admin.dashboard': 'Boshqaruv',
    'admin.products': 'Mahsulotlar',
    'admin.categories': 'Kategoriyalar',
    'admin.units': 'Birliklar',
    'admin.orders': 'Buyurtmalar',
    'admin.users': 'Foydalanuvchilar',
    'admin.news': 'Yangiliklar',
    'admin.banners': 'Bannerlar',
    'admin.bankAccounts': 'Bank hisoblar',
    'admin.settings': 'Sozlamalar',
    'admin.totalUsers': 'Jami foydalanuvchilar',
    'admin.totalOrders': 'Jami buyurtmalar',
    'admin.pendingOrders': 'Kutilmoqda',
    'admin.totalProducts': 'Jami mahsulotlar',
    'admin.revenue': 'Daromad',
  },
} as const;

export type TranslationKeys = TranslationKey;

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang]?.[key] || translations.en[key] || key;
}

/**
 * Get localized field from a database entity
 * e.g., getLocalizedField(product, 'name', 'en') → product.nameEn
 */
export function getLocalizedField<T extends Record<string, any>>(
  entity: T,
  field: string,
  lang: Language
): string {
  const suffix = lang === 'uz' ? 'Uz' : lang === 'ru' ? 'Ru' : 'En';
  const key = `${field}${suffix}`;
  return entity[key] || entity[`${field}En`] || '';
}

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'uz', label: "O'zbekcha", flag: '🇺🇿' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
];
