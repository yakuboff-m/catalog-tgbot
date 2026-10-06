import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Megaphone, Sparkles, Clock, X, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';

interface NewsItem {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  photo?: string | null;
  productId?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

interface BannerItem {
  id: string;
  titleUz: string;
  titleRu: string;
  titleEn: string;
  descriptionUz?: string | null;
  descriptionRu?: string | null;
  descriptionEn?: string | null;
  photo?: string | null;
  linkUrl?: string | null;
  createdAt: string;
}

interface FeedItem {
  id: string;
  type: 'news' | 'banner';
  title: string;
  description: string;
  photo?: string | null;
  timestamp: string;
  dateObj: Date;
  raw: NewsItem | BannerItem;
}

function formatAnnouncementTime(dateStr: string | null | undefined, language: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);

  if (diffHours < 24 && now.getDate() === date.getDate()) {
    if (diffMin < 2) return language === 'uz' ? 'Hozirgina' : language === 'ru' ? 'Только что' : 'Just now';
    if (diffMin < 60) return language === 'uz' ? `${diffMin} daqiqa oldin` : language === 'ru' ? `${diffMin} мин назад` : `${diffMin}m ago`;
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return language === 'uz' ? `Bugun, ${timeStr}` : language === 'ru' ? `Сегодня, ${timeStr}` : `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (yesterday.getDate() === date.getDate()) {
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return language === 'uz' ? `Kecha, ${timeStr}` : language === 'ru' ? `Вчера, ${timeStr}` : `Yesterday, ${timeStr}`;
  }

  return date.toLocaleDateString(
    language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US',
    { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
}

export function NewsPage() {
  const language = useStore((s) => s.language);
  const setLastSeenNewsId = useStore((s) => s.setLastSeenNewsId);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'news' | 'banners'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);

  // Synchronize Telegram BackButton
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg?.BackButton) return;

    tg.BackButton.show();
    const handleBack = () => {
      if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
        navigate(-1);
      } else {
        navigate('/');
      }
    };
    tg.BackButton.onClick(handleBack);
    return () => tg.BackButton.offClick(handleBack);
  }, [navigate]);

  useEffect(() => {
    async function load() {
      try {
        const [newsRes, bannersRes] = await Promise.all([
          api.getNews().catch(() => []),
          api.getBanners().catch(() => []),
        ]);

        const items: FeedItem[] = [];

        // Add news
        if (Array.isArray(newsRes)) {
          newsRes.forEach((n: NewsItem) => {
            const dateStr = n.publishedAt || n.createdAt;
            items.push({
              id: `news_${n.id}`,
              type: 'news',
              title: getLocalizedField(n, 'title', language) || n.titleEn || n.titleUz || '',
              description: getLocalizedField(n, 'description', language) || n.descriptionEn || n.descriptionUz || '',
              photo: n.photo,
              timestamp: formatAnnouncementTime(dateStr, language),
              dateObj: new Date(dateStr),
              raw: n,
            });
          });

          // Mark latest news as seen to clear unread indicator
          if (newsRes.length > 0 && newsRes[0].id) {
            setLastSeenNewsId(newsRes[0].id);
          }
        }

        // Add promotional banners
        if (Array.isArray(bannersRes)) {
          bannersRes.forEach((b: BannerItem) => {
            items.push({
              id: `banner_${b.id}`,
              type: 'banner',
              title: getLocalizedField(b, 'title', language) || b.titleEn || b.titleUz || '',
              description: getLocalizedField(b, 'description', language) || b.descriptionEn || b.descriptionUz || '',
              photo: b.photo,
              timestamp: formatAnnouncementTime(b.createdAt, language),
              dateObj: new Date(b.createdAt),
              raw: b,
            });
          });
        }

        // Sort descending by date
        items.sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());
        setFeedItems(items);
      } catch (err) {
        console.error('Failed to load announcements feed:', err);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [language, setLastSeenNewsId]);

  const filteredItems = feedItems.filter((item) => {
    if (activeTab === 'news') return item.type === 'news';
    if (activeTab === 'banners') return item.type === 'banner';
    return true;
  });

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      {/* Top Header Bar */}
      <div
        style={{
          padding: 'var(--space-sm) var(--space-md)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <button
          className="btn btn--sm btn--outline"
          onClick={handleBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: '10px',
            padding: '6px 12px',
          }}
          title={t('general.back', language)}
        >
          <ArrowLeft size={16} />
          <span>{t('general.back', language)}</span>
        </button>

        <h1
          style={{
            fontSize: 'var(--font-lg)',
            fontWeight: 800,
            color: 'var(--color-text)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Megaphone size={20} color="var(--color-primary)" />
          <span>{t('news.title', language)}</span>
        </h1>
      </div>

      <div className="page__content" style={{ maxWidth: '600px', margin: '0 auto', paddingTop: 'var(--space-md)' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-md)', overflowX: 'auto', paddingBottom: '4px' }}>
          <button
            className={`pill ${activeTab === 'all' ? 'pill--active' : ''}`}
            onClick={() => setActiveTab('all')}
            style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>{t('general.seeAll', language)}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>({feedItems.length})</span>
          </button>
          <button
            className={`pill ${activeTab === 'news' ? 'pill--active' : ''}`}
            onClick={() => setActiveTab('news')}
            style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Megaphone size={14} />
            <span>{t('home.news', language)}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>
              ({feedItems.filter((i) => i.type === 'news').length})
            </span>
          </button>
          <button
            className={`pill ${activeTab === 'banners' ? 'pill--active' : ''}`}
            onClick={() => setActiveTab('banners')}
            style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Sparkles size={14} />
            <span>{language === 'uz' ? 'Aksiyalar' : language === 'ru' ? 'Акции' : 'Promos'}</span>
            <span style={{ fontSize: '11px', opacity: 0.8 }}>
              ({feedItems.filter((i) => i.type === 'banner').length})
            </span>
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="loading-screen" style={{ minHeight: '40vh' }}>
            <div className="loading-screen__spinner" />
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredItems.length === 0 && (
          <div
            className="card card--elevated"
            style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: '20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            <Megaphone size={48} strokeWidth={1.5} color="var(--color-text-tertiary)" style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-text)', marginBottom: '4px' }}>
              {language === 'uz' ? "Hozircha e'lonlar yo'q" : language === 'ru' ? 'Пока нет объявлений' : 'No announcements yet'}
            </div>
            <p style={{ fontSize: '13px' }}>
              {language === 'uz'
                ? "Tez orada yangi aksiya va yangiliklar e'lon qilinadi"
                : language === 'ru'
                ? 'Скоро здесь появятся новости и акции'
                : 'New updates and promotions will be posted here soon'}
            </p>
          </div>
        )}

        {/* Feed List */}
        {!loading && filteredItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="card card--elevated"
                onClick={() => setSelectedItem(item)}
                style={{
                  borderRadius: '18px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  background: 'var(--color-surface)',
                }}
              >
                {/* Image Banner */}
                {item.photo && (
                  <div style={{ width: '100%', height: '170px', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                    <img
                      src={item.photo}
                      alt={item.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Card Body */}
                <div style={{ padding: '14px 16px' }}>
                  {/* Meta: Badge + Timestamp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        background: item.type === 'news' ? 'var(--color-primary-light)' : 'rgba(245, 158, 11, 0.14)',
                        color: item.type === 'news' ? 'var(--color-primary)' : '#D97706',
                      }}
                    >
                      {item.type === 'news' ? <Megaphone size={12} /> : <Sparkles size={12} />}
                      <span>{item.type === 'news' ? t('home.news', language) : (language === 'uz' ? 'Aksiya' : language === 'ru' ? 'Акция' : 'Promo')}</span>
                    </span>

                    {item.timestamp && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px',
                          color: 'var(--color-text-secondary)',
                          fontWeight: 500,
                        }}
                      >
                        <Clock size={12} />
                        <span>{item.timestamp}</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--color-text)',
                      marginBottom: '6px',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.title}
                  </h3>

                  {/* Description Preview */}
                  {item.description && (
                    <p
                      style={{
                        fontSize: '13px',
                        color: 'var(--color-text-secondary)',
                        lineHeight: 1.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        margin: 0,
                      }}
                    >
                      {item.description}
                    </p>
                  )}

                  {/* Read More link */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--color-primary)',
                      marginTop: '10px',
                    }}
                  >
                    <span>{language === 'uz' ? 'Batafsil' : language === 'ru' ? 'Подробнее' : 'Read more'}</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Announcement Detail Modal */}
      {selectedItem && (
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
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="card card--elevated"
            style={{
              width: '100%',
              maxWidth: '480px',
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
              onClick={() => setSelectedItem(null)}
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
              {selectedItem.photo && (
                <div style={{ width: '100%', height: '220px', background: 'var(--color-bg-secondary)', overflow: 'hidden' }}>
                  <img
                    src={selectedItem.photo}
                    alt={selectedItem.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              )}

              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      background: selectedItem.type === 'news' ? 'var(--color-primary-light)' : 'rgba(245, 158, 11, 0.14)',
                      color: selectedItem.type === 'news' ? 'var(--color-primary)' : '#D97706',
                    }}
                  >
                    {selectedItem.type === 'news' ? <Megaphone size={12} /> : <Sparkles size={12} />}
                    <span>{selectedItem.type === 'news' ? t('home.news', language) : (language === 'uz' ? 'Aksiya' : language === 'ru' ? 'Акция' : 'Promo')}</span>
                  </span>

                  {selectedItem.timestamp && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{selectedItem.timestamp}</span>
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text)', marginBottom: '12px', lineHeight: 1.35 }}>
                  {selectedItem.title}
                </h2>

                {selectedItem.description && (
                  <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                    {selectedItem.description}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Footer: Close Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                padding: '12px 18px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
              }}
            >
              <button
                type="button"
                className="btn btn--sm btn--primary"
                onClick={() => setSelectedItem(null)}
                style={{
                  padding: '8px 22px',
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
