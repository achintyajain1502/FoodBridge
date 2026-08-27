import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PlusCircle, Search, BarChart3, LogOut, Sprout, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  donor: [{ to: '/donor', label: 'Post & track', icon: <PlusCircle size={18} />, end: true }],
  ngo: [{ to: '/ngo', label: 'Available donations', icon: <Search size={18} />, end: true }],
  admin: [{ to: '/admin', label: 'Overview', icon: <BarChart3 size={18} />, end: true }],
};

export function Sidebar({ open, onNavigate }: { open?: boolean; onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <NavLink to="/" className="sidebar-brand" style={{ textDecoration: 'none' }} onClick={onNavigate}>
        <span className="brand-mark">
          <Sprout size={16} />
        </span>
        FoodBridge
      </NavLink>

      <nav className="sidebar-nav">
        {NAV_BY_ROLE[user.role]?.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
        <NavLink to="/" onClick={onNavigate} className="sidebar-link">
          <HomeIcon size={18} />
          Public site
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.name}</div>
          <div className="sidebar-user-role">
            {user.role} {user.is_verified ? '· verified' : ''}
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout}>
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </aside>
  );
}
