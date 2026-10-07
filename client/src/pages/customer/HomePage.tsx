import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { AppHeader } from '../../components/layout/AppHeader';
import { ProductCard } from '../../components/product/ProductCard';
import {
  Coffee,
  UtensilsCrossed,
  Cookie,
  Sparkles,
  ShoppingBag,
  Apple,
  Flame,
  Megaphone,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
import { useTelegramLongPressReorder } from '../../hooks/useTelegramLongPressReorder';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  _count?: { products: number };
}

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  descriptionUz: string | null;
  descriptionRu: string | null;
  descriptionEn: string | null;
  photo: string | null;
  price: number;
  status: string;
  stockQuantity: number;
  unit: { nameUz: string; nameRu: string; nameEn: string };
  category?: { nameUz: string; nameRu: string; nameEn: string };
}

interface Banner {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  photo: string;
  productId?: string | null;
}

interface NewsItem {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  photo: string | null;
  createdAt: string;
}

function getCategoryTheme(cat: Category, index: number) {
  const name = `${cat.nameEn} ${cat.nameUz} ${cat.nameRu}`.toLowerCase();

  if (
    name.includes('drink') ||
    name.includes('beverage') ||
    name.includes('ichimlik') ||
    name.includes('напит') ||
    name.includes('cola') ||
    name.includes('soda') ||
    name.includes('juice')
  ) {
    return {
      Icon: Coffee,
      bg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      color: '#1D4ED8',
    };
  }

  if (
    name.includes('food') ||
    name.includes('ovqat') ||
    name.includes('еда') ||
    name.includes('meat') ||
    name.includes('go\'sht') ||
    name.includes('bread') ||
    name.includes('non') ||
    name.includes('meal') ||
    name.includes('rice')
  ) {
    return {
      Icon: UtensilsCrossed,
      bg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      color: '#B91C1C',
    };
  }

  if (
    name.includes('snack') ||
    name.includes('shirinlik') ||
    name.includes('chips') ||
    name.includes('crisp') ||
    name.includes('sweet') ||
    name.includes('cookie') ||
    name.includes('candy') ||
    name.includes('снек')
  ) {
    return {
      Icon: Cookie,
      bg: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      color: '#B45309',
    };
  }

  if (
    name.includes('house') ||
    name.includes('ro\'zg\'or') ||
    name.includes('clean') ||
    name.includes('home') ||
    name.includes('хоз') ||
    name.includes('care')
  ) {
    return {
      Icon: Sparkles,
      bg: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
      color: '#15803D',
    };
  }

  const fallbacks = [
    {
      Icon: ShoppingBag,
      bg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
      color: '#6D28D9',
    },
    {
      Icon: Apple,
      bg: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)',
      color: '#C2410C',
    },
    {
      Icon: Flame,
      bg: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
      color: '#BE185D',
    },
  ];

  return fallbacks[index % fallbacks.length];
}

