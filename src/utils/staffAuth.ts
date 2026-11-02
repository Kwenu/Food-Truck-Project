import type { StaffRole } from '../types/staff';

export const MIN_PASSCODE_LENGTH = 8;

export const roleLabels: Record<StaffRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  kitchen: 'Kitchen'
};

/** Where each role lands after signing in. */
export function roleHome(role: StaffRole): string {
  return role === 'kitchen' ? '/kitchen' : '/admin';
}

export function validateEmail(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? null : 'Enter a valid email address.';
}

export function validatePasscode(passcode: string): string | null {
  if (passcode.length < MIN_PASSCODE_LENGTH) return `Passcode must be at least ${MIN_PASSCODE_LENGTH} characters.`;
  return null;
}
