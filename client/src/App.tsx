import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useStore } from './store';
import { useTheme } from './hooks/useTheme';
import { api } from './api/client';
import { BottomNav } from './components/layout/BottomNav';
import { ToastContainer } from './components/ui/ToastContainer';
import { HomePage } from './pages/customer/HomePage';
import { CategoriesPage } from './pages/customer/CategoriesPage';
import { FavoritesPage } from './pages/customer/FavoritesPage';
import { OrdersPage } from './pages/customer/OrdersPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { BasketPage } from './pages/customer/BasketPage';
import { SearchPage } from './pages/customer/SearchPage';
import { ProductDetailPage } from './pages/customer/ProductDetailPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AlertTriangle } from 'lucide-react';
import { extractTelegramProductDeepLink } from './utils/telegram';
import './index.css';
import './styles/components.css';

function AppContent() {
  const { setAuth } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deepLinkProduct, setDeepLinkProduct] = useState<string | null>(null);

  // Apply theme
  useTheme();

  // Telegram BackButton global synchronization (prevents accidental closes / lost orders)
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    // BasketPage has its own dedicated step-by-step back handlers
    if (location.pathname === '/basket') return;

    if (location.pathname === '/') {
      tg.BackButton.hide();
    } else {
      tg.BackButton.show();
      const handleBack = () => {
        navigate(-1);
      };
      tg.BackButton.onClick(handleBack);
      return () => {
        tg.BackButton.offClick(handleBack);
      };
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    async function init() {
      try {
        // Try Telegram WebApp init
        const tg = (window as any).Telegram?.WebApp;
        if (tg) {
          tg.ready();
          tg.expand();
        }

        // Attempt authentication
        let currentToken = useStore.getState().token;
        const storedUser = useStore.getState().user;
        
        if (tg?.initData) {
          // If the stored user is for a different Telegram account, clear stale session immediately
          const activeTgUserId = tg.initDataUnsafe?.user?.id?.toString();
          if (storedUser && activeTgUserId && storedUser.telegramId !== activeTgUserId) {
            useStore.getState().clearAuth();
            currentToken = null;
          }

          // If launched inside Telegram, always authenticate with Telegram initData
          try {
            const result = await api.login();
            setAuth(result.token, result.user);
            currentToken = result.token;
          } catch (e) {
            console.warn('Telegram auth failed:', e);
            useStore.getState().clearAuth();
            currentToken = null;
          }
        } else if (currentToken) {
          // Verify existing token in browser
          try {
            const user = await api.getProfile();
            setAuth(currentToken, user);
          } catch {
            useStore.getState().clearAuth();
            currentToken = null;
          }
        }

        // Only for standalone browser development (outside Telegram)
        if (!currentToken && !tg?.initData && import.meta.env.DEV) {
          try {
            const result = await api.devLogin('CUSTOMER');
            setAuth(result.token, result.user);
            currentToken = result.token;
          } catch (e) {
            console.warn('Dev login failed:', e);
          }
        }

        // Fetch initial basket & favorites if authenticated
        if (currentToken) {
          try {
            const [basketData, favIds] = await Promise.all([
              api.getBasket().catch(() => ({ items: [], count: 0 })),
              api.getFavoriteIds().catch(() => []),
            ]);
            if (basketData?.items) {
              useStore.getState().setBasketItems(basketData.items);
            } else if (basketData?.count !== undefined) {
              useStore.getState().updateBasketCount(basketData.count);
            }
            if (Array.isArray(favIds)) {
              useStore.getState().setFavoriteIds(favIds);
            }
          } catch (e) {
            console.warn('Failed to load initial counts', e);
          }
        }

        // Extract deep link parameter across all Telegram delivery channels
        const targetId = extractTelegramProductDeepLink();
        if (targetId) {
          setDeepLinkProduct(targetId);
        }
      } catch (err: any) {
        console.error('Init error:', err);
        // Don't block the UI for auth errors in dev mode
        if (import.meta.env.DEV) {
          console.warn('Running in dev mode without authentication');
        } else {
          setError(err.message || 'Failed to initialize');
        }
      } finally {
        setIsLoading(false);
      }
    }

    init();
  }, [setAuth]);

  // Navigate to deep-linked product once authentication and router are fully loaded
  useEffect(() => {
    if (!isLoading && deepLinkProduct && !location.pathname.includes(deepLinkProduct)) {
      navigate(`/product/${deepLinkProduct}`, { replace: true });
    }
  }, [isLoading, deepLinkProduct, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner" />
        <div className="loading-screen__text">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-screen">
        <AlertTriangle size={48} color="#EF4444" style={{ marginBottom: 'var(--space-sm)' }} />
        <div className="loading-screen__text">{error}</div>
        <button className="btn btn--primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Customer routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/share/:productId" element={<ProductDetailPage />} />
        <Route path="/p/:productId" element={<ProductDetailPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/categories/:categoryId" element={<CategoriesPage />} />
        <Route path="/product/:productId" element={<ProductDetailPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/basket" element={<BasketPage />} />
        <Route path="/search" element={<SearchPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
      <BottomNav />
      <ToastContainer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
