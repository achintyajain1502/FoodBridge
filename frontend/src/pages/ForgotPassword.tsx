import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle } from 'lucide-react';
import { api, ApiError } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    setResetToken('');
    setSubmitting(true);

    try {
      const data = await api.post<{
        message: string;
        resetToken?: string;
      }>('/auth/forgot-password', { email });

      setMessage(data.message);

      if (data.resetToken) {
        setResetToken(data.resetToken);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not process your request'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout heading="Reset your password.">
      <div className="fade-in">
        <span className="eyebrow">Forgot password</span>

        <h1 style={{ fontSize: '1.7rem' }}>
          Reset your password
        </h1>

        <p style={{ color: 'var(--color-text-muted)' }}>
          Enter your email and we'll create a password reset link.
        </p>

        {error && (
          <div className="banner banner-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {message && (
          <div className="banner banner-success">
            {message}
          </div>
        )}

        {resetToken && (
          <div className="banner banner-success">
            <strong>Demo reset token:</strong>
            <br />
            <span style={{ wordBreak: 'break-all' }}>
              {resetToken}
            </span>
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="email">Email</label>

            <div className="input-icon-wrap">
              <Mail size={16} />

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Creating reset link…' : 'Reset password'}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: '0.9rem' }}>
          Remember your password?{' '}
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </AuthLayout>
  );
}