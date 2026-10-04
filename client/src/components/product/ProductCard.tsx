import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Tag, Minus, Plus } from 'lucide-react';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

export interface ProductItem {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  price: number;
  status: string;
  stockQuantity?: number;
  unit: { nameUz: string; nameRu: string; nameEn: string };
  category?: { nameUz: string; nameRu: string; nameEn: string };
}

interface ProductCardProps {
  product: ProductItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const language = useStore((s) => s.language);
  const favoriteIds = useStore((s) => s.favoriteIds);
  const toggleFavoriteId = useStore((s) => s.toggleFavoriteId);
  const basketMap = useStore((s) => s.basketMap);
  const updateProductBasketQty = useStore((s) => s.updateProductBasketQty);
  const navigate = useNavigate();

  const [isLiking, setIsLiking] = useState(false);
  const [isUpdatingBasket, setIsUpdatingBasket] = useState(false);

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const isLiked = favoriteIds.includes(product.id);
  const quantityInBasket = basketMap[product.id] || 0;
  const stock = product.stockQuantity ?? 999;
  const isAvailable = product.status === 'ACTIVE' && stock > 0;

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking) return;
    setIsLiking(true);

    // Optimistic store toggle
    toggleFavoriteId(product.id);

    try {
      await api.toggleFavorite(product.id);
    } catch (err: any) {
      // Revert on failure
      toggleFavoriteId(product.id);
      showToast(err.message || 'Failed to update favorite', 'error');
    } finally {
      setIsLiking(false);
    }
  };

  const handleAddFirst = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAvailable || isUpdatingBasket) return;
    setIsUpdatingBasket(true);

    // Optimistically update
    updateProductBasketQty(product.id, 1);

    try {
      await api.addToBasket(product.id, 1);
      const basket = await api.getBasket().catch(() => null);
      if (basket?.count !== undefined) {
        useStore.getState().updateBasketCount(basket.count);
      }
    } catch (err: any) {
      updateProductBasketQty(product.id, 0);
      showToast(err.message || 'Could not add to basket', 'error');
    } finally {
      setIsUpdatingBasket(false);
    }
  };

  const handleIncrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantityInBasket >= stock || isUpdatingBasket) return;
    const nextQty = quantityInBasket + 1;
    setIsUpdatingBasket(true);

    // Optimistically update
    updateProductBasketQty(product.id, nextQty);

    try {
      await api.updateBasketItem(product.id, nextQty);
      const basket = await api.getBasket().catch(() => null);
      if (basket?.count !== undefined) {
        useStore.getState().updateBasketCount(basket.count);
      }
    } catch (err: any) {
      updateProductBasketQty(product.id, quantityInBasket);
      showToast(err.message || 'Could not update quantity', 'error');
    } finally {
      setIsUpdatingBasket(false);
    }
  };

  const handleDecrement = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (quantityInBasket <= 0 || isUpdatingBasket) return;
    const nextQty = quantityInBasket - 1;
    setIsUpdatingBasket(true);

    // Optimistically update
    updateProductBasketQty(product.id, nextQty);

    try {
      if (nextQty === 0) {
        await api.removeFromBasket(product.id);
      } else {
        await api.updateBasketItem(product.id, nextQty);
      }
      const basket = await api.getBasket().catch(() => null);
      if (basket?.count !== undefined) {
        useStore.getState().updateBasketCount(basket.count);
      }
    } catch (err: any) {
      updateProductBasketQty(product.id, quantityInBasket);
      showToast(err.message || 'Could not update quantity', 'error');
    } finally {
      setIsUpdatingBasket(false);
    }
  };

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-card__image-wrap">
        {product.photo ? (
          <img
            src={product.photo}
            alt={getName(product)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-bg-secondary)',
            }}
          >
            <Tag size={36} color="var(--color-text-tertiary)" />
          </div>
        )}

        {/* Favorite / Like Button */}
        <button
          className="product-card__favorite"
          onClick={handleToggleLike}
          disabled={isLiking}
          aria-label="Favorite"
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            zIndex: 10,
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
        >
          <Heart
            size={17}
            fill={isLiked ? '#EF4444' : 'none'}
            color={isLiked ? '#EF4444' : '#6B7280'}
            strokeWidth={isLiked ? 2.5 : 2}
          />
        </button>

        {/* Out of Stock Overlay */}
        {!isAvailable && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 'var(--font-xs)',
              borderRadius: 'var(--radius-lg)',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {t('product.outOfStock', language)}
          </div>
        )}
      </div>

      <div className="product-card__info">
        {product.category && (
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-primary)',
              marginBottom: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getName(product.category)}
          </div>
        )}

        <span className="product-card__name">{getName(product)}</span>

        <div className="product-card__price-row">
          <span className="product-card__price">{formatPrice(product.price)}</span>
          <span className="product-card__unit">/ {getName(product.unit)}</span>
        </div>

        {/* Actions: + Add Button OR [ - ] [ qty ] [ + ] Stepper */}
        {!isAvailable ? (
          <button className="product-card__add-btn" disabled>
            {t('product.outOfStock', language)}
          </button>
        ) : quantityInBasket === 0 ? (
          <button
            className="product-card__add-btn"
            onClick={handleAddFirst}
            disabled={isUpdatingBasket}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontWeight: 700,
              borderRadius: '12px',
              fontSize: '12.5px',
              padding: '8px 4px',
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {t('product.addToBasket', language)}
            </span>
          </button>
        ) : (
          <div
            className="product-card__stepper"
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--color-primary-light)',
              borderRadius: '12px',
              padding: '2px',
              height: '38px',
              border: '1.5px solid var(--color-primary)',
            }}
          >
            <button
              onClick={handleDecrement}
              disabled={isUpdatingBasket}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              aria-label="Decrease"
            >
              <Minus size={14} strokeWidth={2.5} />
            </button>

            <span
              style={{
                fontWeight: 800,
                fontSize: 'var(--font-sm)',
                color: 'var(--color-primary)',
                minWidth: '24px',
                textAlign: 'center',
              }}
            >
              {quantityInBasket}
            </span>

            <button
              onClick={handleIncrement}
              disabled={isUpdatingBasket || quantityInBasket >= stock}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--color-primary)',
                color: 'white',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                opacity: quantityInBasket >= stock ? 0.4 : 1,
                transition: 'transform 0.1s ease',
              }}
              aria-label="Increase"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
