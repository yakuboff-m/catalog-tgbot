import { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { t } from '../../i18n';
import { api } from '../../api/client';
import { Heart } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';

interface FavoriteItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    nameUz: string;
    nameRu: string;
    nameEn: string;
    photo: string | null;
    price: number;
    status: string;
    stockQuantity: number;
    unit: { nameUz: string; nameRu: string; nameEn: string };
    category?: { nameUz: string; nameRu: string; nameEn: string };
  };
}

export function FavoritesPage() {
  const language = useStore((s) => s.language);
  const favoriteIds = useStore((s) => s.favoriteIds);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      const data = await api.getFavorites();
      setFavorites(data.favorites || []);
      useStore.getState().setFavoritesCount(data.count || 0);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  // Filter out items that have been unfavorited in store
  const activeFavorites = favorites.filter((f) => favoriteIds.includes(f.productId));

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-screen__spinner" />
        </div>
      </div>
    );
  }

  if (activeFavorites.length === 0) {
    return (
      <div className="page">
        <div className="page__content">
          <h1 className="page__title">{t('favorites.title', language)}</h1>
          <div className="empty-state">
            <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Heart size={48} color="var(--color-primary)" />
            </div>
            <div className="empty-state__title">{t('favorites.empty', language)}</div>
            <div className="empty-state__desc">{t('favorites.emptyDesc', language)}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <div className="page__content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h1 className="page__title" style={{ marginBottom: 0 }}>
            {t('favorites.title', language)}
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: 'var(--space-sm)' }}>
              ({activeFavorites.length})
            </span>
          </h1>
        </div>

        <div className="product-grid">
          {activeFavorites.map((item) => (
            <ProductCard key={item.id} product={item.product} />
          ))}
        </div>
      </div>
    </div>
  );
}
