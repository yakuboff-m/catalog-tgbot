import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Megaphone } from 'lucide-react';
import { useStore } from '../../store';
import { t } from '../../i18n';

interface AppHeaderProps {
  onNewsClick?: () => void;
  hasUnreadNews?: boolean;
}

export function AppHeader({ onNewsClick, hasUnreadNews }: AppHeaderProps) {
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
            onClick={onNewsClick}
            aria-label="News"
            title={t('home.news', language)}
            style={{ position: 'relative' }}
          >
            <Megaphone size={21} strokeWidth={2.2} />
            {hasUnreadNews && (
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#EF4444',
                  boxShadow: '0 0 6px #EF4444',
                }}
              />
            )}
          </button>
          <button
            className="header-btn"
            onClick={() => navigate('/basket')}
            aria-label="Basket"
          >
            <ShoppingCart size={23} strokeWidth={2.4} />
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
