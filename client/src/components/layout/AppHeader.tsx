import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { useStore } from '../../store';
import { t } from '../../i18n';

export function AppHeader() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const language = useStore((s) => s.language);
  const basketCount = useStore((s) => s.basketCount);

  const displayName = user?.fullName || user?.firstName || 'Guest';

  return (
    <header className="app-header">
      <div className="app-header__top">
        <div className="app-header__greeting">
          <div className="app-header__name">
            {displayName}
          </div>
          <div className="app-header__subtitle">
            {t('header.search', language)}
          </div>
        </div>
        <div className="app-header__actions">
          <button
            className="header-btn"
            onClick={() => navigate('/search')}
            aria-label="Search"
          >
            <Search size={20} strokeWidth={2.2} />
          </button>
          <button
            className="header-btn"
            onClick={() => navigate('/basket')}
            aria-label="Basket"
          >
            <ShoppingBag size={20} strokeWidth={2.2} />
            {basketCount > 0 && (
              <span className="header-btn__badge">
                {basketCount > 99 ? '99+' : basketCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
