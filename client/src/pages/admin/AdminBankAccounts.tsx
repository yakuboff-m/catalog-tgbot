import { useEffect, useState } from 'react';
import { Landmark, Plus, X, Edit3, Trash2 } from 'lucide-react';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  sortOrder: number;
  isActive: boolean;
}

export function AdminBankAccounts() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    holderName: '',
    sortOrder: '1',
  });

  const loadAccounts = async () => {
    try {
      const data = await api.adminGetBankAccounts();
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormData({
      bankName: '',
      accountNumber: '',
      holderName: '',
      sortOrder: (accounts.length + 1).toString(),
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (acc: BankAccount) => {
    setEditingAccount(acc);
    setFormData({
      bankName: acc.bankName,
      accountNumber: acc.accountNumber,
      holderName: acc.holderName,
      sortOrder: acc.sortOrder.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (acc: BankAccount) => {
    if (!window.confirm(`Delete bank account ${acc.bankName} (${acc.accountNumber})?`)) {
      return;
    }
    setDeletingId(acc.id);
    try {
      await api.adminDeleteBankAccount(acc.id);
      setAccounts((prev) => prev.filter((a) => a.id !== acc.id));
      showToast('Bank account deleted', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete bank account', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    try {
      await api.adminUpdateBankAccount(account.id, { isActive: !account.isActive });
      setAccounts((prev) =>
        prev.map((a) => (a.id === account.id ? { ...a, isActive: !a.isActive } : a))
      );
      showToast(`Account ${account.isActive ? 'disabled' : 'activated'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Operation failed', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bankName || !formData.accountNumber || !formData.holderName) {
      showToast('Please fill all fields', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAccount) {
        await api.adminUpdateBankAccount(editingAccount.id, {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          holderName: formData.holderName,
          sortOrder: parseInt(formData.sortOrder, 10) || 1,
        });
        showToast('Bank account updated!', 'success');
      } else {
        await api.adminCreateBankAccount({
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          holderName: formData.holderName,
          sortOrder: parseInt(formData.sortOrder, 10) || 1,
        });
        showToast('Bank account added!', 'success');
      }
      setIsModalOpen(false);
      await loadAccounts();
    } catch (err: any) {
      showToast(err.message || 'Failed to save bank account', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen" style={{ minHeight: '40vh' }}>
        <div className="loading-screen__spinner" />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--font-base)', fontWeight: 700 }}>
          Bank Accounts ({accounts.length})
        </h3>
        <button
          className="btn btn--sm btn--primary"
          onClick={handleOpenAdd}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={15} />
          <span>Add Account</span>
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {accounts.length === 0 ? (
          <div
            className="card"
            style={{
              padding: 'var(--space-2xl) var(--space-lg)',
              textAlign: 'center',
              borderRadius: '24px',
              border: '1.5px dashed var(--color-border)',
              background: 'var(--color-surface)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)',
              }}
            >
              <Landmark size={30} />
            </div>
            <div style={{ fontWeight: 800, fontSize: 'var(--font-base)', marginBottom: '4px' }}>
              No Bank Accounts Configured
            </div>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', maxWidth: '320px', margin: '0 0 var(--space-lg)' }}>
              Add your store's bank account details so customers know where to transfer money when placing orders.
            </p>
            <button
              className="btn btn--primary"
              onClick={handleOpenAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '14px',
                fontWeight: 700,
                fontSize: 'var(--font-sm)',
              }}
            >
              <Plus size={16} />
              <span>Add Bank Account</span>
            </button>
          </div>
        ) : (
          accounts.map((acc) => (
          <div
            key={acc.id}
            className="card card--elevated"
            style={{
              padding: 'var(--space-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-md)',
              opacity: acc.isActive ? 1 : 0.65,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Landmark size={18} color="var(--color-primary)" />
                <span>{acc.bankName}</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: acc.isActive ? '#D1FAE5' : '#FEE2E2',
                    color: acc.isActive ? '#059669' : '#DC2626',
                  }}
                >
                  {acc.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 'var(--font-sm)', marginTop: '4px', color: 'var(--color-text)' }}>
                {acc.accountNumber}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Holder: <strong>{acc.holderName}</strong> · Sort Order: {acc.sortOrder}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                className="btn btn--sm btn--outline"
                style={{
                  fontSize: 'var(--font-xs)',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => handleOpenEdit(acc)}
                title="Edit account details"
              >
                <Edit3 size={13} />
                <span>Edit</span>
              </button>

              <button
                className="btn btn--sm"
                style={{
                  fontSize: 'var(--font-xs)',
                  background: acc.isActive ? '#FEF3C7' : '#D1FAE5',
                  color: acc.isActive ? '#D97706' : '#059669',
                  border: 'none',
                  fontWeight: 600,
                  padding: '6px 10px',
                }}
                onClick={() => handleToggleActive(acc)}
              >
                {acc.isActive ? 'Disable' : 'Enable'}
              </button>

              <button
                className="btn btn--sm"
                style={{
                  fontSize: 'var(--font-xs)',
                  background: '#FEE2E2',
                  color: '#DC2626',
                  border: 'none',
                  padding: '6px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onClick={() => handleDelete(acc)}
                disabled={deletingId === acc.id}
                title="Delete account"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>

      {isModalOpen && (
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
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-md)',
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 'var(--font-lg)' }}>
                  {editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {editingAccount ? 'Update account info for buyer payments' : 'Add account details shown at checkout'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--color-bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  Bank Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  placeholder="e.g. KB Kookmin Bank / Kapitalbank"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Account / Card Number *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="e.g. 123-456789-01-01"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Account Holder Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.holderName}
                  onChange={(e) => setFormData({ ...formData, holderName: e.target.value })}
                  placeholder="e.g. KIM JINWOO"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Sort Order
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                />
              </div>

              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  marginTop: '8px',
                  height: '48px',
                  fontWeight: 700,
                  fontSize: '15px',
                  borderRadius: '14px',
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.35)',
                }}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : editingAccount ? 'Save Changes' : 'Add Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
