export type TableStatus = 'available' | 'occupied';

export interface DiningTable {
  id: string;
  number: number;
  seats: number;
  /** Code encoded in the table QR, used in /t/:tableCode */
  code: string;
  status: TableStatus;
}