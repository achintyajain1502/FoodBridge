import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, AlertCircle } from 'lucide-react';
import { ApiError, api } from '../api/client';
import { AuthLayout } from '../components/layout/AuthLayout';

export function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState(searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      const data = await api.post<{ message: string }>(
        '/auth/reset-password',
        {
          token,
          newPassword,
        }
      );

      setSuccess(data.message);

      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Could not reset password'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout heading="Set a new password.">
      <div className="fade-in">
        <span className="eyebrow">RESET PASSWORD</span>

        <h1 style={{ fontSize: '1.7rem' }}>
          Create a new password
        </h1>

        <p style={{ color: 'var(--color-text-muted)' }}>
          Enter your reset token and choose a new password.
        </p>

        {error && (
          <div className="banner banner-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div className="banner banner-success">
            {success}
          </div>
        )}

        <form className="form-grid" onSubmit={handleSubmit}>

          {!token && (
  <div className="banner banner-error">
    <AlertCircle size={16} />
    Invalid or missing reset link.
  </div>
)}

          <div className="form-row">
            <label htmlFor="newPassword">New password</label>

            <div className="input-icon-wrap">
              <Lock size={16} />

              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="confirmPassword">
              Confirm password
            </label>

            <div className="input-icon-wrap">
              <Lock size={16} />

              <input
                id="confirmPassword"
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter password again"
              />
            </div>
          </div>

          <button
            className="btn btn-primary btn-block"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <p style={{ color: 'var(--color-text-muted)' }}>
  Choose a new password for your account.
</p>
      </div>
    </AuthLayout>
  );
}