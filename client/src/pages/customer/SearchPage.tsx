import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../../store';
import { t } from '../../i18n';
import { Search, X } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';

interface Product {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  price: number;
  status: string;
  unit: { nameUz: string; nameRu: string; nameEn: string };
}

export function SearchPage() {
  const language = useStore((s) => s.language);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setProducts([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q.trim())}&limit=30`);
      const data = await res.json();
      setProducts(data.products || []);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  return (
    <div className="page">
      <div className="search-bar">
        <span className="search-bar__icon" style={{ display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="var(--color-text-secondary)" />
        </span>
        <input
          type="text"
          className="search-bar__input"
          placeholder={t('header.search', language)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 'var(--space-sm)', display: 'flex', alignItems: 'center' }}
            onClick={() => { setQuery(''); setProducts([]); setSearched(false); }}
          >
            <X size={16} color="var(--color-text-secondary)" />
          </button>
        )}
      </div>
      <div className="page__content">
        {loading ? (
          <div className="loading-screen" style={{ minHeight: '40vh' }}>
            <div className="loading-screen__spinner" />
          </div>
        ) : searched && products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Search size={48} color="var(--color-primary)" />
            </div>
            <div className="empty-state__title">{t('general.noResults', language)}</div>
          </div>
        ) : !searched ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Search size={48} color="var(--color-primary)" />
            </div>
            <div className="empty-state__title">{t('general.search', language)}</div>
            <div className="empty-state__desc">{t('header.search', language)}</div>
          </div>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
