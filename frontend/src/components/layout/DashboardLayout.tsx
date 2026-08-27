import { ReactNode, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../context/AuthContext';

export function DashboardLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={mobileOpen} onNavigate={() => setMobileOpen(false)} />
      {mobileOpen && <div className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}

      <div className="app-main">
        <div className="app-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              className="sidebar-toggle"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 style={{ fontSize: '1.4rem', marginBottom: 2 }}>{title}</h1>
              {subtitle && (
                <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{subtitle}</p>
              )}
            </div>
          </div>
          {user && (
            <span className={`pill ${user.is_verified ? 'pill-verified' : ''}`}>
              {user.is_verified ? 'Verified' : 'Pending verification'}
            </span>
          )}
        </div>
        <div className="app-content fade-in">{children}</div>
      </div>
    </div>
  );
}
