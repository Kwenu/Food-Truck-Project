/** Staff roles: admin = everything, manager = back office (no settings/staff), kitchen = kitchen display only. */
export type StaffRole = 'admin' | 'manager' | 'kitchen';

export type BrandPalette = 'flame' | 'lime' | 'ocean' | 'berry';

export interface Settings {
  truckName: string;
  isOpen: boolean;
  /** Custom brand color (hex). null = use the selected preset palette. */
  brandColor: string | null;
  taxRate: number;
  packagingFee: number;
  serviceChargeRate: number;
  scheduledPickup: boolean;
  basePrepMinutes: number;
  chimeEnabled: boolean;
}