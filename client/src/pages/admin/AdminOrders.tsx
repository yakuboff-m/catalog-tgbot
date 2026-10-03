import { useEffect, useState } from 'react';
import { Package, Phone, MapPin, User, Image, X, Copy, Check } from 'lucide-react';
import { useStore } from '../../store';
import { t } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface OrderItem {
  id: string;
  productName: string;
  productPhoto: string | null;
  unitName: string;
  unitPrice: number;
  quantity: number;
  total: number;
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
  total: number;
  paymentProofImage: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: {
    telegramUsername: string | null;
    firstName: string;
  };
}

const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  PENDING: { label: 'Pending', bg: '#FEF3C7', color: '#D97706', border: '#FCD34D' },
  CONFIRMED: { label: 'Confirmed', bg: '#DBEAFE', color: '#2563EB', border: '#93C5FD' },
  PROCESSING: { label: 'Processing', bg: '#EDE9FE', color: '#7C3AED', border: '#C4B5FD' },
  READY: { label: "Sent / Jo'natildi", bg: '#CCFBF1', color: '#0D9488', border: '#5EEAD4' },
  COMPLETED: { label: 'Completed', bg: '#D1FAE5', color: '#059669', border: '#6EE7B7' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#DC2626', border: '#FCA5A5' },
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  UNPAID: { label: 'Unpaid', bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  PAYMENT_SUBMITTED: { label: 'Proof Submitted', bg: '#EFF6FF', color: '#2563EB', border: '#93C5FD' },
  PAID: { label: 'Paid', bg: '#ECFDF5', color: '#059669', border: '#6EE7B7' },
  PAYMENT_REJECTED: { label: 'Rejected', bg: '#FEF2F2', color: '#991B1B', border: '#FCA5A5' },
};

export function AdminOrders() {
  const language = useStore((s) => s.language);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status updating state (tracks which status is being set)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);

  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const loadOrders = async () => {
    try {
      const data = await api.adminGetOrders();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  // Instant 1-click status change
  const handleInstantOrderStatusChange = async (newStatus: string) => {
    if (!selectedOrder || selectedOrder.orderStatus === newStatus || updatingStatus) return;

    setUpdatingStatus(newStatus);
    try {
      await api.adminUpdateOrderStatus(selectedOrder.id, newStatus);
      showToast(`Order status updated to ${newStatus}`, 'success');

      setSelectedOrder((prev) => (prev ? { ...prev, orderStatus: newStatus } : null));
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, orderStatus: newStatus } : o))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update order status', 'error');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Instant 1-click payment status change
  const handleInstantPaymentStatusChange = async (newPaymentStatus: string) => {
    if (!selectedOrder || selectedOrder.paymentStatus === newPaymentStatus || updatingPayment) return;

    setUpdatingPayment(newPaymentStatus);
    try {
      await api.adminUpdatePaymentStatus(selectedOrder.id, newPaymentStatus);
      showToast(`Payment status updated to ${newPaymentStatus}`, 'success');

      setSelectedOrder((prev) => (prev ? { ...prev, paymentStatus: newPaymentStatus } : null));
      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? { ...o, paymentStatus: newPaymentStatus } : o))
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to update payment status', 'error');
    } finally {
      setUpdatingPayment(null);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    showToast(`${label} copied to clipboard!`, 'success');
  };

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === 'ALL') return true;
    return order.orderStatus === statusFilter;
  });

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="loading-screen__spinner" />
      </div>
    );
  }

  return (
    <div>
      {/* Status Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: 'var(--space-xs)',
          overflowX: 'auto',
          paddingBottom: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
          scrollbarWidth: 'none',
        }}
      >
        {['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`pill ${statusFilter === st ? 'pill--active' : ''}`}
            style={{ fontSize: 'var(--font-xs)', whiteSpace: 'nowrap' }}
          >
            {st === 'ALL' ? 'All Orders' : t(`status.${st}` as any, language)}
            {st !== 'ALL' && ` (${orders.filter((o) => o.orderStatus === st).length})`}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 'var(--space-2xl) var(--space-lg)',
            textAlign: 'center',
            borderRadius: '24px',
            border: '1.5px dashed var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto var(--space-sm)',
            }}
          >
            <Package size={28} />
          </div>
          <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
            No Orders Found
          </div>
          <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-md)' }}>
            {statusFilter === 'ALL'
              ? 'When customers place orders, they will show up here.'
              : `No orders currently match the filter "${statusFilter}".`}
          </p>
          {statusFilter !== 'ALL' && (
            <button
              className="btn btn--sm btn--outline"
              onClick={() => setStatusFilter('ALL')}
              style={{ borderRadius: '12px' }}
            >
              Show All Orders
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {filteredOrders.map((order) => {
            const stConfig = ORDER_STATUS_CONFIG[order.orderStatus] || ORDER_STATUS_CONFIG.PENDING;
            const payConfig = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.UNPAID;

            return (
              <div
                key={order.id}
                className="card card--elevated"
                style={{
                  padding: 'var(--space-md)',
                  cursor: 'pointer',
                  borderRadius: '18px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => handleOpenOrder(order)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-base)' }}>
                      #{order.orderNumber}
                    </span>
                    <span style={{ marginLeft: 'var(--space-sm)', fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                      {order.customerName}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      background: stConfig.bg,
                      color: stConfig.color,
                      border: `1px solid ${stConfig.border}`,
                    }}
                  >
                    {stConfig.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Phone size={12} />
                    {order.customerPhone}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                    <MapPin size={12} />
                    {order.deliveryAddress}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--color-border)' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '8px',
                      background: payConfig.bg,
                      color: payConfig.color,
                      border: `1px solid ${payConfig.border}`,
                    }}
                  >
                    {payConfig.label}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)' }}>
                      {order.items.length} items
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 'var(--font-base)', color: 'var(--color-primary)' }}>
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Management Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              background: 'var(--color-surface)',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              padding: '20px 24px 32px',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Sheet Drag Handle */}
            <div
              style={{
                width: '40px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--color-border)',
                margin: '0 auto 16px',
              }}
            />

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
                  Order Details
                </span>
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 800, margin: '2px 0 0' }}>
                  #{selectedOrder.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-secondary)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 1-CLICK ORDER STATUS CHIPS */}
            <div
              className="card"
              style={{
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
                borderRadius: '18px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Order Status (Click to Change Instantly)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {Object.entries(ORDER_STATUS_CONFIG).map(([key, cfg]) => {
                  const isActive = selectedOrder.orderStatus === key;
                  const isUpdating = updatingStatus === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInstantOrderStatusChange(key)}
                      disabled={isUpdating}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '12px',
                        border: isActive ? `2px solid ${cfg.color}` : '1px solid var(--color-border)',
                        background: isActive ? cfg.bg : 'var(--color-bg)',
                        color: isActive ? cfg.color : 'var(--color-text)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? `0 2px 8px ${cfg.color}33` : 'none',
                      }}
                    >
                      {isActive && <Check size={12} strokeWidth={3} />}
                      <span>{isUpdating ? 'Saving...' : cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1-CLICK PAYMENT STATUS CHIPS */}
            <div
              className="card"
              style={{
                padding: 'var(--space-md)',
                marginBottom: 'var(--space-md)',
                borderRadius: '18px',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-secondary)', marginBottom: '8px', letterSpacing: '0.05em' }}>
                Payment Status (Click to Change Instantly)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, cfg]) => {
                  const isActive = selectedOrder.paymentStatus === key;
                  const isUpdating = updatingPayment === key;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleInstantPaymentStatusChange(key)}
                      disabled={isUpdating}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '12px',
                        border: isActive ? `2px solid ${cfg.color}` : '1px solid var(--color-border)',
                        background: isActive ? cfg.bg : 'var(--color-bg)',
                        color: isActive ? cfg.color : 'var(--color-text)',
                        fontWeight: isActive ? 800 : 600,
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                        boxShadow: isActive ? `0 2px 8px ${cfg.color}33` : 'none',
                      }}
                    >
                      {isActive && <Check size={12} strokeWidth={3} />}
                      <span>{isUpdating ? 'Saving...' : cfg.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer Contact & Address (With 1-Tap Copy) */}
            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                  <User size={15} color="var(--color-primary)" />
                  <span>{selectedOrder.customerName}</span>
                </div>
              </div>

              {/* Copyable Phone */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '10px',
                  marginBottom: '6px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)' }}>
                  <Phone size={13} color="var(--color-text-secondary)" />
                  <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{selectedOrder.customerPhone}</span>
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  onClick={() => handleCopy(selectedOrder.customerPhone, 'Phone number')}
                  style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Copy size={11} /> Copy
                </button>
              </div>

              {/* Copyable Address */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <MapPin size={13} color="var(--color-text-secondary)" style={{ flexShrink: 0 }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOrder.deliveryAddress}
                    {selectedOrder.buildingNumber && ` (${selectedOrder.buildingNumber})`}
                    {selectedOrder.homeNumber && ` - ${selectedOrder.homeNumber}`}
                    {selectedOrder.entranceCode && ` [Code: ${selectedOrder.entranceCode}]`}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  onClick={() =>
                    handleCopy(
                      `${selectedOrder.deliveryAddress} ${selectedOrder.buildingNumber || ''} ${selectedOrder.homeNumber || ''} ${selectedOrder.entranceCode ? `(Code: ${selectedOrder.entranceCode})` : ''}`.trim(),
                      'Address'
                    )
                  }
                  style={{ padding: '2px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
            </div>

            {/* Payment Proof Preview */}
            {selectedOrder.paymentProofImage && (
              <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-md)', borderRadius: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '8px' }}>
                  <Image size={15} color="var(--color-primary)" />
                  <span>Customer Transfer Screenshot:</span>
                </div>
                <a href={selectedOrder.paymentProofImage} target="_blank" rel="noreferrer" style={{ display: 'block', borderRadius: '12px', overflow: 'hidden' }}>
                  <img
                    src={selectedOrder.paymentProofImage}
                    alt="Proof"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', background: '#000', borderRadius: '12px' }}
                  />
                </a>
              </div>
            )}

            {/* Items Card */}
            <div className="card" style={{ padding: 'var(--space-md)', borderRadius: '18px' }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-sm)', marginBottom: '8px' }}>
                Order Items ({selectedOrder.items.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedOrder.items.map((it) => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
                    <span>
                      {it.productName} × {it.quantity}
                    </span>
                    <strong>{formatPrice(it.total)}</strong>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--color-border)', fontWeight: 800 }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--color-primary)', fontSize: 'var(--font-base)' }}>{formatPrice(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
