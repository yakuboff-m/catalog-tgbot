import { getLocalizedField, type Language } from '../i18n';

export interface ShareableProduct {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  price: number;
}

/**
 * Share a product using Telegram's native share picker, Web Share API, or clipboard copy.
 * Posts a clean single link with rich Open Graph photo preview card and direct launch into
 * the native Telegram Mini App.
 */
export async function shareProduct(product: ShareableProduct, language: Language): Promise<'shared' | 'copied'> {
  const tg = (window as any).Telegram?.WebApp;
  const name = getLocalizedField(product, 'name', language);
  const formattedPrice = `₩${product.price.toLocaleString()}`;

  const origin = window.location.origin.includes('localhost')
    ? 'https://constant-company-partner.ngrok-free.dev'
    : window.location.origin;

  const botUsername = 'MuslimMarketkr_bot';
  const appName = 'app';
  const directMiniAppUrl = `https://t.me/${botUsername}/${appName}?startapp=prod_${product.id}`;
  const previewShareUrl = `${origin}/share/${product.id}`;
  // Keep shareText clean without duplicate URLs so only ONE single link appears in Telegram chats
  const shareText = `🛍️ ${name} · ${formattedPrice}\nMuslim Market Catalog`;

  // 1. If inside Telegram WebApp, open Telegram's forward/share picker
  if (tg?.openTelegramLink) {
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(previewShareUrl)}&text=${encodeURIComponent(shareText)}`;
    tg.openTelegramLink(telegramShareUrl);
    return 'shared';
  }

  // 2. Web Share API (mobile Chrome / Safari)
  if (navigator.share) {
    try {
      await navigator.share({
        title: name,
        text: shareText,
        url: previewShareUrl,
      });
      return 'shared';
    } catch (err: any) {
      if (err?.name === 'AbortError') return 'shared';
    }
  }

  // 3. Fallback: copy to clipboard
  try {
    await navigator.clipboard.writeText(directMiniAppUrl);
    return 'copied';
  } catch {
    return 'copied';
  }
}
