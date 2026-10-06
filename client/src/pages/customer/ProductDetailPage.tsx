import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { ArrowLeft, Heart, Tag, Check, Minus, Plus, Share2, ShoppingBag } from 'lucide-react';
import { shareProduct } from '../../utils/share';

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
  category: { id: string; nameUz: string; nameRu: string; nameEn: string };
}

export function ProductDetailPage() {
  const language = useStore((s) => s.language);
  const basketCount = useStore((s) => s.basketCount);
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToBasket, setAddingToBasket] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const getDescription = (item: any) => getLocalizedField(item, 'description', language);
  const formatPrice = (price: number) => `₩${price.toLocaleString()}`;

  const handleBack = () => {
    if (window.history.state && typeof window.history.state.idx === 'number' && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleShare = async () => {
    if (!product) return;
    const res = await shareProduct(product, language);
    if (res === 'copied') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  useEffect(() => {
    async function load() {
      if (!productId) return;
      try {
        const [prodData, favIds] = await Promise.all([
          api.getProduct(productId),
          api.getFavoriteIds().catch((): string[] => []),
        ]);
        setProduct(prodData);
        setIsFavorited(favIds.includes(productId));
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  const handleAddToBasket = async () => {
    if (!product || addingToBasket) return;
    setAddingToBasket(true);
    try {
      await api.addToBasket(product.id, quantity);
      const currentQty = useStore.getState().basketMap[product.id] || 0;
      useStore.getState().updateProductBasketQty(product.id, currentQty + quantity);
      const basket = await api.getBasket();
      useStore.getState().updateBasketCount(basket.count);

      // Instant button feedback (1 second duration)
      setAddedSuccess(true);
      setTimeout(() => setAddedSuccess(false), 1000);
    } catch (err: any) {
      console.error('Add to basket error:', err);
      showToast(err.message || 'Could not add to basket', 'error');
    } finally {
      setAddingToBasket(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!product) return;
    try {
      const res = await api.toggleFavorite(product.id);
      setIsFavorited(res.favorited);
      useStore.getState().toggleFavoriteId(product.id);
      const favs = await api.getFavorites().catch(() => ({ count: 0 }));
      useStore.getState().setFavoritesCount(favs.count || 0);
    } catch (err: any) {
      console.error('Toggle favorite error:', err);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-screen__spinner" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page" style={{ padding: 'var(--space-2xl) var(--space-lg)', textAlign: 'center' }}>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {t('product.notFound', language)}
        </p>
        <button className="btn btn--primary" onClick={() => navigate('/')}>
          {t('general.back', language)}
        </button>
      </div>
    );
  }

  const maxQuantity = Math.min(product.stockQuantity, 99);
  const isAvailable = product.status === 'ACTIVE' && product.stockQuantity > 0;

  return (
    <div className="page" style={{ paddingBottom: '120px' }}>
      {/* Top action bar: Back button & Share & Cart */}
      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        width: '100%',
      }}>
        <button
          className="btn btn--sm btn--outline"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> {t('general.back', language)}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn--sm btn--outline"
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontWeight: 600,
              borderColor: copiedLink ? 'var(--color-primary)' : undefined,
              color: copiedLink ? 'var(--color-primary)' : undefined,
            }}
          >
            {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            <span>{copiedLink ? t('product.copiedLink', language) : t('product.share', language)}</span>
          </button>

          {/* Cart Icon in top bar */}
          <button
            className="btn btn--sm btn--outline"
            onClick={() => navigate('/basket')}
            style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
            }}
            title={t('basket.title', language)}
          >
            <ShoppingBag size={18} />
            {basketCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: 'white',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 700,
                minWidth: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}>
                {basketCount > 99 ? '99+' : basketCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Product Image */}
      <div style={{
        width: '100%',
        height: '320px',
        background: product.photo
          ? `url(${product.photo}) center/cover`
          : 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {!product.photo && <Tag size={64} color="var(--color-text-tertiary)" />}

        {/* Favorite button */}
        <button
          onClick={handleToggleFavorite}
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'var(--space-md)',
            width: '44px',
            height: '44px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255,255,255,0.95)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            zIndex: 10,
          }}
        >
          <Heart size={22} fill={isFavorited ? '#EF4444' : 'none'} color={isFavorited ? '#EF4444' : '#6B7280'} />
        </button>
        {!isAvailable && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: 'var(--font-xl)',
          }}>
            {t('product.outOfStock', language)}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div style={{ padding: 'var(--space-lg)' }}>
        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
          {getName(product.category)}
        </div>
        <h1 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>
          {getName(product)}
        </h1>
        <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--color-primary)', marginBottom: 'var(--space-sm)' }}>
          {formatPrice(product.price)}
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: 'var(--space-xs)' }}>
            / {getName(product.unit)}
          </span>
        </div>

        {isAvailable && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-sm)', color: 'var(--color-success)', fontWeight: 600, marginBottom: 'var(--space-lg)' }}>
            <Check size={16} /> {t('product.inStock', language)} ({product.stockQuantity})
          </div>
        )}

        {/* Description */}
        {getDescription(product) && (
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>
              {t('product.description', language)}
            </h3>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
              {getDescription(product)}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Action Bar — Quantity + Add to Basket */}
      {isAvailable && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          maxWidth: '100vw',
          boxSizing: 'border-box',
          padding: '10px 14px',
          paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          zIndex: 50,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        }}>
          {/* Quantity selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '3px',
            flexShrink: 0,
          }}>
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1 || addingToBasket}
              style={{
                width: '34px', height: '34px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Minus size={15} />
            </button>
            <span style={{ minWidth: '28px', textAlign: 'center', fontWeight: 700, fontSize: '15px' }}>
              {quantity}
            </span>
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity || addingToBasket}
              style={{
                width: '34px', height: '34px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={15} />
            </button>
          </div>

          {/* Add to basket button */}
          <button
            className="btn btn--primary"
            style={{
              flex: 1,
              minWidth: 0,
              boxSizing: 'border-box',
              fontWeight: 700,
              fontSize: '14px',
              padding: '10px 12px',
              background: addedSuccess ? '#10B981' : undefined,
              borderColor: addedSuccess ? '#10B981' : undefined,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'all 0.2s ease',
            }}
            onClick={handleAddToBasket}
            disabled={addingToBasket}
          >
            {addingToBasket ? (
              <span className="spinner" style={{ width: 18, height: 18 }} />
            ) : addedSuccess ? (
              <>
                <Check size={18} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t('basket.added', language)}
                </span>
              </>
            ) : (
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                + {t('product.addToBasket', language)} · {formatPrice(product.price * quantity)}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
