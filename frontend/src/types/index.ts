export type Role = 'donor' | 'ngo' | 'admin';

export type DonationStatus = 'available' | 'accepted' | 'completed' | 'cancelled' | 'expired';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  phone?: string;
  address?: string;
  city?: string;
  is_verified: boolean;
  created_at: string;
}

export interface Donation {
  id: number;
  donor_id: number;
  ngo_id: number | null;
  food_type: string;
  quantity: string;
  unit: string;
  description?: string;
  pickup_address: string;
  city: string;
  expiry_time: string;
  status: DonationStatus;
  created_at: string;
  accepted_at?: string | null;
  completed_at?: string | null;
  certificate_allowed: boolean;
  donor_name?: string;
  donor_phone?: string;
  ngo_name?: string;
}

export interface StatusLogEntry {
  id: number;
  donation_id: number;
  status: DonationStatus;
  changed_by: number | null;
  changed_by_name?: string;
  note?: string;
  changed_at: string;
}
