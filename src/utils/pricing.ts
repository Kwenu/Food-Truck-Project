import type { Promotion } from '../types/menu';
import type { OrderLine, OrderTotals, OrderType } from '../types/order';
import type { Settings } from '../types/settings';
import { round2 } from './currency';

export function linesSubtotal(lines: OrderLine[]): number {
  return round2(lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0));
}

export function isPromoApplicable(promo: Promotion | null, subtotal: number): boolean {
  return !!promo && promo.active && subtotal > 0 && subtotal >= promo.minSubtotal;
}

export function computeTotals(
lines: OrderLine[],
type: OrderType,
settings: Settings,
promo: Promotion | null)
: OrderTotals {
  const subtotal = linesSubtotal(lines);
  let discount = 0;
  if (promo && isPromoApplicable(promo, subtotal)) {
    discount =
    promo.type === 'percent' ?
    round2(subtotal * promo.value / 100) :
    Math.min(promo.value, subtotal);
  }
  const taxable = Math.max(0, subtotal - discount);
  const tax = round2(taxable * settings.taxRate / 100);
  const charges =
  subtotal === 0 ?
  0 :
  type === 'takeaway' ?
  settings.packagingFee :
  round2(taxable * settings.serviceChargeRate / 100);
  const chargesLabel =
  type === 'takeaway' ? 'Packaging' : `Service charge (${settings.serviceChargeRate}%)`;
  return {
    subtotal,
    discount,
    tax,
    charges,
    chargesLabel,
    total: round2(taxable + tax + charges)
  };
}