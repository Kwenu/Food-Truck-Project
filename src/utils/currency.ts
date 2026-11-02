const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatMoney(value: number): string {
  return formatter.format(value);
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}