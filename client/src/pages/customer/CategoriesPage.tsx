import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { Package, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  _count: { products: number };
}

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

export function CategoriesPage() {
  const language = useStore((s) => s.language);
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getName = (item: any) => getLocalizedField(item, 'name', language);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data);

        if (categoryId) {
          const cat = data.find((c: Category) => c.id === categoryId);
          if (cat) setSelectedCategory(cat);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [categoryId]);

  useEffect(() => {
    if (!categoryId) {
      setProducts([]);
      return;
    }

    async function loadProducts() {
      setLoading(true);
      try {
        const res = await fetch(`/api/categories/${categoryId}/products?page=${page}&limit=20`);
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        if (data.category) setSelectedCategory(data.category);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [categoryId, page]);

  if (loading) {
    return (
      <div className="page">
        <div className="page__content">
          <div className="loading-screen" style={{ minHeight: '60vh' }}>
            <div className="loading-screen__spinner" />
          </div>
        </div>
      </div>
    );
  }

  // If viewing a specific category's products
  if (categoryId && selectedCategory) {
    return (
      <div className="page">
        <div className="page__content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
            <button
              className="btn btn--sm btn--outline"
              onClick={() => navigate('/categories')}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="page__title" style={{ marginBottom: 0 }}>{getName(selectedCategory)}</h1>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
                <Package size={48} color="var(--color-primary)" />
              </div>
              <div className="empty-state__title">{t('general.noResults', language)}</div>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
              <button
                className="btn btn--sm btn--outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={{ padding: 'var(--space-sm) var(--space-md)', fontWeight: 600 }}>
                {page} / {totalPages}
              </span>
              <button
                className="btn btn--sm btn--outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', padding: 0 }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Category grid view
  return (
    <div className="page">
      <div className="page__content">
        <h1 className="page__title">{t('nav.categories', language)}</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--space-md)' }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="card card--elevated"
              style={{ padding: 'var(--space-xl)', textAlign: 'center' }}
              onClick={() => navigate(`/categories/${cat.id}`)}
            >
              {cat.photo ? (
                <img src={cat.photo} alt={getName(cat)} style={{
                  width: '60px', height: '60px', objectFit: 'cover',
                  borderRadius: 'var(--radius-lg)', margin: '0 auto var(--space-sm)',
                }} />
              ) : (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-sm)' }}>
                  <Package size={40} color="var(--color-primary)" />
                </div>
              )}
              <div style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{getName(cat)}</div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {cat._count.products} {t('admin.products', language).toLowerCase()}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
