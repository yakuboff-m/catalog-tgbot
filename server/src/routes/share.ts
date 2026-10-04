import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { config } from '../config';

const router = Router();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * GET /share/:productId (and /p/:productId)
 * - Social link crawlers (TelegramBot, WhatsApp, etc.): Serves Open Graph meta tags (og:image, og:title)
 *   so chats display the high-quality product photo preview card.
 * - Human visitors: Directly redirects to /product/:productId, opening the actual Product Detail page
 *   immediately with no intermediate landing screens or button taps.
 */
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const productId = req.params.productId as string;
    const userAgent = req.get('user-agent') || '';
    const isBot = /bot|crawler|spider|robot|crawling|telegrambot|twitterbot|facebookexternalhit|whatsapp/i.test(userAgent);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        unit: true,
      },
    });

    if (!product) {
      return res.redirect('/');
    }

    const host = req.get('host') || 'localhost:3001';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    let baseUrl = config.telegram.miniAppUrl || `${protocol}://${host}`;
    if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
      baseUrl = 'https://constant-company-partner.ngrok-free.dev';
    }

    const productWebUrl = `/product/${product.id}`;

    // For human visitors tapping the link, immediately redirect to the product detail page!
    if (!isBot) {
      return res.redirect(productWebUrl);
    }

    // For crawlers (TelegramBot, etc.), construct full photo URL and serve Open Graph tags
    let fullPhotoUrl = '';
    if (product.photo) {
      if (product.photo.startsWith('http://') || product.photo.startsWith('https://')) {
        fullPhotoUrl = product.photo;
      } else {
        const cleanPath = product.photo.startsWith('/') ? product.photo : `/${product.photo}`;
        fullPhotoUrl = `${baseUrl}${cleanPath}`;
      }
    }

    const productName = product.nameEn || product.nameUz || product.nameRu || 'Product';
    const formattedPrice = `₩${product.price.toLocaleString()}`;
    const title = `${productName} · ${formattedPrice}`;
    const description = product.descriptionEn || product.descriptionUz || product.descriptionRu || 'Muslim Market · Halal Grocery & Meat Catalog';
    const currentShareUrl = `${baseUrl}/share/${product.id}`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)} | Muslim Market</title>

  <!-- Open Graph / Telegram / WhatsApp / Social Preview -->
  <meta property="og:site_name" content="Muslim Market" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(currentShareUrl)}" />
  ${fullPhotoUrl ? `
  <meta property="og:image" content="${escapeHtml(fullPhotoUrl)}" />
  <meta property="og:image:secure_url" content="${escapeHtml(fullPhotoUrl)}" />
  <meta property="og:image:type" content="image/jpeg" />
  <meta property="og:image:width" content="800" />
  <meta property="og:image:height" content="800" />
  <meta property="og:image:alt" content="${escapeHtml(productName)}" />` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(title)}" />
  <meta name="twitter:description" content="${escapeHtml(description)}" />
  ${fullPhotoUrl ? `<meta name="twitter:image" content="${escapeHtml(fullPhotoUrl)}" />` : ''}

  <script>
    window.location.replace("${productWebUrl}");
  </script>
</head>
<body style="margin: 0; background: #0F172A; color: white; display: flex; align-items: center; justify-content: center; min-height: 100vh; font-family: sans-serif;">
  <div style="text-align: center;">
    <p>Opening product...</p>
    <a href="${productWebUrl}" style="color: #38BDF8; font-weight: bold;">Click here if not redirected</a>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error('Error serving product share preview:', error);
    return res.redirect('/');
  }
});

export default router;
