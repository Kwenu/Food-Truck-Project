import type { Settings } from '../types/settings';

/**
 * Estimated minutes until a new order is ready, based on how many orders are
 * already in the kitchen and how long the ordered items take.
 * (The server calculates the real figure when the order is placed; this is the
 * live estimate shown to customers while they browse.)
 */
export function estimatePrepMinutes(queueCount: number, settings: Settings, itemPrepMinutes: number[] = []): number {
  const longest = Math.max(settings.basePrepMinutes, ...itemPrepMinutes);
  return Math.min(60, longest + queueCount * 2);
}

export function normalizeOrderNumber(input: string): string {
  const trimmed = input.trim().toUpperCase();
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `EW-${digits}` : trimmed;
}
