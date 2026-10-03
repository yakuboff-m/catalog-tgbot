import crypto from 'crypto';
import { config } from '../config';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

interface ParsedInitData {
  user: TelegramUser;
  authDate: number;
  hash: string;
  queryId?: string;
  chatType?: string;
  chatInstance?: string;
}

/**
 * Validates Telegram WebApp initData according to official documentation.
 * https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
 */
export function validateTelegramInitData(initData: string): ParsedInitData | null {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    
    if (!hash) return null;

    // Remove hash from params and sort alphabetically
    params.delete('hash');
    const entries = Array.from(params.entries());
    entries.sort(([a], [b]) => a.localeCompare(b));
    
    const dataCheckString = entries
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    // Create HMAC-SHA256 with WebAppData key
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(config.telegram.botToken)
      .digest();

    const computedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (computedHash !== hash) {
      return null;
    }

    // Validate auth_date is not too old (allow 24 hours)
    const authDate = parseInt(params.get('auth_date') || '0', 10);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return null;
    }

    const userStr = params.get('user');
    if (!userStr) return null;

    const user: TelegramUser = JSON.parse(userStr);

    return {
      user,
      authDate,
      hash,
      queryId: params.get('query_id') || undefined,
      chatType: params.get('chat_type') || undefined,
      chatInstance: params.get('chat_instance') || undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Generate order number like ORD-10001
 */
export function generateOrderNumber(sequenceNum: number): string {
  return `ORD-${(10000 + sequenceNum).toString()}`;
}
