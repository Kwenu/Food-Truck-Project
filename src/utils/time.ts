import { addMinutes, format } from 'date-fns';

export function formatClock(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), 'MMM d, h:mm a');
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function minutesUntil(iso: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - now) / 60000));
}

/** Next pickup slots on 15-minute boundaries, starting after the lead time. */
export function pickupSlots(now: Date, leadMinutes: number, count = 8): string[] {
  const step = 15 * 60000;
  const start = addMinutes(now, leadMinutes).getTime();
  const first = new Date(Math.ceil(start / step) * step);
  return Array.from({ length: count }, (_, i) => addMinutes(first, i * 15).toISOString());
}