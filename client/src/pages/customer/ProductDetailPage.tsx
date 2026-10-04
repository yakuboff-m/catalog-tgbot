import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { Search, ArrowLeft, Heart, Tag, Check, Minus, Plus, Share2 } from 'lucide-react';
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
  const navigate = useNavigate();
  const { productId } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToBasket, setAddingToBasket] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const getDescription = (item: any) => getLocalizedField(item, 'description', language);
  const formatPrice = (price: number) => `₩${price.toLocaleString()}`;

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
      navigate(-1);
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
      <div className="page">
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
            <Search size={48} color="var(--color-primary)" />
          </div>
          <div className="empty-state__title">Product not found</div>
          <button className="btn btn--primary" onClick={() => navigate(-1)} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={16} /> {t('general.back', language)}
          </button>
        </div>
      </div>
    );
  }

  const maxQuantity = Math.min(product.stockQuantity, 99);
  const isAvailable = product.status === 'ACTIVE' && product.stockQuantity > 0;

  return (
    <div className="page" style={{ paddingBottom: '100px' }}>
      {/* Top action bar: Back button & Share */}
      <div style={{
        padding: 'var(--space-sm) var(--space-md)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <button
          className="btn btn--sm btn--outline"
          onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <ArrowLeft size={16} /> {t('general.back', language)}
        </button>

        <button
          className="btn btn--sm btn--outline"
          onClick={handleShare}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '20px',
            fontWeight: 600,
            borderColor: copiedLink ? 'var(--color-primary)' : undefined,
            color: copiedLink ? 'var(--color-primary)' : undefined,
          }}
        >
          {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
          <span>{copiedLink ? t('product.copiedLink', language) : t('product.share', language)}</span>
        </button>
      </div>

      {/* Product Image */}
      <div style={{
        width: '100%',
        height: '300px',
        background: product.photo
          ? `url(${product.photo}) center/cover`
          : 'var(--color-bg-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        {!product.photo && <Tag size={64} color="var(--color-text-tertiary)" />}

        {/* Floating Share button on image */}
        <button
          onClick={handleShare}
          style={{
            position: 'absolute',
            top: 'var(--space-md)',
            right: 'calc(var(--space-md) + 52px)',
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
          aria-label="Share"
        >
          {copiedLink ? <Check size={20} color="#10B981" /> : <Share2 size={20} color="#4B5563" />}
        </button>

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

      {/* Bottom Bar — Quantity + Add to Basket */}
      {isAvailable && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))',
          left: 0,
          right: 0,
          padding: 'var(--space-md) var(--space-lg)',
          background: 'var(--color-bg)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-md)',
          zIndex: 50,
        }}>
          {/* Quantity selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            background: 'var(--color-bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            padding: '4px',
          }}>
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Minus size={16} />
            </button>
            <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: 'var(--font-base)' }}>
              {quantity}
            </span>
            <button
              className="qty-btn"
              onClick={() => setQuantity(q => Math.min(maxQuantity, q + 1))}
              disabled={quantity >= maxQuantity}
              style={{
                width: '36px', height: '36px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                background: 'var(--color-bg)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Add to basket button */}
          <button
            className="btn btn--primary"
            style={{ flex: 1, fontWeight: 700, fontSize: 'var(--font-base)' }}
            onClick={handleAddToBasket}
            disabled={addingToBasket}
          >
            {addingToBasket ? '...' : `+ ${t('product.addToBasket', language)} · ${formatPrice(product.price * quantity)}`}
          </button>
        </div>
      )}
    </div>
  );
}
