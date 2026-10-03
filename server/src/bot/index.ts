import { Bot, InlineKeyboard, InputFile } from 'grammy';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import prisma from '../config/database';

let bot: Bot | null = null;

function buildOrderMessageText(order: any, statusTextOverride?: string): string {
  const addressParts: string[] = [];
  if (order.deliveryAddress) {
    addressParts.push(`📍 <b>Yetkazib berish manzili:</b>\n<code>${order.deliveryAddress}</code>`);
  }
  if (order.buildingNumber) {
    addressParts.push(`🏢 <b>Bino raqami:</b>\n<code>${order.buildingNumber}</code>`);
  }
  if (order.homeNumber) {
    addressParts.push(`🚪 <b>Uy / Xonadon:</b>\n<code>${order.homeNumber}</code>`);
  }
  if (order.entranceCode) {
    addressParts.push(`🔐 <b>Kirish kodi:</b>\n<code>${order.entranceCode}</code>`);
  }
  const formattedAddressSection = addressParts.length > 0
    ? addressParts.join('\n\n')
    : `📍 <b>Yetkazib berish manzili:</b>\n<i>Manzil kiritilmagan</i>`;

  const itemsText = order.items && order.items.length > 0
    ? order.items
        .map((item: any, i: number) => `${i + 1}. <b>${item.productName}</b>\n   ${item.quantity} × ₩${item.unitPrice.toLocaleString()} = <b>₩${item.total.toLocaleString()}</b>`)
        .join('\n\n')
    : 'Tovarlar mavjud emas';

  const statusDisplay = statusTextOverride || order.orderStatus;
  const paymentDisplay = order.paymentStatus === 'PAID'
    ? '✅ To\'langan (PAID)'
    : order.paymentStatus === 'PAYMENT_SUBMITTED'
    ? '💳 Chek yuklangan (PAYMENT_SUBMITTED)'
    : '⏳ To\'lanmagan (UNPAID)';

  return `━━━━━━━━━━━━━━━━━━
🛒 <b>YANGI BUYURTMA #${order.orderNumber}</b>
━━━━━━━━━━━━━━━━━━

👤 <b>Xaridor:</b> ${order.customerName}

📱 <b>Telefon (nusxalash uchun bosing):</b>
<code>${order.customerPhone}</code>

${formattedAddressSection}

━━━━━━━━━━━━━━━━━━
📦 <b>BUYURTMA TARKIBI:</b>

${itemsText}

━━━━━━━━━━━━━━━━━━
💰 <b>JAMI: ₩${order.total.toLocaleString()}</b>
💳 <b>To'lov:</b> ${paymentDisplay}
📌 <b>Holat:</b> <b>${statusDisplay}</b>
📅 ${new Date(order.createdAt || Date.now()).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
━━━━━━━━━━━━━━━━━━`;
}

function buildOrderKeyboard(orderId: string, currentStatus: string): InlineKeyboard {
  const keyboard = new InlineKeyboard();

  if (currentStatus === 'PENDING') {
    keyboard
      .text('✅ Tasdiqlash', `order:confirm:${orderId}`)
      .text('❌ Bekor qilish', `order:cancel:${orderId}`);
  } else if (currentStatus === 'CONFIRMED') {
    keyboard
      .text("📦 Jo'natildi", `order:ship:${orderId}`)
      .text('❌ Bekor qilish', `order:cancel:${orderId}`);
  }
  // Once shipped ("Jo'natildi"), no buttons needed anymore!

  return keyboard;
}

