import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingBag,
  Tag,
  FolderTree,
  Ruler,
  Users,
  Landmark,
  Newspaper,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useStore } from '../../store';
import { t } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { AdminOrders } from './AdminOrders';
import { AdminProducts } from './AdminProducts';
import { AdminCategories } from './AdminCategories';
import { AdminUnits } from './AdminUnits';
import { AdminUsers } from './AdminUsers';
import { AdminBankAccounts } from './AdminBankAccounts';
import { AdminContent } from './AdminContent';

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  outOfStockProducts: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  revenue: number;
}

export function AdminDashboard() {
  const language = useStore((s) => s.language);
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeSection = pathParts[1] || 'overview';

  useEffect(() => {
    async function loadStats() {
      if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.adminGetDashboard();
        setStats(data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [location.pathname, user?.role]);

  const handleEnableAdmin = async () => {
    try {
      const res = await api.devLogin('ADMIN');
      useStore.getState().setAuth(res.token, res.user);
      showToast('Admin mode activated!', 'success');
      const data = await api.adminGetDashboard();
      setStats(data);
    } catch (err: any) {
      showToast(err.message || 'Failed to activate admin', 'error');
    }
  };

  if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="page">
        <div className="empty-state" style={{ minHeight: '80vh' }}>
          <div className="empty-state__icon">
            <AlertCircle size={48} color="var(--color-danger)" />
          </div>
          <div className="empty-state__title">Access Restricted</div>
          <div className="empty-state__desc" style={{ marginBottom: 'var(--space-md)' }}>
            Administrator privileges are required for this section.
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', width: '100%', maxWidth: '280px', margin: '0 auto' }}>
            {import.meta.env.DEV && !(window as any).Telegram?.WebApp?.initData && (
              <button className="btn btn--primary" onClick={handleEnableAdmin}>
                Switch to Admin Mode (Dev)
              </button>
            )}
            <button className="btn btn--outline" onClick={() => navigate('/')}>
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const formatPrice = (p: number) => `₩${p.toLocaleString()}`;

  const navItems = [
    { id: 'overview', label: t('admin.dashboard', language), Icon: LayoutDashboard, path: '/admin' },
    { id: 'orders', label: t('admin.orders', language), Icon: ShoppingBag, path: '/admin/orders', badge: stats?.pendingOrders },
    { id: 'products', label: t('admin.products', language), Icon: Tag, path: '/admin/products' },
    { id: 'categories', label: t('admin.categories', language), Icon: FolderTree, path: '/admin/categories' },
    { id: 'units', label: t('admin.units', language), Icon: Ruler, path: '/admin/units' },
    { id: 'users', label: t('admin.users', language), Icon: Users, path: '/admin/users' },
    { id: 'bank-accounts', label: t('admin.bankAccounts', language), Icon: Landmark, path: '/admin/bank-accounts' },
    { id: 'content', label: 'News & Banners', Icon: Newspaper, path: '/admin/content' },
  ];

  return (
    <div className="page" style={{ paddingBottom: 'calc(var(--nav-height) + var(--space-2xl))' }}>
      <div className="page__content">
        {/* Admin Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
            paddingBottom: 'var(--space-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {activeSection !== 'overview' && (
              <button
                className="btn btn--sm btn--outline"
                onClick={() => navigate('/admin')}
                style={{ padding: '6px', borderRadius: '10px' }}
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div>
              <h1 className="page__title" style={{ marginBottom: 0, fontSize: 'var(--font-xl)', fontWeight: 800 }}>
                {activeSection === 'overview'
                  ? t('admin.dashboard', language)
                  : navItems.find((n) => n.id === activeSection)?.label || 'Admin'}
              </h1>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Store Management Console
              </div>
            </div>
          </div>

          <button
            className="btn btn--sm btn--outline"
            onClick={() => navigate('/')}
            style={{ borderRadius: '10px', fontSize: 'var(--font-xs)', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{t('nav.home', language)}</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Tab Pills Nav */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            overflowX: 'auto',
            paddingBottom: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
            scrollbarWidth: 'none',
          }}
        >
          {navItems.map((item) => {
            const { Icon } = item;
            const isActive =
              activeSection === item.id ||
              (item.id === 'content' && ['news', 'banners'].includes(activeSection));

            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`pill ${isActive ? 'pill--active' : ''}`}
                style={{
                  fontSize: 'var(--font-xs)',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '12px',
                  padding: '8px 14px',
                }}
              >
                <Icon size={14} strokeWidth={2.2} />
                <span>{item.label}</span>
                {Boolean(item.badge) && (
                  <span
                    style={{
                      background: 'var(--color-danger)',
                      color: 'white',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 6px',
                      fontSize: '10px',
                      fontWeight: 800,
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Main Overview Dashboard */}
        {activeSection === 'overview' && (
          <div>
            {/* Revenue Hero Card */}
            <div
              className="card card--elevated"
              style={{
                padding: 'var(--space-lg)',
                marginBottom: 'var(--space-lg)',
                background: 'linear-gradient(135deg, rgba(230, 0, 18, 0.08), rgba(255, 107, 107, 0.12))',
                borderRadius: '20px',
                border: '1px solid rgba(230, 0, 18, 0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <TrendingUp size={14} />
                  <span>{t('admin.revenue', language)}</span>
                </div>
                <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-text)', marginTop: '4px' }}>
                  {loading ? '...' : formatPrice(stats?.revenue ?? 0)}
                </div>
              </div>
              <button
                className="btn btn--sm btn--primary"
                onClick={() => navigate('/admin/orders')}
                style={{ borderRadius: '12px', padding: '8px 14px', fontWeight: 700 }}
              >
                Orders
              </button>
            </div>

            {/* Metrics 2x2 Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 'var(--space-md)',
                marginBottom: 'var(--space-xl)',
              }}
            >
              {/* Users */}
              <div
                className="card card--elevated"
                onClick={() => navigate('/admin/users')}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('admin.totalUsers', language)}
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={15} />
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#3B82F6' }}>
                  {loading ? '...' : stats?.totalUsers ?? 0}
                </div>
              </div>

              {/* Total Orders */}
              <div
                className="card card--elevated"
                onClick={() => navigate('/admin/orders')}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('admin.totalOrders', language)}
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShoppingBag size={15} />
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>
                  {loading ? '...' : stats?.totalOrders ?? 0}
                </div>
              </div>

              {/* Pending Orders */}
              <div
                className="card card--elevated"
                onClick={() => navigate('/admin/orders')}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('admin.pendingOrders', language)}
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Clock size={15} />
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: stats?.pendingOrders ? '#EF4444' : '#F59E0B' }}>
                  {loading ? '...' : stats?.pendingOrders ?? 0}
                </div>
              </div>

              {/* Total Products */}
              <div
                className="card card--elevated"
                onClick={() => navigate('/admin/products')}
                style={{
                  padding: 'var(--space-md)',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {t('admin.totalProducts', language)}
                  </span>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tag size={15} />
                  </div>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#8B5CF6' }}>
                  {loading ? '...' : stats?.totalProducts ?? 0}
                </div>
              </div>
            </div>

            {/* Quick Management Section Links */}
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 'var(--space-xs)', paddingLeft: 'var(--space-xs)' }}>
              Management Sections
            </div>

            <div className="card" style={{ borderRadius: '18px', overflow: 'hidden', padding: 0 }}>
              {navItems
                .filter((n) => n.id !== 'overview')
                .map((item, i, arr) => {
                  const { Icon } = item;
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(item.path)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--space-md) var(--space-lg)',
                        cursor: 'pointer',
                        borderBottom: i < arr.length - 1 ? '1px solid var(--color-border)' : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                        <div
                          style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icon size={16} strokeWidth={2.2} />
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                          {item.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {Boolean(item.badge) && (
                          <span
                            style={{
                              background: 'var(--color-danger)',
                              color: 'white',
                              borderRadius: 'var(--radius-full)',
                              padding: '2px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                        <ChevronRight size={16} color="var(--color-text-tertiary)" />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Subpages */}
        {activeSection === 'orders' && <AdminOrders />}
        {activeSection === 'products' && <AdminProducts />}
        {activeSection === 'categories' && <AdminCategories />}
        {activeSection === 'units' && <AdminUnits />}
        {activeSection === 'users' && <AdminUsers />}
        {activeSection === 'bank-accounts' && <AdminBankAccounts />}
        {(activeSection === 'content' || activeSection === 'news' || activeSection === 'banners') && <AdminContent />}
      </div>
    </div>
  );
}
