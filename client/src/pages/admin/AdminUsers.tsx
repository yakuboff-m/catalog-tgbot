import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';
import { Phone, Package } from 'lucide-react';

interface User {
  id: string;
  telegramId: string;
  telegramUsername: string | null;
  firstName: string;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      const data = await api.adminGetUsers({ limit: '100' });
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleBlock = async (userId: string) => {
    setTogglingId(userId);
    try {
      const res = await api.adminToggleUserBlock(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isActive: res.user.isActive } : u))
      );
      showToast(res.user.isActive ? 'User unblocked' : 'User blocked', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to toggle block status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      (u.firstName && u.firstName.toLowerCase().includes(q)) ||
      (u.lastName && u.lastName.toLowerCase().includes(q)) ||
      (u.telegramUsername && u.telegramUsername.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.telegramId && u.telegramId.includes(q))
    );
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
      <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, phone, or Telegram ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {filtered.map((user) => {
          const isToggling = togglingId === user.id;

          return (
            <div
              key={user.id}
              className="card card--elevated"
              style={{
                padding: 'var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 'var(--space-md)',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--font-sm)' }}>
                    {user.fullName || `${user.firstName} ${user.lastName || ''}`.trim() || 'Unknown'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      background: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#DBEAFE' : 'var(--color-bg-secondary)',
                      color: user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? '#2563EB' : 'var(--color-text-secondary)',
                    }}
                  >
                    {user.role}
                  </span>
                  {!user.isActive && (
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 6px', borderRadius: 'var(--radius-sm)', background: '#FEE2E2', color: '#DC2626' }}>
                      BLOCKED
                    </span>
                  )}
                </div>

                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  TG ID: {user.telegramId} {user.telegramUsername && `(@${user.telegramUsername})`}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Phone size={12} /> {user.phone || 'No phone'}
                  </span>
                  <span>·</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Package size={12} /> {user._count?.orders ?? 0} orders
                  </span>
                </div>
              </div>

              {user.role !== 'SUPER_ADMIN' && (
                <button
                  className="btn btn--sm"
                  style={{
                    fontSize: 'var(--font-xs)',
                    background: user.isActive ? '#FEE2E2' : '#D1FAE5',
                    color: user.isActive ? '#DC2626' : '#059669',
                    border: 'none',
                    fontWeight: 700,
                    padding: '6px 12px',
                  }}
                  onClick={() => handleToggleBlock(user.id)}
                  disabled={isToggling}
                >
                  {isToggling ? '...' : user.isActive ? 'Block' : 'Unblock'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
