/**
 * Robust extractor for Telegram Mini App start_param / deep link parameter
 * across all possible Telegram WebApp delivery channels:
 * - Telegram.WebApp.initDataUnsafe.start_param
 * - Telegram.WebApp.initData (urlencoded string)
 * - window.location.hash (where Telegram iframe receives #tgWebAppData=...)
 * - window.location.search (?tgWebAppStartParam=... or ?startapp=...)
 * - window.location.pathname (/share/:id, /p/:id, /product/:id)
 */
export function extractTelegramProductDeepLink(): string | null {
  try {
    const tg = (window as any).Telegram?.WebApp;

    // 1. Telegram WebApp object: initDataUnsafe.start_param
    const unsafeParam = tg?.initDataUnsafe?.start_param;
    if (unsafeParam && typeof unsafeParam === 'string') {
      const clean = unsafeParam.trim().replace(/^(prod_|product_)/, '');
      if (clean) return clean;
    }

    // 2. Telegram WebApp object: initData string
    if (tg?.initData && typeof tg.initData === 'string') {
      const sp = new URLSearchParams(tg.initData).get('start_param');
      if (sp) {
        const clean = sp.trim().replace(/^(prod_|product_)/, '');
        if (clean) return clean;
      }
    }

    // 3. window.location.hash (Telegram iframe receives data here!)
    if (window.location.hash) {
      const hashStr = window.location.hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(hashStr);

      // Direct hash keys
      const directHash =
        hashParams.get('start_param') ||
        hashParams.get('tgWebAppStartParam') ||
        hashParams.get('startapp') ||
        hashParams.get('start');
      if (directHash) {
        const clean = directHash.trim().replace(/^(prod_|product_)/, '');
        if (clean) return clean;
      }

      // Inside tgWebAppData
      const rawWebAppData = hashParams.get('tgWebAppData');
      if (rawWebAppData) {
        const nestedParams = new URLSearchParams(rawWebAppData);
        const nestedParam = nestedParams.get('start_param');
        if (nestedParam) {
          const clean = nestedParam.trim().replace(/^(prod_|product_)/, '');
          if (clean) return clean;
        }
      }
    }

    // 4. window.location.search (Query parameters)
    const searchParams = new URLSearchParams(window.location.search);
    const queryParam =
      searchParams.get('tgWebAppStartParam') ||
      searchParams.get('start_param') ||
      searchParams.get('startapp') ||
      searchParams.get('start') ||
      searchParams.get('p') ||
      searchParams.get('productId');

    if (queryParam) {
      const clean = queryParam.trim().replace(/^(prod_|product_)/, '');
      if (clean) return clean;
    }

    // 5. window.location.pathname (/share/:id, /p/:id, /product/:id)
    if (window.location.pathname) {
      const match = window.location.pathname.match(/\/(?:product|p|share)\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const clean = match[1].trim().replace(/^(prod_|product_)/, '');
        if (clean) return clean;
      }
    }
  } catch (err) {
    console.error('Error extracting Telegram product deep link:', err);
  }

  return null;
}
