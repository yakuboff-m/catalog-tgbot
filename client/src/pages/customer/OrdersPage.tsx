import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../../store';
import { t } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { Package, Calendar, Check, AlertCircle, Tag, MapPin, CreditCard, Copy, CheckCircle2, RefreshCw, Upload, ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productPhoto: string | null;
  unitName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface StatusHistoryItem {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  buildingNumber: string | null;
  homeNumber: string | null;
  entranceCode: string | null;
  subtotal: number;
  total: number;
  paymentProofImage: string | null;
  createdAt: string;
  items: OrderItem[];
  statusHistory: StatusHistoryItem[];
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  isActive: boolean;
}

export function OrdersPage() {
  const language = useStore((s) => s.language);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlOrderId = searchParams.get('orderId');

  const [orders, setOrders] = useState<Order[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedBankId, setCopiedBankId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const loadData = async () => {
    try {
      const [ordersRes, banksRes] = await Promise.all([
        api.getOrders(),
        api.getBankAccounts().catch(() => []),
      ]);
      const list = ordersRes.orders || [];
      setOrders(list);
      setBankAccounts(banksRes || []);

      if (urlOrderId) {
        const found = list.find((o: Order) => o.id === urlOrderId || o.orderNumber === urlOrderId);
        if (found) {
          setSelectedOrder(found);
        }
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [urlOrderId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return { bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' };
      case 'CONFIRMED': return { bg: '#DBEAFE', color: '#2563EB', border: '#93C5FD' };
      case 'PROCESSING': return { bg: '#EDE9FE', color: '#7C3AED', border: '#C4B5FD' };
      case 'READY': return { bg: '#CCFBF1', color: '#0D9488', border: '#5EEAD4' };
      case 'COMPLETED': return { bg: '#D1FAE5', color: '#059669', border: '#6EE7B7' };
      case 'CANCELLED': return { bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' };
      default: return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID': return { bg: '#FEF2F2', color: '#DC2626' };
      case 'PAYMENT_SUBMITTED': return { bg: '#EFF6FF', color: '#2563EB' };
      case 'PAID': return { bg: '#ECFDF5', color: '#059669' };
      case 'PAYMENT_REJECTED': return { bg: '#FEF2F2', color: '#991B1B' };
      default: return { bg: '#F9FAFB', color: '#4B5563' };
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') {
      return ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY'].includes(order.orderStatus);
    }
    if (activeTab === 'completed') return order.orderStatus === 'COMPLETED';
    if (activeTab === 'cancelled') return order.orderStatus === 'CANCELLED';
    return true;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedBankId(id);
    setTimeout(() => setCopiedBankId(null), 2000);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedOrder || !e.target.files?.[0]) return;
    const file = e.target.files[0];

    setUploadingProof(true);
    try {
      const updated = await api.uploadPaymentProof(selectedOrder.id, file);
      showToast('Payment receipt uploaded successfully!', 'success');
      setSelectedOrder(updated);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    } catch (err: any) {
      showToast(err.message || 'Failed to upload receipt', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const orderStages = ['PENDING', 'CONFIRMED', 'PROCESSING', 'READY'];

  if (loading) {
    return (
      <div className="page">
        <div className="loading-screen" style={{ minHeight: '60vh' }}>
          <div className="loading-screen__spinner" />
        </div>
      </div>
    );
  }

  // Single Order Details Modal / View
  if (selectedOrder) {
    const statusStyle = getStatusColor(selectedOrder.orderStatus);
    const paymentStyle = getPaymentStatusColor(selectedOrder.paymentStatus);
    const currentStageIndex = selectedOrder.orderStatus === 'COMPLETED'
      ? orderStages.length - 1
      : orderStages.indexOf(selectedOrder.orderStatus);

    return (
      <div className="page" style={{ paddingBottom: 'var(--space-3xl)' }}>
        <div className="page__content">
          {/* Back button */}
          <button
            className="btn btn--sm btn--outline"
            onClick={() => setSelectedOrder(null)}
            style={{ marginBottom: 'var(--space-md)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={16} /> {t('general.back', language)}
          </button>

          {/* Header Card */}
          <div className="card card--elevated" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
              <div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                  {t('orders.orderNumber', language)}
                </span>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: 0 }}>
                  #{selectedOrder.orderNumber}
                </h2>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.border}`,
                }}
              >
                {t(`status.${selectedOrder.orderStatus}` as any, language)}
              </span>
            </div>

            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {new Date(selectedOrder.createdAt).toLocaleString()}
            </div>

            {/* Status Timeline Bar */}
            {selectedOrder.orderStatus !== 'CANCELLED' ? (
              <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', marginBottom: '8px' }}>
                  {orderStages.map((stage, idx) => {
                    const isDone = currentStageIndex >= idx;
                    const isCurrent = currentStageIndex === idx;

                    return (
                      <div key={stage} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            background: isDone ? 'var(--color-primary)' : 'var(--color-bg-secondary)',
                            color: isDone ? 'white' : 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: isCurrent ? '2px solid var(--color-primary)' : 'none',
                          }}
                        >
                          {isDone ? <Check size={13} /> : idx + 1}
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: isCurrent ? 700 : 500,
                            color: isCurrent ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            marginTop: '4px',
                            textAlign: 'center',
                          }}
                        >
                          {t(`status.${stage}` as any, language)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={{ padding: 'var(--space-sm)', background: '#FEE2E2', color: '#DC2626', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-xs)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> This order was cancelled.
              </div>
            )}
          </div>

          {/* Items Card */}
          <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Package size={18} color="var(--color-primary)" /> {t('orders.items', language)} ({selectedOrder.items.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {selectedOrder.items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-xs) 0',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: 'var(--radius-sm)',
                        background: item.productPhoto ? `url(${item.productPhoto}) center/cover` : 'var(--color-bg-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!item.productPhoto && <Tag size={18} color="var(--color-text-tertiary)" />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>{item.productName}</div>
                      <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                        {item.quantity} × {formatPrice(item.unitPrice)}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', color: 'var(--color-primary)' }}>
                    {formatPrice(item.total)}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 'var(--space-sm)', fontWeight: 800, fontSize: 'var(--font-base)' }}>
                <span>{t('basket.total', language)}</span>
                <span style={{ color: 'var(--color-primary)' }}>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Details Card */}
          <div className="card" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={18} color="var(--color-primary)" /> {t('checkout.deliveryInfo', language)}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--font-sm)' }}>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Recipient: </span>
                <strong>{selectedOrder.customerName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Phone: </span>
                <a href={`tel:${selectedOrder.customerPhone}`} style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  {selectedOrder.customerPhone}
                </a>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Address: </span>
                <span>{selectedOrder.deliveryAddress}</span>
              </div>
              {(selectedOrder.buildingNumber || selectedOrder.homeNumber || selectedOrder.entranceCode) && (
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                  {selectedOrder.buildingNumber && `Bldg: ${selectedOrder.buildingNumber} `}
                  {selectedOrder.homeNumber && `Apt: ${selectedOrder.homeNumber} `}
                  {selectedOrder.entranceCode && `Entrance: ${selectedOrder.entranceCode}`}
                </div>
              )}
            </div>
          </div>

          {/* Payment Card & Bank Accounts */}
          <div className="card card--elevated" style={{ padding: 'var(--space-lg)', marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={18} color="var(--color-primary)" /> {t('payment.title', language)}
              </h3>
              <span
                style={{
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 700,
                  background: paymentStyle.bg,
                  color: paymentStyle.color,
                }}
              >
                {t(`payment.${selectedOrder.paymentStatus}` as any, language)}
              </span>
            </div>

            {/* Bank details */}
            {bankAccounts.length > 0 && (
              <div style={{ marginBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {bankAccounts.filter(b => b.isActive).map((bank) => (
                  <div
                    key={bank.id}
                    style={{
                      background: 'var(--color-bg-secondary)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                      {bank.bankName} · {bank.holderName}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 'var(--font-base)' }}>
                        {bank.accountNumber}
                      </span>
                      <button
                        className="btn btn--sm btn--outline"
                        style={{
                          padding: '4px 10px',
                          fontSize: 'var(--font-xs)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          borderColor: copiedBankId === bank.id ? 'var(--color-primary)' : undefined,
                          color: copiedBankId === bank.id ? 'var(--color-primary)' : undefined,
                        }}
                        onClick={() => handleCopy(bank.accountNumber, bank.id)}
                      >
                        {copiedBankId === bank.id ? (
                          <><Check size={12} /> {t('payment.copied', language)}</>
                        ) : (
                          <><Copy size={12} /> {t('payment.copy', language)}</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Upload Payment Proof */}
            <div style={{ paddingTop: 'var(--space-sm)' }}>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleProofUpload}
                style={{ display: 'none' }}
              />

              {selectedOrder.paymentProofImage ? (
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-success)', fontWeight: 600, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Payment proof uploaded
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '140px',
                      borderRadius: 'var(--radius-md)',
                      background: `url(${selectedOrder.paymentProofImage}) center/cover`,
                      border: '1px solid var(--color-border)',
                      marginBottom: 'var(--space-sm)',
                    }}
                  />
                  <button
                    className="btn btn--sm btn--outline"
                    style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingProof}
                  >
                    <RefreshCw size={14} /> Re-upload Receipt
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn--primary"
                  style={{ width: '100%', padding: 'var(--space-md)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingProof}
                >
                  <Upload size={16} />
                  {uploadingProof ? 'Uploading Receipt...' : t('payment.uploadProof', language)}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order List View
  return (
    <div className="page" style={{ paddingBottom: 'var(--space-3xl)' }}>
      <div className="page__content">
        <h1 className="page__title">{t('orders.title', language)}</h1>

        {/* Tab Filters */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-xs)',
            background: 'var(--color-bg-secondary)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--space-md)',
            overflowX: 'auto',
          }}
        >
          {(['all', 'active', 'completed', 'cancelled'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                background: activeTab === tab ? 'var(--color-bg)' : 'transparent',
                fontWeight: activeTab === tab ? 700 : 500,
                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                fontSize: 'var(--font-xs)',
                cursor: 'pointer',
                textTransform: 'capitalize',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab === 'all' ? 'All' : tab === 'active' ? 'Active' : tab === 'completed' ? 'Completed' : 'Cancelled'}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon" style={{ display: 'flex', justifyContent: 'center' }}>
              <Package size={48} color="var(--color-primary)" />
            </div>
            <div className="empty-state__title">{t('orders.empty', language)}</div>
            <div className="empty-state__desc">{t('orders.emptyDesc', language)}</div>
            <button
              className="btn btn--primary"
              style={{ marginTop: 'var(--space-md)' }}
              onClick={() => navigate('/')}
            >
              {t('basket.startShopping', language)}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {filteredOrders.map((order) => {
              const statusStyle = getStatusColor(order.orderStatus);
              const paymentStyle = getPaymentStatusColor(order.paymentStatus);

              return (
                <div
                  key={order.id}
                  className="card card--elevated"
                  style={{
                    padding: 'var(--space-md)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                  onClick={() => setSelectedOrder(order)}
                >
                  {/* Top line: Order # + Status Badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-base)' }}>
                      #{order.orderNumber}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--font-xs)',
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.color,
                        border: `1px solid ${statusStyle.border}`,
                      }}
                    >
                      {t(`status.${order.orderStatus}` as any, language)}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    {order.items.map((i) => `${i.productName} (${i.quantity})`).join(', ')}
                  </div>

                  {/* Bottom line: Date, Payment badge & Total */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                      <span
                        style={{
                          padding: '2px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '10px',
                          fontWeight: 700,
                          background: paymentStyle.bg,
                          color: paymentStyle.color,
                        }}
                      >
                        {t(`payment.${order.paymentStatus}` as any, language)}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)' }}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', color: 'var(--color-primary)' }}>
                      {formatPrice(order.total)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
