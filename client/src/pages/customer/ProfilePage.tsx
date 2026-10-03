import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Palette,
  MapPin,
  Package,
  ShieldCheck,
  ChevronRight,
  Check,
  Sun,
  Moon,
  Monitor,
  X,
} from 'lucide-react';
import { useStore } from '../../store';
import { t, LANGUAGES } from '../../i18n';
import type { Language } from '../../i18n';
import { api } from '../../api/client';
import { showToast } from '../../hooks/useToast';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, language, theme, setLanguage, setTheme, updateUser } = useStore();

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Address edit state
  const [addressForm, setAddressForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    address: user?.address || '',
    buildingNumber: user?.buildingNumber || '',
    homeNumber: user?.homeNumber || '',
    entranceCode: user?.entranceCode || '',
  });

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    setIsLanguageModalOpen(false);
    showToast('Language updated', 'success');
    try {
      await api.updateProfile({ language: lang });
      updateUser({ language: lang });
    } catch {
      // Keep local update
    }
  };

  const handleThemeChange = async (newTheme: 'system' | 'light' | 'dark') => {
    setTheme(newTheme);
    showToast('Theme updated', 'success');
    try {
      await api.updateProfile({ theme: newTheme });
      updateUser({ theme: newTheme });
    } catch {
      // Keep local update
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const updated = await api.updateProfile(addressForm);
      updateUser(updated);
      setIsAddressModalOpen(false);
      showToast('Delivery address saved', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to save address', 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const displayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Guest';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <div className="page" style={{ paddingBottom: 'calc(var(--nav-height) + var(--space-2xl))' }}>
      <div className="page__content">
        {/* Profile Header Card */}
        <div
          className="card card--elevated"
          style={{
            padding: 'var(--space-lg)',
            marginBottom: 'var(--space-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-md)',
            background: 'var(--color-surface)',
            borderRadius: '20px',
            border: '1px solid var(--color-border)',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), #FF6B6B)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(230, 0, 18, 0.25)',
              flexShrink: 0,
            }}
          >
            {(displayName[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </h2>
              {isAdmin && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    background: 'rgba(230, 0, 18, 0.1)',
                    color: 'var(--color-primary)',
                    fontSize: '10px',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  Admin
                </span>
              )}
            </div>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {user?.telegramUsername ? `@${user.telegramUsername}` : `ID: ${user?.telegramId || 'Guest'}`}
            </div>
          </div>
        </div>

        {/* SECTION 1: PREFERENCES */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-xs)',
              paddingLeft: 'var(--space-xs)',
            }}
          >
            Preferences
          </div>

          <div
            className="card"
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Language Row */}
            <div
              onClick={() => setIsLanguageModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-lg)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(59, 130, 246, 0.12)',
                    color: '#3B82F6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Globe size={18} strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                  {t('profile.language', language)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                  {LANGUAGES.find((l) => l.code === language)?.label || 'English'}
                </span>
                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </div>
            </div>

            {/* Theme Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-lg)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(139, 92, 246, 0.12)',
                    color: '#8B5CF6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Palette size={18} strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                  {t('profile.theme', language)}
                </span>
              </div>

              {/* Segmented Theme Switcher */}
              <div
                style={{
                  display: 'flex',
                  background: 'var(--color-bg-secondary)',
                  padding: '3px',
                  borderRadius: '10px',
                  gap: '2px',
                }}
              >
                {[
                  { id: 'system', Icon: Monitor, label: 'Auto' },
                  { id: 'light', Icon: Sun, label: 'Light' },
                  { id: 'dark', Icon: Moon, label: 'Dark' },
                ].map(({ id, Icon, label }) => {
                  const isActive = theme === id;
                  return (
                    <button
                      key={id}
                      onClick={() => handleThemeChange(id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive ? 'var(--color-surface)' : 'transparent',
                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        fontSize: '11px',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                      title={label}
                    >
                      <Icon size={13} strokeWidth={2.2} />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: SHOPPING & DELIVERY */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-xs)',
              paddingLeft: 'var(--space-xs)',
            }}
          >
            Shopping
          </div>

          <div
            className="card"
            style={{
              borderRadius: '18px',
              overflow: 'hidden',
              padding: 0,
              border: '1px solid var(--color-border)',
            }}
          >
            {/* Delivery Address Row */}
            <div
              onClick={() => {
                setAddressForm({
                  fullName: user?.fullName || '',
                  phone: user?.phone || '',
                  address: user?.address || '',
                  buildingNumber: user?.buildingNumber || '',
                  homeNumber: user?.homeNumber || '',
                  entranceCode: user?.entranceCode || '',
                });
                setIsAddressModalOpen(true);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-lg)',
                cursor: 'pointer',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <MapPin size={18} strokeWidth={2.2} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                    {t('profile.deliveryInfo', language)}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user?.address ? `${user.address}${user.buildingNumber ? `, Bldg ${user.buildingNumber}` : ''}` : t('profile.noInfo', language)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary)', fontWeight: 600 }}>
                  {user?.address ? 'Edit' : 'Add'}
                </span>
                <ChevronRight size={16} color="var(--color-text-tertiary)" />
              </div>
            </div>

            {/* My Orders Row */}
            <div
              onClick={() => navigate('/orders')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 'var(--space-md) var(--space-lg)',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    color: '#F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package size={18} strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                  {t('nav.orders', language)}
                </span>
              </div>

              <ChevronRight size={16} color="var(--color-text-tertiary)" />
            </div>
          </div>
        </div>

        {/* SECTION 3: ADMINISTRATION */}
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--color-text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 'var(--space-xs)',
              paddingLeft: 'var(--space-xs)',
            }}
          >
            Store Management
          </div>

          <div
            className="card card--elevated"
            onClick={async () => {
              if (!isAdmin) {
                try {
                  const res = await api.devLogin('ADMIN');
                  useStore.getState().setAuth(res.token, res.user);
                  showToast('Admin mode activated!', 'success');
                } catch {
                  // proceed anyway
                }
              }
              navigate('/admin');
            }}
            style={{
              borderRadius: '18px',
              padding: 'var(--space-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(230, 0, 18, 0.06), rgba(255, 107, 107, 0.1))',
              border: '1px solid rgba(230, 0, 18, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(230, 0, 18, 0.3)',
                }}
              >
                <ShieldCheck size={22} strokeWidth={2.2} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 'var(--font-base)' }}>
                  {t('admin.dashboard', language)}
                </div>
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {isAdmin ? 'Orders, products, categories & metrics' : 'Tap to switch to Admin mode'}
                </div>
              </div>
            </div>

            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--color-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
              }}
            >
              <ChevronRight size={18} color="var(--color-primary)" />
            </div>
          </div>
        </div>

        {/* SECTION 4: DEV ROLE SWITCHER */}
        {import.meta.env.DEV && (
          <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-md)', background: 'var(--color-bg-secondary)', borderRadius: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Developer Sandbox Role
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
              <button
                className={`btn btn--sm ${isAdmin ? 'btn--primary' : 'btn--outline'}`}
                style={{ borderRadius: '10px', fontWeight: 700 }}
                onClick={async () => {
                  const res = await api.devLogin('ADMIN');
                  useStore.getState().setAuth(res.token, res.user);
                  showToast('Role: ADMIN', 'info');
                }}
              >
                Admin Mode
              </button>
              <button
                className={`btn btn--sm ${!isAdmin ? 'btn--primary' : 'btn--outline'}`}
                style={{ borderRadius: '10px', fontWeight: 700 }}
                onClick={async () => {
                  const res = await api.devLogin('CUSTOMER');
                  useStore.getState().setAuth(res.token, res.user);
                  showToast('Role: CUSTOMER', 'info');
                }}
              >
                Customer Mode
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Language Selection Bottom Sheet / Modal */}
      {isLanguageModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setIsLanguageModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              background: 'var(--color-surface)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: 'var(--space-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <h3 style={{ margin: 0, fontSize: 'var(--font-lg)', fontWeight: 800 }}>
                {t('profile.language', language)}
              </h3>
              <button
                onClick={() => setIsLanguageModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {LANGUAGES.map((lang) => {
                const isSelected = language === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageChange(lang.code)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-md) var(--space-lg)',
                      borderRadius: '14px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: isSelected ? 'rgba(230, 0, 18, 0.05)' : 'var(--color-bg)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span style={{ fontSize: '20px' }}>{lang.flag}</span>
                      <span style={{ fontWeight: isSelected ? 700 : 500, fontSize: 'var(--font-base)', color: isSelected ? 'var(--color-primary)' : 'var(--color-text)' }}>
                        {lang.label}
                      </span>
                    </div>
                    {isSelected && <Check size={18} color="var(--color-primary)" strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Delivery Address Modal */}
      {isAddressModalOpen && (
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
          onClick={() => setIsAddressModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: 'var(--color-surface)',
              borderRadius: '24px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              border: '1px solid var(--color-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-xl)', fontWeight: 800 }}>
                  {t('profile.deliveryInfo', language)}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Enter your default shipping details
                </p>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
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

            <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">
                  {t('checkout.fullName', language)}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  placeholder="e.g. Kim Min-su"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('checkout.phone', language)}
                </label>
                <input
                  type="tel"
                  className="form-input"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  placeholder="010-1234-5678"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('checkout.address', language)}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  placeholder="e.g. Seoul, Gangnam-gu, Teheran-ro 152"
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
                    value={addressForm.buildingNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, buildingNumber: e.target.value })}
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
                    value={addressForm.homeNumber}
                    onChange={(e) => setAddressForm({ ...addressForm, homeNumber: e.target.value })}
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
                    value={addressForm.entranceCode}
                    onChange={(e) => setAddressForm({ ...addressForm, entranceCode: e.target.value })}
                    placeholder="*1234#"
                  />
                </div>
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
                disabled={savingAddress}
              >
                {savingAddress ? 'Saving...' : t('general.save', language)}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
