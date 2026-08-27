import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await login(email, password);
      const path = user.role === 'donor' ? '/donor' : user.role === 'ngo' ? '/ngo' : '/admin';
      navigate(path);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not log in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout heading="Welcome back.">
      <div className="fade-in">
        <span className="eyebrow">Log in</span>
        <h1 style={{ fontSize: '1.7rem' }}>Sign in to your account</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Post, accept, or manage donations.</p>

        {error && (
          <div className="banner banner-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrap">
              <Mail size={16} />
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <label htmlFor="password">Password</label>
            <div className="input-icon-wrap">
              <Lock size={16} />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
