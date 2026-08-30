import { Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  HeartHandshake,
  PackageCheck,
  Users2,
  MapPinned,
  ShieldCheck,
  Clock3,
  Store,
  Building2,
  UserCog,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PublicNavbar } from '../components/layout/PublicNavbar';

export function Home() {
  const { user } = useAuth();
  const dashboardPath = user?.role === 'donor' ? '/donor' : user?.role === 'ngo' ? '/ngo' : '/admin';

  return (
    <>
      <PublicNavbar />

      <div className="page">
        {/* ---------- Hero ---------- */}
        <div className="hero fade-in">
          <span className="hero-eyebrow">Surplus food, redirected</span>
          <h1>A direct bridge between surplus food and the people who need it.</h1>
          <p className="lead">
            Restaurants, hostels, and individuals post surplus food. Verified NGOs claim it and confirm
            pickup. Every donation is tracked from posted to completed — nothing gets lost in between.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link to={dashboardPath} className="btn btn-accent">
                Go to your dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-accent">
                  Get started
                </Link>
                <Link to="/login" className="btn btn-outline-invert">
                  Log in
                </Link>
              </>
            )}
          </div>

          <div className="hero-trail">
            <div className="hero-trail-step">
              <span className="hero-trail-icon">
                <UtensilsCrossed size={20} />
              </span>
              <span className="hero-trail-label">Donor posts food</span>
            </div>
            <span className="hero-trail-line" />
            <div className="hero-trail-step">
              <span className="hero-trail-icon">
                <HeartHandshake size={20} />
              </span>
              <span className="hero-trail-label">NGO accepts &amp; picks up</span>
            </div>
            <span className="hero-trail-line" />
            <div className="hero-trail-step">
              <span className="hero-trail-icon">
                <PackageCheck size={20} />
              </span>
              <span className="hero-trail-label">Donation completed</span>
            </div>
          </div>
        </div>

        {/* ---------- Why this exists ---------- */}
        <section style={{ maxWidth: 680, margin: '0 0 48px' }} className="fade-in-delay-1">
          <span className="eyebrow">Why FoodBridge</span>
          <h2 style={{ fontSize: '1.6rem' }}>Surplus food is a logistics problem, not a supply problem.</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Most food that goes to waste at restaurants, hostels, and events doesn't go to waste because
            no one wants it — it goes to waste because no one nearby knew it existed in time. FoodBridge
            keeps that window open: a donor posts what they have and how long it'll last, and any verified
            NGO in the same city can see it, claim it, and confirm when it's picked up.
          </p>
        </section>

        {/* ---------- How it works, step by step ---------- */}
        <section style={{ marginBottom: 48 }} className="fade-in-delay-1">
          <div className="section-header">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Three steps, start to finish</h2>
            </div>
          </div>
          <div className="feature-grid">
            <div className="card feature-card">
              <span className="feature-icon">
                <UtensilsCrossed size={20} />
              </span>
              <h4>1. Post the donation</h4>
              <p>
                A donor logs in and lists what's available — food type, quantity, pickup address, city,
                and how long it'll stay good for.
              </p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <HeartHandshake size={20} />
              </span>
              <h4>2. An NGO accepts it</h4>
              <p>
                Verified NGOs in that city see it appear in their available list and accept it — locking
                it in so no one else claims the same donation.
              </p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <PackageCheck size={20} />
              </span>
              <h4>3. Pickup is confirmed</h4>
              <p>
                Once the NGO has collected the food, they mark it completed. The full status history stays
                attached to that donation.
              </p>
            </div>
          </div>
        </section>

        {/* ---------- Roles ---------- */}
        <section style={{ marginBottom: 48 }} className="fade-in-delay-1">
          <div className="section-header">
            <div>
              <span className="eyebrow">Built for three roles</span>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Nothing more than the workflow needs</h2>
            </div>
          </div>
          <div className="feature-grid">
            <div className="card feature-card">
              <span className="feature-icon">
                <Store size={20} />
              </span>
              <h4>Donor</h4>
              <p>Restaurants, hostels, event organizers, or individuals with surplus food to give away.</p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <Building2 size={20} />
              </span>
              <h4>NGO</h4>
              <p>Organizations that collect and redistribute food to the people who need it.</p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <UserCog size={20} />
              </span>
              <h4>Admin</h4>
              <p>Verifies donor and NGO accounts and monitors every donation moving through the system.</p>
            </div>
          </div>
        </section>

        {/* ---------- Trust / design principles ---------- */}
        <section style={{ marginBottom: 56 }} className="fade-in-delay-2">
          <div className="feature-grid">
            <div className="card feature-card">
              <span className="feature-icon">
                <Users2 size={20} />
              </span>
              <h4>Three clear actors</h4>
              <p>No transporter or volunteer role has been added until the core donor–NGO loop is proven.</p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <MapPinned size={20} />
              </span>
              <h4>City-based matching</h4>
              <p>NGOs browse donations filtered by city, so what they see is realistic to actually pick up.</p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <ShieldCheck size={20} />
              </span>
              <h4>Admin verification</h4>
              <p>Donor and NGO accounts are verified by an admin before donations move through the system.</p>
            </div>
            <div className="card feature-card">
              <span className="feature-icon">
                <Clock3 size={20} />
              </span>
              <h4>Full status history</h4>
              <p>Every donation is logged from available to completed, so nothing disappears without a trace.</p>
            </div>
          </div>
        </section>

        {/* ---------- Closing CTA ---------- */}
        {!user && (
          <div className="hero fade-in-delay-2" style={{ padding: '44px 48px', margin: 0 }}>
            <h2 style={{ color: '#fff', fontSize: '1.6rem', maxWidth: 480 }}>
              Ready to post your first donation or start accepting them?
            </h2>
            <div className="hero-actions" style={{ marginTop: 20 }}>
              <Link to="/register" className="btn btn-accent">
                Create an account
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-outline-invert">
                Log in
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
