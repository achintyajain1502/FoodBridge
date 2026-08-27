import { ReactNode } from 'react';
import { Clock3, PackageCheck, CheckCircle2, XCircle } from 'lucide-react';
import { DonationStatus } from '../types';

const STATUS_ICON: Record<DonationStatus, ReactNode> = {
  available: <Clock3 size={12} />,
  accepted: <PackageCheck size={12} />,
  completed: <CheckCircle2 size={12} />,
  cancelled: <XCircle size={12} />,
  expired: <XCircle size={12} />,
};

export function StatusBadge({ status }: { status: DonationStatus }) {
  return (
    <span className={`status-badge status-${status}`}>
      {STATUS_ICON[status]}
      {status}
    </span>
  );
}

const HAPPY_PATH: DonationStatus[] = ['available', 'accepted', 'completed'];

// Small visual "trail" showing progress along the real donation workflow.
// Only rendered for statuses that are part of the happy path; cancelled/expired
// donations show a badge instead since they exited the sequence.
export function StatusTrail({ status }: { status: DonationStatus }) {
  if (!HAPPY_PATH.includes(status)) return null;
  const currentIndex = HAPPY_PATH.indexOf(status);

  return (
    <div className="status-trail" aria-hidden="true">
      {HAPPY_PATH.map((step, i) => (
        <span key={step} style={{ display: 'contents' }}>
          <span className={`node ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`} />
          {i < HAPPY_PATH.length - 1 && <span className={`bar ${i < currentIndex ? 'done' : ''}`} />}
        </span>
      ))}
    </div>
  );
}