export function createBot(): Bot {
  if (!config.telegram.botToken) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not set. Bot will not start.');
    bot = new Bot('placeholder:token');
    return bot;
  }

  bot = new Bot(config.telegram.botToken);

  // /start command — launches the Mini App
  bot.command('start', async (ctx) => {
    const keyboard = new InlineKeyboard().webApp(
      '🛍 Open Shop',
      config.telegram.miniAppUrl || 'https://example.com'
    );

    await ctx.reply(
      '🛒 Welcome to the Shop!\n\n' +
      'Tap the button below to start shopping.',
      { reply_markup: keyboard }
    );
  });

  // /help command
  bot.command('help', async (ctx) => {
    await ctx.reply(
      '🛍 *Shop Bot*\n\n' +
      'Use the button below to open the shop and browse products.\n\n' +
      '📦 Browse products\n' +
      '🛒 Add to basket\n' +
      '📋 Place orders\n' +
      '❤️ Save favorites\n\n' +
      'Tap /start to open the shop.',
      { parse_mode: 'Markdown' }
    );
  });

  // ─── Order Action Callbacks ──────────────────────────────────────────────────

  // 1. Confirm Order
  bot.callbackQuery(/^order:confirm:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) {
        await ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi!' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'CONFIRMED',
          statusHistory: {
            create: { status: 'CONFIRMED', note: 'Admin bot orqali tasdiqladi' },
          },
        },
        include: { items: true },
      });

      // Notify customer if available
      if (order.user?.telegramId) {
        sendUserNotification(
          order.user.telegramId,
          `✅ <b>Buyurtmangiz tasdiqlandi!</b>\n\nBuyurtma raqami: <b>#${order.orderNumber}</b>\nTez orada tayyorlanadi va jo'natiladi.`
        ).catch(console.error);
      }

      await ctx.answerCallbackQuery({ text: '✅ Buyurtma tasdiqlandi!' });

      const newText = buildOrderMessageText(updated, '✅ TASDIQLANGAN (CONFIRMED)');
      const newKeyboard = buildOrderKeyboard(orderId, 'CONFIRMED');

      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({
          caption: newText,
          parse_mode: 'HTML',
          reply_markup: newKeyboard,
        });
      } else {
        await ctx.editMessageText(newText, {
          parse_mode: 'HTML',
          reply_markup: newKeyboard,
        });
      }
    } catch (err) {
      console.error('Error confirming order:', err);
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi!' });
    }
  });

  // 2. Ship Order ("Jo'natildi")
  bot.callbackQuery(/^order:ship:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) {
        await ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi!' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'READY',
          statusHistory: {
            create: { status: 'READY', note: "Jo'natildi (Kuryerga berildi)" },
          },
        },
        include: { items: true },
      });

      // Notify customer
      if (order.user?.telegramId) {
        sendUserNotification(
          order.user.telegramId,
          `📦 <b>Buyurtmangiz jo'natildi!</b>\n\nBuyurtma raqami: <b>#${order.orderNumber}</b>\nKuryer orqali manzilingizga yo'l oldi.`
        ).catch(console.error);
      }

      await ctx.answerCallbackQuery({ text: "📦 Buyurtma jo'natildi deb belgilandi!" });

      const newText = buildOrderMessageText(updated, "📦 JO'NATILDI (SHIPPED / READY)");

      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({
          caption: newText,
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(), // No more buttons after shipped
        });
      } else {
        await ctx.editMessageText(newText, {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(),
        });
      }
    } catch (err) {
      console.error('Error shipping order:', err);
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi!' });
    }
  });

  // 3. Complete Order
  bot.callbackQuery(/^order:complete:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) {
        await ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi!' });
        return;
      }

      const updated = await prisma.order.update({
        where: { id: orderId },
        data: {
          orderStatus: 'COMPLETED',
          completedAt: new Date(),
          statusHistory: {
            create: { status: 'COMPLETED', note: 'Yetkazildi va yakunlandi' },
          },
        },
        include: { items: true },
      });

      // Notify customer
      if (order.user?.telegramId) {
        sendUserNotification(
          order.user.telegramId,
          `🏁 <b>Buyurtmangiz yetkazildi!</b>\n\nBuyurtma raqami: <b>#${order.orderNumber}</b>\nXaridingiz uchun rahmat!`
        ).catch(console.error);
      }

      await ctx.answerCallbackQuery({ text: '🏁 Buyurtma muvaffaqiyatli yakunlandi!' });

      const newText = buildOrderMessageText(updated, '🏁 BAJARILDI (COMPLETED)');

      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({
          caption: newText,
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(), // No more buttons
        });
      } else {
        await ctx.editMessageText(newText, {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(),
        });
      }
    } catch (err) {
      console.error('Error completing order:', err);
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi!' });
    }
  });

  // 4. Cancel Order
  bot.callbackQuery(/^order:cancel:(.+)$/, async (ctx) => {
    const orderId = ctx.match[1];
    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, user: true },
      });

      if (!order) {
        await ctx.answerCallbackQuery({ text: 'Buyurtma topilmadi!' });
        return;
      }

      // Restore stock and cancel
      const updated = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }

        return tx.order.update({
          where: { id: orderId },
          data: {
            orderStatus: 'CANCELLED',
            cancelledAt: new Date(),
            statusHistory: {
              create: { status: 'CANCELLED', note: 'Admin bot orqali bekor qildi' },
            },
          },
          include: { items: true },
        });
      });

      // Notify customer
      if (order.user?.telegramId) {
        sendUserNotification(
          order.user.telegramId,
          `❌ <b>Buyurtmangiz bekor qilindi.</b>\n\nBuyurtma raqami: <b>#${order.orderNumber}</b>\nSavollaringiz bo'lsa biz bilan bog'laning.`
        ).catch(console.error);
      }

      await ctx.answerCallbackQuery({ text: '❌ Buyurtma bekor qilindi!' });

      const newText = buildOrderMessageText(updated, '❌ BEKOR QILINDI (CANCELLED)');

      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({
          caption: newText,
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(),
        });
      } else {
        await ctx.editMessageText(newText, {
          parse_mode: 'HTML',
          reply_markup: new InlineKeyboard(),
        });
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      await ctx.answerCallbackQuery({ text: 'Xatolik yuz berdi!' });
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}

