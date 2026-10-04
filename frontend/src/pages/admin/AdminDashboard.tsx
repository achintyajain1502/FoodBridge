import { useEffect, useState } from 'react';
import { AlertCircle, BarChart3, Users, ClipboardList, Package, ShieldCheck, Trash2, Download } from 'lucide-react';
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

  function generateCertificate(donation: Donation) {
    if (donation.status !== 'completed') return;

    const escapePdf = (value: string) =>
      value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

    const lines = [
      'FOODBRIDGE',
      'DONATION CERTIFICATE',
      'This certificate recognizes the successful completion of a food donation',
      'through the FoodBridge food donation and redistribution platform.',
      `Donor: ${donation.donor_name || 'N/A'}`,
      `NGO: ${donation.ngo_name || 'N/A'}`,
      `Food: ${donation.food_type}`,
      `Quantity: ${donation.quantity} ${donation.unit}`,
      `City: ${donation.city}`,
      `Completion Date: ${donation.completed_at ? new Date(donation.completed_at).toLocaleDateString() : new Date().toLocaleDateString()}`,
      `Donation ID: FB-${donation.id}`,
      'Thank you for helping reduce food waste and support the community.'
    ];

    const stream = [
      'q',
      '2 w',
      '40 40 532 712 re S',
      '5 w',
      '55 55 502 682 re S',
      'Q',
      'BT',
      '/F1 28 Tf',
      '1 0 0 1 207 675 Tm',
      `(${escapePdf(lines[0])}) Tj`,
      'ET',
      'BT',
      '/F1 20 Tf',
      '1 0 0 1 190 625 Tm',
      `(${escapePdf(lines[1])}) Tj`,
      'ET',
      'BT',
      '/F1 11 Tf',
      '1 0 0 1 125 565 Tm',
      `(${escapePdf(lines[2])}) Tj`,
      '1 0 0 1 118 545 Tm',
      `(${escapePdf(lines[3])}) Tj`,
      'ET',
      'BT',
      '/F1 13 Tf',
      '1 0 0 1 105 475 Tm',
      `(${escapePdf(lines[4])}) Tj`,
      '1 0 0 1 105 440 Tm',
      `(${escapePdf(lines[5])}) Tj`,
      '1 0 0 1 105 405 Tm',
      `(${escapePdf(lines[6])}) Tj`,
      '1 0 0 1 105 370 Tm',
      `(${escapePdf(lines[7])}) Tj`,
      '1 0 0 1 105 335 Tm',
      `(${escapePdf(lines[8])}) Tj`,
      '1 0 0 1 105 300 Tm',
      `(${escapePdf(lines[9])}) Tj`,
      '1 0 0 1 105 265 Tm',
      `(${escapePdf(lines[10])}) Tj`,
      'ET',
      'BT',
      '/F1 10 Tf',
      '1 0 0 1 115 190 Tm',
      `(${escapePdf(lines[11])}) Tj`,
      'ET',
    ].join('\n');

    const objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>',
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];

    let pdf = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
    const offsets: number[] = [0];
    objects.forEach((obj, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`;
    });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) {
      pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FoodBridge_Certificate_FB-${donation.id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
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
                <th>Certificate</th>
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
                  <td>
                    {d.status === 'completed' ? (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => generateCertificate(d)}
                        title="Generate and download donation certificate"
                      >
                        <Download size={14} />
                        Certificate
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}

