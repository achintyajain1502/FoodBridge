import { useEffect, useState } from 'react';
import { AlertCircle, Search, PackageCheck, MapPin, Phone, Clock3, Inbox, Download } from 'lucide-react';
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
    } finally { setLoading(false); }
  }

  async function loadMine() {
    setLoading(true);
    try {
      const data = await api.get<{ donations: Donation[] }>('/donations/mine');
      setMine(data.donations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load your donations');
    } finally { setLoading(false); }
  }

  useEffect(() => {
    if (tab === 'available') loadAvailable();
    else loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleAccept(id: number) {
    setError('');
    try { await api.patch(`/donations/${id}/accept`); loadAvailable(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not accept donation'); }
  }

  async function handleComplete(id: number) {
    setError('');
    try { await api.patch(`/donations/${id}/complete`); loadMine(); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Could not mark as completed'); }
  }

  function escapePdf(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function downloadCertificate(donation: Donation) {
    if (donation.status !== 'completed' || !donation.certificate_allowed) return;

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
      'q', '2 w', '40 40 532 712 re S', '5 w', '55 55 502 682 re S', 'Q',
      'BT', '/F1 28 Tf', '1 0 0 1 207 675 Tm', `(${escapePdf(lines[0])}) Tj`, 'ET',
      'BT', '/F1 20 Tf', '1 0 0 1 190 625 Tm', `(${escapePdf(lines[1])}) Tj`, 'ET',
      'BT', '/F1 11 Tf', '1 0 0 1 125 565 Tm', `(${escapePdf(lines[2])}) Tj`,
      '1 0 0 1 118 545 Tm', `(${escapePdf(lines[3])}) Tj`, 'ET',
      'BT', '/F1 13 Tf', '1 0 0 1 105 475 Tm', `(${escapePdf(lines[4])}) Tj`,
      '1 0 0 1 105 440 Tm', `(${escapePdf(lines[5])}) Tj`,
      '1 0 0 1 105 405 Tm', `(${escapePdf(lines[6])}) Tj`,
      '1 0 0 1 105 370 Tm', `(${escapePdf(lines[7])}) Tj`,
      '1 0 0 1 105 335 Tm', `(${escapePdf(lines[8])}) Tj`,
      '1 0 0 1 105 300 Tm', `(${escapePdf(lines[9])}) Tj`,
      '1 0 0 1 105 265 Tm', `(${escapePdf(lines[10])}) Tj`, 'ET',
      'BT', '/F1 10 Tf', '1 0 0 1 115 190 Tm', `(${escapePdf(lines[11])}) Tj`, 'ET'
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
    objects.forEach((obj, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${obj}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i < offsets.length; i++) pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

    const blob = new Blob([pdf], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FoodBridge_Certificate_FB-${donation.id}.pdf`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout title="Available donations" subtitle="Find nearby donations and track what you've accepted.">
      <div className="tabs">
        <button className={`tab ${tab === 'available' ? 'active' : ''}`} onClick={() => setTab('available')}><Search size={15} />Available donations</button>
        <button className={`tab ${tab === 'mine' ? 'active' : ''}`} onClick={() => setTab('mine')}><PackageCheck size={15} />Accepted by us</button>
      </div>
      {error && <div className="banner banner-error"><AlertCircle size={16} />{error}</div>}

      {tab === 'available' && <>
        <div className="card donation-filter">
          <div className="form-row donation-filter-field"><label htmlFor="cityFilter">Filter by city</label><input id="cityFilter" placeholder="e.g. Delhi" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} /></div>
          <button className="btn btn-outline" onClick={loadAvailable}>Apply</button>
        </div>
        {loading ? <p>Loading…</p> : available.length === 0 ? <div className="card empty-state"><Inbox size={32} /><p style={{ margin: 0 }}>No available donations right now — check back soon.</p></div> : available.map((d) => (
          <div className="donation-item fade-in" key={d.id}>
            <div className="donation-item-head"><div><strong>{d.food_type}</strong><div className="donation-meta"><MapPin size={13} />{d.quantity} {d.unit} · {d.pickup_address}, {d.city}</div><div className="donation-meta"><Phone size={13} />{d.donor_name} {d.donor_phone ? `· ${d.donor_phone}` : ''}</div><div className="donation-meta"><Clock3 size={13} />Available until {new Date(d.expiry_time).toLocaleString()}</div></div><StatusBadge status={d.status} /></div>
            <div className="donation-actions"><button className="btn btn-accent btn-sm" onClick={() => handleAccept(d.id)}>Accept donation</button></div>
          </div>
        ))}
      </>}

      {tab === 'mine' && <>
        {loading ? <p>Loading…</p> : mine.length === 0 ? <div className="card empty-state"><Inbox size={32} /><p style={{ margin: 0 }}>You haven't accepted any donations yet.</p></div> : mine.map((d) => (
          <div className="donation-item fade-in" key={d.id}>
            <div className="donation-item-head"><div><strong>{d.food_type}</strong><div className="donation-meta"><MapPin size={13} />{d.quantity} {d.unit} · {d.pickup_address}, {d.city}</div><div className="donation-meta">Donor: {d.donor_name}</div></div><StatusBadge status={d.status} /></div>
            <StatusTrail status={d.status} />
            {d.status === 'accepted' && <div className="donation-actions"><button className="btn btn-primary btn-sm" onClick={() => handleComplete(d.id)}>Mark as completed</button></div>}
            {d.status === 'completed' && (
              <div className="donation-actions">
                {d.certificate_allowed ? (
                  <button className="btn btn-outline btn-sm" onClick={() => downloadCertificate(d)}><Download size={14} />Download Certificate</button>
                ) : (
                  <span className="donation-meta">Certificate will be available after admin approval.</span>
                )}
              </div>
            )}
          </div>
        ))}
      </>}
    </DashboardLayout>
  );
}
