export type Currency = 'USD' | 'LKR';

/** Prices are stored in US dollars. LKR is a display conversion at the rate set in Admin → Settings. */
export const DEFAULT_LKR_PER_USD = 300;

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const lkr = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** US dollars (the stored / back-office currency). */
export function formatMoney(value: number): string {
  return usd.format(value);
}

/** Formats a USD amount in the chosen currency. */
export function formatIn(value: number, currency: Currency, lkrPerUsd: number): string {
  if (currency === 'LKR') return `Rs. ${lkr.format(value * (lkrPerUsd > 0 ? lkrPerUsd : DEFAULT_LKR_PER_USD))}`;
  return usd.format(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
