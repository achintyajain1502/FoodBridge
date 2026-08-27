import { useEffect, useState } from 'react';
import { AlertCircle, Search, PackageCheck, MapPin, Phone, Clock3, Inbox } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { Donation } from '../../types';
import { StatusBadge, StatusTrail } from '../../components/Status';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export function NGODashboard() {
  const [tab, setTab] = useState<'available' | 'mine'>('available');
  const [available, setAvailable] = useState<Donation[]>([]);
  const [mine, setMine] = useState<Donation[]>([]);
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadAvailable() {
    setLoading(true);
    try {
      const query = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : '';
      const data = await api.get<{ donations: Donation[] }>(`/donations/available${query}`);
      setAvailable(data.donations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load available donations');
    } finally {
      setLoading(false);
    }
  }

  async function loadMine() {
    setLoading(true);
    try {
      const data = await api.get<{ donations: Donation[] }>('/donations/mine');
      setMine(data.donations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your donations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'available') loadAvailable();
    else loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleAccept(id: number) {
    setError('');
    try {
      await api.patch(`/donations/${id}/accept`);
      loadAvailable();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept donation');
    }
  }

  async function handleComplete(id: number) {
    setError('');
    try {
      await api.patch(`/donations/${id}/complete`);
      loadMine();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not mark as completed');
    }
  }

  return (
    <DashboardLayout title="Available donations" subtitle="Find nearby donations and track what you've accepted.">
      <div className="tabs">
        <button className={`tab ${tab === 'available' ? 'active' : ''}`} onClick={() => setTab('available')}>
          <Search size={15} />
          Available donations
        </button>
        <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}>
          <PackageCheck size={15} />
          Accepted by us
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {tab === 'available' && (
        <>
          <div className="card donation-filter">
            <div className="form-row donation-filter-field">
              <label htmlFor="cityFilter">Filter by city</label>
              <input
                id="cityFilter"
                placeholder="e.g. Delhi"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
              />
            </div>
            <button className="btn btn-outline" onClick={loadAvailable}>
              Apply
            </button>
          </div>

          {loading ? (
            <p>Loading…</p>
          ) : available.length === 0 ? (
            <div className="card empty-state">
              <Inbox size={32} />
              <p style={{ margin: 0 }}>No available donations right now — check back soon.</p>
            </div>
          ) : (
            available.map((d) => (
              <div className="donation-item fade-in" key={d.id}>
                <div className="donation-item-head">
                  <div>
                    <strong>{d.food_type}</strong>
                    <div className="donation-meta">
                      <MapPin size={13} />
                      {d.quantity} {d.unit} · {d.pickup_address}, {d.city}
                    </div>
                    <div className="donation-meta">
                      <Phone size={13} />
                      {d.donor_name} {d.donor_phone ? `· ${d.donor_phone}` : ''}
                    </div>
                    <div className="donation-meta">
                      <Clock3 size={13} />
                      Available until {new Date(d.expiry_time).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <div className="donation-actions">
                  <button className="btn btn-accent btn-sm" onClick={() => handleAccept(d.id)}>
                    Accept donation
                  </button>
                </div>
              </div>
            ))
          )}
        </>
      )}

      {tab === 'mine' && (
        <>
          {loading ? (
            <p>Loading…</p>
          ) : mine.length === 0 ? (
            <div className="card empty-state">
              <Inbox size={32} />
              <p style={{ margin: 0 }}>You haven't accepted any donations yet.</p>
            </div>
          ) : (
            mine.map((d) => (
              <div className="donation-item fade-in" key={d.id}>
                <div className="donation-item-head">
                  <div>
                    <strong>{d.food_type}</strong>
                    <div className="donation-meta">
                      <MapPin size={13} />
                      {d.quantity} {d.unit} · {d.pickup_address}, {d.city}
                    </div>
                    <div className="donation-meta">Donor: {d.donor_name}</div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <StatusTrail status={d.status} />
                {d.status === 'accepted' && (
                  <div className="donation-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => handleComplete(d.id)}>
                      Mark as completed
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
    </DashboardLayout>
  );
}
