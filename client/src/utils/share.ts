import { getLocalizedField, type Language } from '../i18n';

export interface ShareableProduct {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  price: number;
}

/**
 * Share a product using Telegram's native Mini App direct link format:
 * https://t.me/MuslimMarketkr_bot/app?startapp=prod_<id>
 *
 * This ensures that clicking the link in any Telegram chat directly opens
 * the native Telegram Mini App on the specific product detail page.
 */
export async function shareProduct(product: ShareableProduct, language: Language): Promise<'shared' | 'copied'> {
  const tg = (window as any).Telegram?.WebApp;
  const name = getLocalizedField(product, 'name', language);
  const formattedPrice = `₩${product.price.toLocaleString()}`;

  const botUsername = 'MuslimMarketkr_bot';
  const appName = 'app';
  const miniAppShareUrl = `https://t.me/${botUsername}/${appName}?startapp=prod_${product.id}`;
  const shareText = `🛍️ ${name} · ${formattedPrice}\nMuslim Market Catalog`;

  // 1. If inside Telegram WebApp, open Telegram's forward/share picker with the official Mini App direct link
  if (tg?.openTelegramLink) {
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(miniAppShareUrl)}&text=${encodeURIComponent(shareText)}`;
    tg.openTelegramLink(telegramShareUrl);
    return 'shared';
  }

  // 2. Web Share API (mobile Chrome / Safari)
  if (navigator.share) {
    try {
      await navigator.share({
        title: name,
        text: shareText,
        url: miniAppShareUrl,
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'shared';
    }
  }

  // 3. Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(miniAppShareUrl);
    return 'copied';
  } catch {
    return 'copied';
  }
}
