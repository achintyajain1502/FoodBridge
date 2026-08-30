import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Users2, MapPinned, ShieldCheck } from 'lucide-react';

const POINTS = [
  { icon: <Users2 size={16} />, text: 'Three roles, one clear workflow — donor, NGO, and admin, nothing more.' },
  { icon: <MapPinned size={16} />, text: 'NGOs see donations filtered by city, so pickup is always realistic.' },
  { icon: <ShieldCheck size={16} />, text: 'Admins verify accounts before they can post or accept donations.' },
];

export function AuthLayout({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-panel">
        <div>
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <span className="brand-mark">
              <Sprout size={16} />
            </span>
            FoodBridge
          </Link>

          <div style={{ marginTop: 64 }}>
            <h2>{heading}</h2>
            <p>A direct bridge between surplus food and the people who need it — tracked from posted to completed.</p>
          </div>

          <div className="auth-panel-points">
            {POINTS.map((p) => (
              <div className="auth-point" key={p.text}>
                <span className="auth-point-icon">{p.icon}</span>
                <span className="auth-point-text">{p.text}</span>
              </div>
            ))}
          </div>
        </div>
        {/* <div className="auth-panel-foot">Version 1 — donor, NGO, and admin roles</div> */}
      </div>

      <div className="auth-form-side">
        <div className="auth-form-inner">
          <Link to="/" className="brand auth-mobile-brand" style={{ textDecoration: 'none' }}>
            <span className="brand-mark">
              <Sprout size={16} />
            </span>
            FoodBridge
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
