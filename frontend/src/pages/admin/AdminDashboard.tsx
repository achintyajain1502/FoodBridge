import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Users, ClipboardList, Package, ShieldCheck, Trash2 } from 'lucide-react';
import { api, ApiError } from '../../api/client';
import { Donation, User } from '../../types';
import { StatusBadge } from '../../components/Status';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

interface Stats {
  usersByRole: { role: string; count: string }[];
  totalDonations: number;
  donationsByStatus: { status: string; count: string }[];
}

export function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'donations'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<Stats>('/admin/stats').then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'users') {
      api
        .get<{ users: User[] }>('/admin/users')
        .then((d) => setUsers(d.users))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load users'));
    }
    if (tab === 'donations') {
      api
        .get<{ donations: Donation[] }>('/admin/donations')
        .then((d) => setDonations(d.donations))
        .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load donations'));
    }
  }, [tab]);

  async function handleVerify(id: number) {
    try {
      await api.patch(`/admin/users/${id}/verify`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_verified: true } : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify user');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remove this user? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove user');
    }
  }

  return (
    <DashboardLayout title="Admin overview" subtitle="Verify accounts and monitor every donation on the platform.">
      <div className="tabs">
        <button className={`tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>
          <BarChart3 size={15} />
          Overview
        </button>
        <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={15} />
          Users
        </button>
        <button className={`tab ${tab === 'donations' ? 'active' : ''}`} onClick={() => setTab('donations')}>
          <ClipboardList size={15} />
          All donations
        </button>
      </div>

      {error && (
        <div className="banner banner-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {tab === 'overview' && stats && (
        <div className="stat-grid fade-in">
          <div className="stat-card">
            <span className="stat-icon">
              <Package size={19} />
            </span>
            <div>
              <div className="stat-value">{stats.totalDonations}</div>
              <div className="stat-label">Total donations</div>
            </div>
          </div>
          {stats.usersByRole.map((r) => (
            <div className="stat-card" key={r.role}>
              <span className="stat-icon">
                <Users size={19} />
              </span>
              <div>
                <div className="stat-value">{r.count}</div>
                <div className="stat-label">{r.role}s registered</div>
              </div>
            </div>
          ))}
          {stats.donationsByStatus.map((s) => (
            <div className="stat-card" key={s.status}>
              <span className="stat-icon">
                <ClipboardList size={19} />
              </span>
              <div>
                <div className="stat-value">{s.count}</div>
                <div className="stat-label">{s.status}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'users' && (
        <div className="card fade-in">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>City</th>
                <th>Verified</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.city || '—'}</td>
                  <td>{u.is_verified ? '✅' : '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {!u.is_verified && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleVerify(u.id)}>
                        <ShieldCheck size={14} />
                        Verify
                      </button>
                    )}
                    {u.role !== 'admin' && (
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u.id)}>
                        <Trash2 size={14} />
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'donations' && (
        <div className="card fade-in">
          <table>
            <thead>
              <tr>
                <th>Food</th>
                <th>Donor</th>
                <th>NGO</th>
                <th>City</th>
                <th>Status</th>
                <th>Posted</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{d.food_type}</td>
                  <td>{d.donor_name}</td>
                  <td>{d.ngo_name || '—'}</td>
                  <td>{d.city}</td>
                  <td>
                    <StatusBadge status={d.status} />
                  </td>
                  <td>{new Date(d.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
