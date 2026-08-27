import { NavLink, useNavigate } from 'react-router-dom';
import { Sprout } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function PublicNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const dashboardPath =
    user?.role === 'donor' ? '/donor' : user?.role === 'ngo' ? '/ngo' : user?.role === 'admin' ? '/admin' : '/';

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand" style={{ textDecoration: 'none' }}>
          <span className="brand-mark">
            <Sprout size={16} />
          </span>
          FoodBridge
        </NavLink>
        <div className="nav-links">
          {user ? (
            <>
              <NavLink to={dashboardPath}>Dashboard</NavLink>
              <span className="pill">{user.role}</span>
              <button className="link-btn" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register" className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
