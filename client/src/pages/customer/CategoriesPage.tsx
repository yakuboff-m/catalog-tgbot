import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { Package, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '../../components/product/ProductCard';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { useTelegramLongPressReorder } from '../../hooks/useTelegramLongPressReorder';

interface Category {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  sortOrder?: number;
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
  sortOrder?: number;
  unit: { nameUz: string; nameRu: string; nameEn: string };
}

export function CategoriesPage() {
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const isAdmin = import.meta.env.DEV || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getName = (item: any) => getLocalizedField(item, 'name', language);

  // Telegram-style long hold reorder for categories (only active for Admin)
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

  // Telegram-style long hold reorder for products inside this category (only active for Admin)
  const { getItemProps: getProductItemProps } = useTelegramLongPressReorder({
    items: products,
    enabled: isAdmin,
    onOrderChange: setProducts,
    onCommit: async (newProds) => {
      try {
        await api.adminReorderProducts(newProds.map((p) => p.id));
        showToast(
          language === 'ru'
            ? 'Порядок товаров сохранен'
            : language === 'en'
            ? 'Product order saved'
            : 'Mahsulotlar tartibi saqlandi',
          'success'
        );
      } catch (err: any) {
        showToast(err.message || 'Failed to reorder products', 'error');
      }
    },
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/categories');
        const data = await res.json();
        setCategories(data || []);

        if (categoryId) {
          const cat = (data || []).find((c: Category) => c.id === categoryId);
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
              {products.map((product, index) => {
                const itemProps = getProductItemProps(product, index);

                return (
                  <div
                    key={product.id}
                    {...itemProps}
                    style={{
                      position: 'relative',
                      userSelect: 'none',
                      WebkitUserSelect: 'none',
                      ...itemProps.style,
                    }}
                  >
                    <ProductCard product={product as any} />
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--space-sm)', marginTop: 'var(--space-xl)' }}>
              <button
                className="btn btn--sm btn--outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
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
          {categories.map((cat, index) => {
            const itemProps = getCategoryItemProps(cat, index);

            return (
              <button
                key={cat.id}
                className="card card--elevated"
                {...itemProps}
                style={{
                  padding: 'var(--space-xl)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitUserSelect: 'none',
                  position: 'relative',
                  ...itemProps.style,
                }}
                onClick={() => navigate(`/categories/${cat.id}`)}
              >
                {cat.photo ? (
                  <img
                    src={cat.photo}
                    alt={getName(cat)}
                    style={{
                      width: '60px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-lg)',
                      margin: '0 auto var(--space-sm)',
                      pointerEvents: 'none',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-sm)', pointerEvents: 'none' }}>
                    <Package size={40} color="var(--color-primary)" />
                  </div>
                )}
                <div style={{ fontWeight: 600, fontSize: 'var(--font-base)', pointerEvents: 'none' }}>{getName(cat)}</div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '4px', pointerEvents: 'none' }}>
                  {cat._count?.products ?? 0} {t('admin.products', language).toLowerCase()}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