export function getBot(): Bot | null {
  return bot;
}

/**
 * Send a rich order notification to the admin chat with optional payment proof photo and action buttons
 */
export async function sendAdminOrderNotification(order: any, relativePhotoPath?: string | null): Promise<void> {
  const b = getBot();
  if (!b || !config.telegram.adminChatId) {
    console.log('Admin notification (no bot/chat configured) for order:', order.orderNumber);
    return;
  }

  const messageText = buildOrderMessageText(order);
  const keyboard = buildOrderKeyboard(order.id, order.orderStatus);

  const photoFile = relativePhotoPath || order.paymentProofImage;

  if (photoFile) {
    // Resolve clean local path from uploads
    const filename = photoFile.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(config.upload.dir, filename);

    if (fs.existsSync(absolutePath)) {
      try {
        await b.api.sendPhoto(config.telegram.adminChatId, new InputFile(absolutePath), {
          caption: messageText,
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
        return;
      } catch (err) {
        console.error('Failed to send order photo notification, falling back to text:', err);
      }
    }
  }

  // Fallback to text message
  try {
    await b.api.sendMessage(config.telegram.adminChatId, messageText, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  } catch (error) {
    console.error('Failed to send admin order notification:', error);
  }
}

/**
 * Send a general text message to the admin chat
 */
export async function sendAdminNotification(message: string): Promise<void> {
  const b = getBot();
  if (!b || !config.telegram.adminChatId) {
    console.log('Admin notification (no bot/chat configured):', message);
    return;
  }

  try {
    await b.api.sendMessage(config.telegram.adminChatId, message, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
}

/**
 * Send a message to a specific user
 */
export async function sendUserNotification(telegramId: number | bigint, message: string): Promise<void> {
  const b = getBot();
  if (!b) return;

  try {
    await b.api.sendMessage(Number(telegramId), message, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error(`Failed to send notification to user ${telegramId}:`, error);
  }
}

export async function startBot(): Promise<void> {
  if (!bot || !config.telegram.botToken) {
    console.log('⚠️  Bot not configured. Skipping bot start.');
    return;
  }

  try {
    await bot.start({
      onStart: () => {
        console.log('🤖 Telegram bot started with interactive callbacks');
      },
    });
  } catch (error) {
    console.error('Failed to start bot:', error);
  }
}

