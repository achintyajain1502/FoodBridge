import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Role } from '../types';
import { AuthLayout } from '../components/layout/AuthLayout';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'donor' as Role,
    phone: '',
    address: '',
    city: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await register(form);
      const path = user.role === 'donor' ? '/donor' : user.role === 'ngo' ? '/ngo' : '/admin';
      navigate(path);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not register');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout heading="Join the bridge.">
      <div className="fade-in">
        <span className="eyebrow">Create account</span>
        <h1 style={{ fontSize: '1.7rem' }}>Register</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>As a donor or an NGO.</p>

        {error && (
          <div className="banner banner-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="role">I am registering as</label>
            <select id="role" value={form.role} onChange={(e) => update('role', e.target.value as Role)}>
              <option value="donor">Donor — restaurant, hostel, or individual</option>
              <option value="ngo">NGO — receives and redistributes food</option>
            </select>
          </div>
          <div className="form-row">
            <label htmlFor="name">Full name / Organization name</label>
            <input id="name" required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </div>
          <div className="form-two-col">
            <div className="form-row">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
              />
            </div>
          </div>
          <div className="form-two-col">
            <div className="form-row">
              <label htmlFor="phone">Phone</label>
              <input id="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </div>
            <div className="form-row">
              <label htmlFor="city">City</label>
              <input id="city" required value={form.city} onChange={(e) => update('city', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="address">Address</label>
            <input id="address" value={form.address} onChange={(e) => update('address', e.target.value)} />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
