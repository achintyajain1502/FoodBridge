import { FormEvent, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, UtensilsCrossed, MapPin, Clock3, Inbox } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { Donation } from '../../types';
import { StatusBadge, StatusTrail } from '../../components/Status';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

const emptyForm = {
  food_type: '',
  quantity: '',
  unit: 'kg',
  description: '',
  pickup_address: '',
  city: '',
  expiry_time: '',
};

export function DonorDashboard() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function loadDonations() {
    setLoading(true);
    try {
      const data = await api.get<{ donations: Donation[] }>('/donations/mine');
      setDonations(data.donations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your donations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDonations();
  }, []);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/donations', form);
      setForm(emptyForm);
      setSuccess('Donation posted. NGOs in your city can now see and accept it.');
      loadDonations();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not post donation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCertificate(id: number) {
  try {
    const blob = await api.download(`/certificates/donation/${id}`);

    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
  } catch (err) {
    setError(err instanceof ApiError ? err.message : 'Could not get certificate');
  }
}

  return (
    <DashboardLayout title="Post & track" subtitle="Post surplus food and follow it through to completion.">
      <div className="dashboard-two-column">
        <div className="card fade-in dashboard-form-card">
          <div className="section-header">
            <h3 style={{ margin: 0 }}>Post food donation</h3>
          </div>
          {error && (
            <div className="banner banner-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {success && (
            <div className="banner banner-success">
              <CheckCircle2 size={16} />
              {success}
            </div>
          )}
          <form className="form-grid" onSubmit={handleSubmit}>
            <div className="form-row">
              <label htmlFor="food_type">Food type</label>
              <input
                id="food_type"
                required
                placeholder="e.g. Cooked rice & dal"
                value={form.food_type}
                onChange={(e) => update('food_type', e.target.value)}
              />
            </div>
            <div className="form-two-col">
              <div className="form-row">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={form.quantity}
                  onChange={(e) => update('quantity', e.target.value)}
                />
              </div>
              <div className="form-row">
                <label htmlFor="unit">Unit</label>
                <select id="unit" value={form.unit} onChange={(e) => update('unit', e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="plates">plates</option>
                  <option value="packets">packets</option>
                  <option value="liters">liters</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                rows={2}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
              />
            </div>
            <div className="form-row">
              <label htmlFor="pickup_address">Pickup address</label>
              <input
                id="pickup_address"
                required
                value={form.pickup_address}
                onChange={(e) => update('pickup_address', e.target.value)}
              />
            </div>
            <div className="form-two-col">
              <div className="form-row">
                <label htmlFor="city">City</label>
                <input id="city" required value={form.city} onChange={(e) => update('city', e.target.value)} />
              </div>
              <div className="form-row">
                <label htmlFor="expiry_time">Available until</label>
                <input
                  id="expiry_time"
                  type="datetime-local"
                  required
                  value={form.expiry_time}
                  onChange={(e) => update('expiry_time', e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-accent btn-block" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post donation'}
            </button>
          </form>
        </div>

        <div className="fade-in-delay-1">
          <div className="section-header">
            <h3 style={{ margin: 0 }}>Your donations</h3>
          </div>
          {loading ? (
            <p>Loading…</p>
          ) : donations.length === 0 ? (
            <div className="card empty-state">
              <Inbox size={32} />
              <p style={{ margin: 0 }}>You haven't posted any donations yet.</p>
            </div>
          ) : (
            donations.map((d) => (
              <div className="donation-item" key={d.id}>
                <div className="donation-item-head">
                  <div className="donation-item-title">
                    <span className="donation-icon">
                      <UtensilsCrossed size={16} />
                    </span>
                    <div>
                      <strong>{d.food_type}</strong>
                      <div className="donation-meta">
                        <MapPin size={13} />
                        {d.quantity} {d.unit} · {d.city} · posted {new Date(d.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <StatusTrail status={d.status} />
                {d.ngo_name && (
                  <div className="donation-meta">
                    <Clock3 size={13} />
                    Accepted by {d.ngo_name}
                  </div>
                )}
                {d.status === 'available' && (
  <div className="donation-actions">
    <button className="btn btn-danger btn-sm" onClick={() => handleCancel(d.id)}>
      Cancel
    </button>
  </div>
)}

{d.status === 'completed' && (
  <div className="donation-actions">
    <button
  className="btn btn-accent btn-sm"
  onClick={() => handleCertificate(d.id)}
>
  Get Certificate
</button>
  </div>
)}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