export function HomePage() {
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const isAdmin = import.meta.env.DEV || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const basketItems = useStore((s) => s.basketItems);
  const basketCount = useStore((s) => s.basketCount);
  const hasInitiatedCheckout = useStore((s) => s.hasInitiatedCheckout);
  const lastSeenNewsId = useStore((s) => s.lastSeenNewsId);
  const setLastSeenNewsId = useStore((s) => s.setLastSeenNewsId);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchNews, setLaunchNews] = useState<NewsItem | null>(null);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Telegram-style long hold reorder for categories on HomePage (only active for Admin)
  const { getItemProps: getCategoryItemProps } = useTelegramLongPressReorder({
    items: categories,
    enabled: isAdmin,
    onOrderChange: setCategories,
    onCommit: async (newCats) => {
      try {
        await api.adminReorderCategories(newCats.map((c) => c.id));
        showToast(
          language === 'ru'
            ? 'Порядок категорий сохранен'
            : language === 'en'
            ? 'Category order saved'
            : 'Kategoriyalar tartibi saqlandi',
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Failed to reorder categories', 'error');
        const res = await api.getCategories().catch(() => []);
        setCategories(res || []);
      }
    },
  });

  const hasUnreadNews = news.length > 0 && lastSeenNewsId !== news[0].id;

  const handleCloseLaunchModal = () => {
    if (launchNews) {
      setLastSeenNewsId(launchNews.id);
      if (dontShowToday) {
        const todayStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem('mm_dont_show_news_date', todayStr);
        localStorage.setItem('mm_dont_show_news_id', launchNews.id);
      }
    }
    setLaunchModalOpen(false);
  };

  const handleNewsHeaderClick = () => {
    navigate('/news');
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, prodRes, bannerRes, newsRes, ordersRes, basketRes] = await Promise.all([
          api.getCategories().catch(() => []),
          api.getProducts({ limit: '10' }).catch(() => ({ products: [] })),
          api.getBanners().catch(() => []),
          api.getNews().catch(() => []),
          api.getOrders().catch(() => ({ orders: [] })),
          api.getBasket().catch(() => null),
        ]);
        setCategories(catRes || []);
        setProducts(prodRes?.products || []);
        setBanners(bannerRes || []);
        setNews(newsRes || []);

        // Check if there is published news and auto-launch modal if not silenced for today
        if (newsRes && newsRes.length > 0) {
          const latest = newsRes[0];
          const todayStr = new Date().toISOString().slice(0, 10);
          const silencedDate = localStorage.getItem('mm_dont_show_news_date');
          const silencedId = localStorage.getItem('mm_dont_show_news_id');

          if (silencedDate !== todayStr || silencedId !== latest.id) {
            setLaunchNews(latest);
            setDontShowToday(false);
            setLaunchModalOpen(true);
          }
        }

        if (basketRes?.items) {
          useStore.getState().setBasketItems(basketRes.items);
        }
        const unpaid = ordersRes?.orders?.find(
          (o: any) => o.orderStatus === 'PENDING' && o.paymentStatus !== 'PAID'
        );
        if (unpaid) {
          setPendingOrder(unpaid);
        }
      } catch (err) {
        console.error('Home page load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const basketTotal = (basketItems || []).reduce(
    (acc, item) => acc + (item.product?.price || 0) * item.quantity,
    0
  );

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const getTitle = (item: any) => getLocalizedField(item, 'title', language);
  const getDescription = (item: any) => getLocalizedField(item, 'description', language);

  if (loading) {
    return (
      <div className="page">
        <AppHeader onNewsClick={handleNewsHeaderClick} hasUnreadNews={hasUnreadNews} />
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-screen__spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <AppHeader onNewsClick={handleNewsHeaderClick} hasUnreadNews={hasUnreadNews} />

      {/* Banner Section */}
      <section className="section" style={{ marginTop: 'var(--space-md)', paddingBottom: 'var(--space-xs)' }}>
        <div className="banner-slider">
          {banners.length > 0 ? (
            banners.map((banner) => {
              const customDesc = getDescription(banner);
              const customTitle = getTitle(banner);
              const hasOverlayText = Boolean(customDesc || (customTitle && !banner.photo));

              return (
                <div
                  key={banner.id}
                  className="banner-card"
                  onClick={() => banner.productId && navigate(`/product/${banner.productId}`)}
                  style={{
                    cursor: banner.productId ? 'pointer' : 'default',
                  }}
                >
                  {banner.photo ? (
                    <img
                      src={banner.photo}
                      alt={customTitle || 'Banner'}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                      }}
                    />
                  )}

                  {/* Only show overlay if there is meaningful custom text */}
                  {hasOverlayText && (
                    <div className="banner-card__overlay">
                      <div className="banner-card__text">
                        {customDesc || customTitle}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              className="banner-card"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <div>
                <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '0 0 6px' }}>
                  Muslim Market
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--font-sm)', opacity: 0.9 }}>
                  {t('home.welcomeBanner', language)}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="section" style={{ paddingTop: 'var(--space-sm)' }}>
          <div className="section__header" style={{ marginBottom: 'var(--space-md)' }}>
            <h2 className="section__title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>
              {t('home.categories', language)}
            </h2>
            <button
              className="section__action"
              onClick={() => navigate('/categories')}
              style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}
            >
              {t('home.viewAll', language)}
            </button>
          </div>
          <div className="h-scroll" style={{ display: 'flex', gap: '14px', paddingBottom: '4px' }}>
            {categories.map((cat, idx) => {
              const theme = getCategoryTheme(cat, idx);
              const itemProps = getCategoryItemProps(cat, idx);

              return (
                <button
                  key={cat.id}
                  className="category-card"
                  {...itemProps}
                  onClick={() => navigate(`/categories/${cat.id}`)}
                  style={{
                    width: '76px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    position: 'relative',
                    ...itemProps.style,
                  }}
                >
                  <div
                    className="category-card__image"
                    style={{
                      width: '68px',
                      height: '68px',
                      borderRadius: '20px',
                      background: theme.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.06)',
                      border: '1.5px solid rgba(255, 255, 255, 0.8)',
                      transition: 'transform 0.15s ease',
                      pointerEvents: 'none',
                    }}
                  >
                    {cat.photo ? (
                      <img
                        src={cat.photo}
                        alt={getName(cat)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <theme.Icon size={28} color={theme.color} strokeWidth={2.3} />
                    )}
                  </div>
                  <span
                    className="category-card__name"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      textAlign: 'center',
                      lineHeight: 1.25,
                      width: '100%',
                      pointerEvents: 'none',
                    }}
                  >
                    {getName(cat)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular Products */}
      {products.length > 0 && (
        <section className="section" style={{ paddingTop: 'var(--space-md)' }}>
          <div className="section__header" style={{ marginBottom: 'var(--space-md)' }}>
            <h2 className="section__title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>
              {t('home.popular', language)}
            </h2>
            <button
              className="section__action"
              onClick={() => navigate('/categories')}
              style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}
            >
              {t('home.viewAll', language)}
            </button>
          </div>
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* News & Announcements */}
      {news.length > 0 && (
        <section className="section" id="news-section" style={{ paddingBottom: 'var(--space-3xl)' }}>
          <div className="section__header">
            <h2 className="section__title" style={{ fontSize: 'var(--font-lg)', fontWeight: 800 }}>
              {t('home.news', language)}
            </h2>
            <button
              className="section__action"
              onClick={() => navigate('/news')}
              style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '13px' }}
            >
              {t('home.viewAll', language)}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {news.map((item) => (
              <div
                key={item.id}
                className="card card--elevated"
                onClick={() => {
                  setLaunchNews(item);
                  setDontShowToday(false);
                  setLaunchModalOpen(true);
                }}
                style={{
                  padding: 'var(--space-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-md)',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: item.photo
                      ? `url(${item.photo}) center/cover`
                      : 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {!item.photo && <Megaphone size={24} color="var(--color-text-tertiary)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 'var(--font-sm)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getTitle(item)}
                  </div>
                  {getDescription(item) && (
                    <div
                      style={{
                        fontSize: 'var(--font-xs)',
                        color: 'var(--color-text-secondary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        marginTop: '2px',
                      }}
                    >
                      {getDescription(item)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floating Uncompleted Order Bar — Only shown if checkout was actually started or receipt is pending */}
      {!dismissed && ((basketCount > 0 && hasInitiatedCheckout) || pendingOrder) && (
        <div className="floating-order-banner">
          {/* Left Icon with subtle pulsing dot */}
          <div className="floating-order-banner__icon">
            {(basketCount > 0 && hasInitiatedCheckout) ? <ShoppingBag size={22} /> : <Clock size={22} />}
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: (basketCount > 0 && hasInitiatedCheckout) ? '#10B981' : '#F59E0B',
                boxShadow: `0 0 8px ${(basketCount > 0 && hasInitiatedCheckout) ? '#10B981' : '#F59E0B'}`,
              }}
            />
          </div>

          {/* Center Info */}
          <div
            style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
            onClick={() => {
              if (basketCount > 0 && hasInitiatedCheckout) {
                navigate('/basket?step=checkout');
              } else if (pendingOrder) {
                navigate(`/orders?orderId=${pendingOrder.id}`);
              }
            }}
          >
            <div className="floating-order-banner__title">
              {(basketCount > 0 && hasInitiatedCheckout)
                ? t('home.uncompletedOrder', language)
                : `${t('home.pendingOrderReceipt', language)} #${pendingOrder.orderNumber}`}
            </div>
            <div className="floating-order-banner__subtitle">
              <span className="floating-order-banner__amount">
                {(basketCount > 0 && hasInitiatedCheckout)
                  ? `${basketCount} ${t('checkout.itemsCount', language)} · ₩${basketTotal.toLocaleString()}`
                  : `₩${pendingOrder?.total?.toLocaleString()}`}
              </span>
            </div>
          </div>

          {/* Right Action Button & Dismiss */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              className="btn btn--sm btn--primary"
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 2px 10px rgba(59, 130, 246, 0.45)',
              }}
              onClick={() => {
                if (basketCount > 0 && hasInitiatedCheckout) {
                  navigate('/basket?step=checkout');
                } else if (pendingOrder) {
                  navigate(`/orders?orderId=${pendingOrder.id}`);
                }
              }}
            >
              <span>
                {(basketCount > 0 && hasInitiatedCheckout)
                  ? t('home.completeOrder', language)
                  : t('home.uploadReceipt', language)}
              </span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              aria-label="Dismiss"
              className="floating-order-banner__dismiss"
              onClick={(e) => {
                e.stopPropagation();
                setDismissed(true);
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Launch / News Announcement Modal */}
      {launchModalOpen && launchNews && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease',
          }}
          onClick={handleCloseLaunchModal}
        >
          <div
            className="card card--elevated"
            style={{
              width: '100%',
              maxWidth: '460px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              background: 'var(--color-surface)',
              border: '1.5px solid var(--color-primary)',
              boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
              position: 'relative',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close 'X' Button */}
            <button
              type="button"
              onClick={handleCloseLaunchModal}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(0, 0, 0, 0.55)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                border: 'none',
                cursor: 'pointer',
              }}
              title={t('general.close', language)}
            >
              <X size={18} />
            </button>

            {/* Scrollable Content Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {/* Photo */}
              {launchNews.photo && (
                <div style={{ width: '100%', height: '220px', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                  <img
                    src={launchNews.photo}
                    alt={getTitle(launchNews)}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '20px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '10px',
                  }}
                >
                  <Megaphone size={13} />
                  <span>{t('news.title', language)}</span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '10px', lineHeight: 1.35 }}>
                  {getTitle(launchNews)}
                </h2>

                {getDescription(launchNews) && (
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                    {getDescription(launchNews)}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Footer: Checkbox (Left) & Close (Right) */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                gap: '12px',
              }}
            >
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: 'var(--color-text-secondary)',
                  userSelect: 'none',
                  fontWeight: 500,
                }}
              >
                <input
                  type="checkbox"
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                  style={{
                    width: '17px',
                    height: '17px',
                    accentColor: 'var(--color-primary)',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                />
                <span>{t('news.dontShowToday', language)}</span>
              </label>

              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={handleCloseLaunchModal}
                style={{
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 600,
                  borderRadius: '12px',
                }}
              >
                {t('general.close', language)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
