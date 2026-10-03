import { useCallback, useEffect } from 'react';
import { useStore } from '../store';

type Theme = 'system' | 'light' | 'dark';

/**
 * Apply the resolved theme to the document.
 * Respects Telegram's theme if available.
 */
function resolveTheme(preference: Theme): 'light' | 'dark' {
  if (preference === 'system') {
    // Try Telegram's color scheme
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.colorScheme) {
      return tg.colorScheme;
    }
    // Fall back to system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }
  return preference;
}

export function useTheme() {
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);

  const applyTheme = useCallback((preference: Theme) => {
    const resolved = resolveTheme(preference);
    document.documentElement.setAttribute('data-theme', resolved);

    // Set Telegram header color
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.setHeaderColor) {
      try {
        tg.setHeaderColor(resolved === 'dark' ? '#0F1115' : '#FFFFFF');
      } catch {}
    }
    if (tg?.setBackgroundColor) {
      try {
        tg.setBackgroundColor(resolved === 'dark' ? '#0F1115' : '#FFFFFF');
      } catch {}
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, applyTheme]);

  return { theme, setTheme, resolvedTheme: resolveTheme(theme) };
}
