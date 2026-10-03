import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Trash2,
  MapPin,
  Receipt,
  Tag,
  ArrowLeft,
  ChevronRight,
  Minus,
  Plus,
  CreditCard,
  Copy,
  Upload,
  CheckCircle2,
  Check,
  Landmark,
} from 'lucide-react';
import { useStore } from '../../store';
import { t, getLocalizedField } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface BasketProduct {
  id: string;
  nameUz: string;
  nameRu: string;
  nameEn: string;
  photo: string | null;
  price: number;
  status: string;
  stockQuantity: number;
  unit: { nameUz: string; nameRu: string; nameEn: string };
}

interface BasketItem {
  id: string;
  productId: string;
  quantity: number;
  addedAt: string;
  product: BasketProduct;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  branchInfo?: string | null;
  isActive: boolean;
}

export function BasketPage() {
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();

  const [items, setItems] = useState<BasketItem[]>([]);
  const [total, setTotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Bank accounts for payment
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Checkout flow state
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);

  // Copy feedback states
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Uploading proof on placed order screen
  const [uploadingPlacedProof, setUploadingPlacedProof] = useState(false);
  const placedProofInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
    phone: user?.phone || '',
    address: user?.address || '',
    buildingNumber: user?.buildingNumber || '',
    homeNumber: user?.homeNumber || '',
    entranceCode: user?.entranceCode || '',
    saveInfo: true,
  });

  const getName = (item: any) => getLocalizedField(item, 'name', language);
  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const loadBasket = async () => {
    try {
      const [data, banks] = await Promise.all([
        api.getBasket(),
        api.getBankAccounts().catch(() => []),
      ]);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setCount(data.count || 0);
      setBankAccounts(banks ? banks.filter((b: any) => b.isActive) : []);
      useStore.getState().updateBasketCount(data.count || 0);
    } catch (err: any) {
      console.error('Failed to load basket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBasket();
  }, []);

  const handleUpdateQuantity = async (productId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 1) {
      handleRemoveItem(productId);
      return;
    }

    setUpdatingId(productId);
    try {
      await api.updateBasketItem(productId, newQty);
      await loadBasket();
    } catch (err: any) {
      showToast(err.message || 'Failed to update quantity', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingId(productId);
    try {
      await api.removeFromBasket(productId);
      await loadBasket();
      showToast('Mahsulot savatdan o\'chirildi', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to remove item', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleClearBasket = async () => {
    if (!window.confirm('Savatdagi barcha mahsulotlarni tozalashni xohlaysizmi?')) return;
    try {
      await api.clearBasket();
      await loadBasket();
      showToast('Savat tozalandi', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to clear basket', 'error');
    }
  };

  const handleCopyBank = (accountNumber: string, bankId: string, bankName: string) => {
    navigator.clipboard?.writeText(accountNumber);
    setCopiedBankId(bankId);
    showToast(`${bankName} hisob raqami nusxalandi!`, 'success');
    setTimeout(() => setCopiedBankId(null), 2500);
  };

  const handleCopyTotal = (amountStr: string) => {
    navigator.clipboard?.writeText(amountStr);
    setCopiedAmount(true);
    showToast(`₩${Number(amountStr).toLocaleString()} nusxalandi!`, 'success');
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim() || !formData.address.trim()) {
      showToast('Iltimos, ism, telefon va manzilni to\'ldiring', 'warning');
      return;
    }

    setSubmittingOrder(true);
    try {
      const order = await api.createOrder(formData, null);
      setPlacedOrder(order);
      useStore.getState().updateBasketCount(0);
      setItems([]);
      showToast(`Buyurtma #${order.orderNumber} muvaffaqiyatli qabul qilindi!`, 'success');
    } catch (err: any) {
      console.error('Order error:', err);
      showToast(err.message || 'Buyurtma rasmiylashtirishda xatolik yuz berdi', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleUploadPlacedProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!placedOrder || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingPlacedProof(true);
    try {
      const updated = await api.uploadPaymentProof(placedOrder.id, file);
      setPlacedOrder(updated);
      showToast('To\'lov cheki muvaffaqiyatli yuklandi!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Chekni yuklashda xatolik yuz berdi', 'error');
    } finally {
      setUploadingPlacedProof(false);
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-screen__spinner" />
        </div>
      </div>
    );
  }

  // 2. Post-Order Confirmation & Payment Transfer Screen (Problem 3)
  if (placedOrder) {
    return (
      <div className="page" style={{ paddingBottom: '120px' }}>
        <div className="page__content" style={{ maxWidth: '520px', margin: '0 auto' }}>
          {/* Success Celebration Card */}
          <div
            className="card card--elevated animate-fade-in-up"
            style={{
              textAlign: 'center',
              padding: '24px 18px',
              marginBottom: '18px',
              borderRadius: '24px',
              background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.12) 0%, var(--color-surface) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.15)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
              }}
            >
              <CheckCircle2 size={38} strokeWidth={2.5} />
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Buyurtmangiz qabul qilindi
            </span>

            <h2
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: '6px 0 8px',
                fontFamily: 'monospace',
                letterSpacing: '0.02em',
              }}
            >
              #{placedOrder.orderNumber}
            </h2>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Buyurtma holatini kuzatish uchun to'lovni amalga oshiring va chek skrinshotini yuklang.
            </p>
          </div>

          {/* Delivery Destination Reminder */}
          <div
            className="card"
            style={{
              padding: '14px 16px',
              marginBottom: '16px',
              borderRadius: '16px',
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <MapPin size={16} color="var(--color-primary)" />
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                Yetkazib berish manzili
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text)' }}>
              {placedOrder.deliveryAddress}
              {placedOrder.buildingNumber ? `, Bino: ${placedOrder.buildingNumber}` : ''}
              {placedOrder.homeNumber ? `, Uy/Xona: ${placedOrder.homeNumber}` : ''}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
              👤 {placedOrder.customerName} · 📱 {placedOrder.customerPhone}
            </div>
          </div>

          {/* Grand Total to Transfer Card */}
          <div
            className="card card--elevated"
            style={{
              padding: '16px 20px',
              marginBottom: '20px',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, var(--color-surface) 100%)',
              border: '1.5px solid rgba(59, 130, 246, 0.3)',
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                O'tkazilishi kerak bo'lgan summa:
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-primary)', marginTop: '2px' }}>
                ₩{placedOrder.total.toLocaleString()}
              </div>
            </div>
            <button
              className="btn btn--sm"
              style={{
                padding: '8px 14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '12px',
                background: copiedAmount ? 'var(--color-success)' : 'var(--color-primary)',
                color: 'white',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
              onClick={() => handleCopyTotal(String(placedOrder.total))}
            >
              {copiedAmount ? <Check size={14} strokeWidth={3} /> : <Copy size={14} />}
              <span>{copiedAmount ? 'Nusxalandi!' : 'Nusxalash'}</span>
            </button>
          </div>

          {/* Bank Accounts Section (Prettier look & animations) */}
          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Landmark size={20} color="var(--color-primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                To'lov ma'lumotlari (Bank Transfer)
              </h3>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="card" style={{ padding: '16px', borderRadius: '16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                Bank hisob raqami haqida ma'lumot olish uchun do'kon admini bilan bog'laning.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {bankAccounts.map((bank) => {
                  const isCopied = copiedBankId === bank.id;
                  return (
                    <div
                      key={bank.id}
                      className="card card--elevated"
                      style={{
                        padding: '16px 18px',
                        borderRadius: '20px',
                        background: 'linear-gradient(145deg, var(--color-surface) 0%, var(--color-bg-secondary) 100%)',
                        border: isCopied ? '1.5px solid var(--color-success)' : '1px solid var(--color-border)',
                        boxShadow: isCopied ? '0 4px 20px rgba(16, 185, 129, 0.2)' : 'var(--shadow-md)',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '12px',
                              background: 'var(--color-primary-light)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--color-primary)',
                            }}
                          >
                            <CreditCard size={20} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '15px' }}>
                              {bank.bankName}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                              Egasi: <strong>{bank.holderName}</strong>
                            </div>
                          </div>
                        </div>

                        <button
                          className="btn btn--sm"
                          style={{
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            borderRadius: '10px',
                            background: isCopied ? 'var(--color-success)' : 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => handleCopyBank(bank.accountNumber, bank.id, bank.bankName)}
                        >
                          {isCopied ? <Check size={13} strokeWidth={3} /> : <Copy size={13} />}
                          <span>{isCopied ? 'Nusxalandi!' : 'Nusxalash'}</span>
                        </button>
                      </div>

                      {/* Monospace Account Number Box */}
                      <div
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '18px',
                          letterSpacing: '0.06em',
                          color: 'var(--color-text)',
                          padding: '10px 14px',
                          background: 'var(--color-bg)',
                          borderRadius: '12px',
                          border: '1px solid var(--color-border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleCopyBank(bank.accountNumber, bank.id, bank.bankName)}
                        title="Nusxalash uchun bosing"
                      >
                        <span>{bank.accountNumber}</span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontWeight: 500, fontFamily: 'sans-serif' }}>
                          bosing
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Receipt Uploading Area (Prettier look, not a single line field) */}
          <div
            className="card card--elevated"
            style={{
              padding: '20px',
              marginBottom: '24px',
              borderRadius: '22px',
              border: placedOrder.paymentProofImage ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Upload size={18} color="var(--color-primary)" />
              <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                To'lov tasdig'ini yuklash (Screenshot)
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 16px' }}>
              Bank ilovasidan o'tkazma chekining skrinshotini yuklang. Admin uni tekshirib darhol jo'natadi.
            </p>

            {placedOrder.paymentProofImage ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    maxHeight: '220px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1.5px solid var(--color-border)',
                    boxShadow: 'var(--shadow-md)',
                    background: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img
                    src={placedOrder.paymentProofImage}
                    alt="To'lov cheki"
                    style={{ maxHeight: '220px', width: 'auto', maxWidth: '100%', objectFit: 'contain' }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--color-success)',
                    background: 'var(--color-success-light)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Chek qabul qilindi (Admin tekshirmoqda)</span>
                </div>

                <input
                  type="file"
                  ref={placedProofInputRef}
                  accept="image/*"
                  onChange={handleUploadPlacedProof}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  onClick={() => placedProofInputRef.current?.click()}
                  disabled={uploadingPlacedProof}
                  style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '10px' }}
                >
                  {uploadingPlacedProof ? 'Yuklanmoqda...' : 'Boshqa chek yuklash'}
                </button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={placedProofInputRef}
                  accept="image/*"
                  onChange={handleUploadPlacedProof}
                  style={{ display: 'none' }}
                />

                <div
                  onClick={() => !uploadingPlacedProof && placedProofInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--color-primary)',
                    borderRadius: '18px',
                    padding: '24px 16px',
                    textAlign: 'center',
                    cursor: uploadingPlacedProof ? 'not-allowed' : 'pointer',
                    background: 'var(--color-primary-light)',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'var(--color-primary)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    }}
                  >
                    <Upload size={22} />
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--color-text)' }}>
                      {uploadingPlacedProof ? 'Chek yuklanmoqda...' : 'Chek skrinshotini tanlash'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Rasm tanlash yoki kameradan tushirish uchun bosing
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn--primary btn--sm"
                    disabled={uploadingPlacedProof}
                    style={{ marginTop: '4px', pointerEvents: 'none', borderRadius: '10px' }}
                  >
                    <span>{uploadingPlacedProof ? 'Kuting...' : 'Rasm yuklash'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn--primary"
              onClick={() => navigate('/orders')}
              style={{ width: '100%', padding: '14px', fontWeight: 700, borderRadius: '14px', fontSize: '15px' }}
            >
              <span>Buyurtmalarimni ko'rish</span>
            </button>
            <button
              className="btn btn--outline"
              onClick={() => navigate('/')}
              style={{ width: '100%', padding: '14px', fontWeight: 600, borderRadius: '14px', fontSize: '14px' }}
            >
              <span>Bosh sahifaga qaytish</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty Basket State
  if (items.length === 0) {
    return (
      <div className="page">
        <div className="page__content">
          <h1 className="page__title">{t('basket.title', language)}</h1>
          <div className="empty-state">
            <div className="empty-state__icon">
              <ShoppingBag size={48} color="var(--color-text-tertiary)" />
            </div>
            <div className="empty-state__title">{t('basket.empty', language)}</div>
            <div className="empty-state__desc">{t('basket.emptyDesc', language)}</div>
            <button
              className="btn btn--primary"
              style={{ marginTop: 'var(--space-md)', borderRadius: '12px' }}
              onClick={() => navigate('/')}
            >
              {t('basket.startShopping', language)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Basket Items List OR Checkout Form
  return (
    <div className="page" style={{ paddingBottom: '160px' }}>
      <div className="page__content">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
          <h1 className="page__title" style={{ marginBottom: 0 }}>
            {isCheckingOut ? 'Buyurtmani rasmiylashtirish' : t('basket.title', language)}
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-text-secondary)', marginLeft: 'var(--space-sm)' }}>
              ({count} {t('basket.items', language)})
            </span>
          </h1>
          {!isCheckingOut && (
            <button
              className="btn btn--sm btn--outline"
              onClick={handleClearBasket}
              style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger)', borderColor: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '10px' }}
            >
              <Trash2 size={13} />
              <span>{t('basket.clear', language)}</span>
            </button>
          )}
        </div>

        {!isCheckingOut ? (
          /* Step 1: Basket Items List */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', paddingBottom: '140px' }}>
            {items.map((item) => {
              const product = item.product;
              const isUpdating = updatingId === product.id;

              return (
                <div
                  key={item.id}
                  className="card"
                  style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    padding: 'var(--space-md)',
                    alignItems: 'center',
                    opacity: isUpdating ? 0.6 : 1,
                    transition: 'opacity 0.2s ease',
                    borderRadius: '16px',
                  }}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-md)',
                      background: product.photo ? `url(${product.photo}) center/cover` : 'var(--color-bg-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {!product.photo && <Tag size={24} color="var(--color-text-tertiary)" />}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 'var(--font-base)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {getName(product)}
                    </div>
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      {formatPrice(product.price)} / {getName(product.unit)}
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 'var(--font-md)', color: 'var(--color-primary)', marginTop: '4px' }}>
                      {formatPrice(product.price * item.quantity)}
                    </div>
                  </div>

                  {/* Quantity Stepper */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(product.id, item.quantity, -1)}
                      disabled={isUpdating}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ fontWeight: 700, minWidth: '22px', textAlign: 'center', fontSize: 'var(--font-sm)' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="qty-btn"
                      onClick={() => handleUpdateQuantity(product.id, item.quantity, 1)}
                      disabled={isUpdating || item.quantity >= product.stockQuantity}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-bg)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(product.id)}
                      disabled={isUpdating}
                      style={{
                        marginLeft: '4px',
                        background: 'none',
                        border: 'none',
                        fontSize: '18px',
                        cursor: 'pointer',
                        color: 'var(--color-danger)',
                        padding: '4px',
                      }}
                      title="O'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Fixed Bottom Checkout Action Bar (Problem 2 Fix: Anchored above bottom nav!) */}
            <div
              style={{
                position: 'fixed',
                bottom: 'calc(var(--bottom-nav-height, 64px) + env(safe-area-inset-bottom, 0px))',
                left: 0,
                right: 0,
                padding: '12px 18px',
                background: 'var(--color-glass, var(--color-surface))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 90,
                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.25)',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {t('basket.total', language)}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-primary)' }}>
                  {formatPrice(total)}
                </div>
              </div>
              <button
                className="btn btn--primary"
                style={{
                  padding: '12px 22px',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
                onClick={() => setIsCheckingOut(true)}
              >
                <span>{t('basket.checkout', language)}</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Checkout Form View (Problem 3: Clean Address + Order Summary, NO bank info yet!) */
          <div style={{ maxWidth: '540px', margin: '0 auto', paddingBottom: '60px' }}>
            <button
              className="btn btn--sm btn--outline"
              onClick={() => setIsCheckingOut(false)}
              style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
            >
              <ArrowLeft size={15} />
              <span>Savatga qaytish</span>
            </button>

            <form onSubmit={handlePlaceOrder}>
              {/* Delivery Information Card */}
              <div className="card card--elevated" style={{ padding: '18px', marginBottom: '18px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="var(--color-primary)" />
                  <span>Yetkazib berish manzili</span>
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">
                      {t('checkout.fullName', language)} *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. Kim Min-su"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('checkout.phone', language)} *
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="010-1234-5678"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      {t('checkout.address', language)} (Ko'cha / Uy raqami) *
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="e.g. 경기도 화성시 봉담읍 삼천병마로 201"
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">
                        {t('checkout.building', language)}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.buildingNumber}
                        onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                        placeholder="101-dong"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {t('checkout.home', language)}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.homeNumber}
                        onChange={(e) => setFormData({ ...formData, homeNumber: e.target.value })}
                        placeholder="502-ho"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        {t('checkout.entrance', language)}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={formData.entranceCode}
                        onChange={(e) => setFormData({ ...formData, entranceCode: e.target.value })}
                        placeholder="#1234"
                      />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', marginTop: '4px' }}>
                    <input
                      type="checkbox"
                      checked={formData.saveInfo}
                      onChange={(e) => setFormData({ ...formData, saveInfo: e.target.checked })}
                      style={{ accentColor: 'var(--color-primary)', width: '18px', height: '18px' }}
                    />
                    <span>{t('checkout.save', language)}</span>
                  </label>
                </div>
              </div>

              {/* Order Review & Destination Confirmation Card (Problem 3 requirement) */}
              <div className="card card--elevated" style={{ padding: '18px', marginBottom: '22px', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Receipt size={18} color="var(--color-primary)" />
                  <span>Buyurtma va yetkazib berish xulosasi</span>
                </h3>

                {/* Destination Preview Callout */}
                <div
                  style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                    Qaysi manzilga buyurtma berilmoqda:
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--color-text)' }}>
                    {formData.address.trim() ? (
                      <>
                        📍 {formData.address}
                        {formData.buildingNumber ? `, Bino: ${formData.buildingNumber}` : ''}
                        {formData.homeNumber ? `, Uy/Xona: ${formData.homeNumber}` : ''}
                      </>
                    ) : (
                      <span style={{ color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        (Manzil yuqorida kiritilishi kerak)
                      </span>
                    )}
                  </div>
                  {formData.fullName.trim() && (
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                      👤 {formData.fullName} {formData.phone ? `· 📱 ${formData.phone}` : ''}
                    </div>
                  )}
                </div>

                {/* Subtotal, Delivery Fee & Grand Total */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                    <span>{t('checkout.subtotal', language)} ({count} mahsulot)</span>
                    <span style={{ fontWeight: 600 }}>{formatPrice(total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)' }}>
                    <span>{t('checkout.deliveryFee', language)}</span>
                    <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>{t('checkout.free', language)}</span>
                  </div>
                  <div style={{ borderTop: '1px solid var(--color-border)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800 }}>
                    <span>{t('basket.total', language)}</span>
                    <span style={{ color: 'var(--color-primary)' }}>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              {/* Confirm & Proceed to Payment button */}
              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontWeight: 800,
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '16px',
                  boxShadow: '0 6px 20px rgba(59, 130, 246, 0.4)',
                }}
                disabled={submittingOrder}
              >
                <ShoppingBag size={20} />
                <span>
                  {submittingOrder
                    ? 'Buyurtma rasmiylashtirilmoqda...'
                    : `Tasdiqlash va to'lovga o'tish · ${formatPrice(total)}`}
                </span>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
