import type { StaffRole } from './settings';

export type { StaffRole };

/** A staff login (row in staff_profiles, linked to a Supabase Auth user). */
export interface StaffAccount {
  /** Supabase Auth user id */
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  active: boolean;
}

/** The signed-in staff member. */
export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}
