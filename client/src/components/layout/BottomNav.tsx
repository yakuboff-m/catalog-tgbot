import { NavLink, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Heart, Package, User } from 'lucide-react';
import { useStore } from '../../store';
import { t } from '../../i18n';

export function BottomNav() {
  const language = useStore((s) => s.language);
  const favoritesCount = useStore((s) => s.favoritesCount);
  const location = useLocation();

  // Hide on admin pages
  if (location.pathname.startsWith('/admin')) return null;

  const items = [
    { path: '/', Icon: Home, label: t('nav.home', language) },
    { path: '/categories', Icon: LayoutGrid, label: t('nav.categories', language) },
    { path: '/favorites', Icon: Heart, label: t('nav.favorites', language), badge: favoritesCount },
    { path: '/orders', Icon: Package, label: t('nav.orders', language) },
    { path: '/profile', Icon: User, label: t('nav.profile', language) },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const { Icon } = item;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
            }
            end={item.path === '/'}
          >
            <span className="bottom-nav__icon">
              <Icon size={22} strokeWidth={2.2} />
            </span>
            <span className="bottom-nav__label">{item.label}</span>
            {item.badge ? (
              <span className="bottom-nav__badge">{item.badge > 99 ? '99+' : item.badge}</span>
            ) : null}
          </NavLink>
        );
      })}
    </nav>
  );
}
