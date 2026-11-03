import React from 'react';
import type { OrderTotals as Totals } from '../../types/order';
import { useMoney } from '../../contexts/CurrencyContext';

interface OrderTotalsProps {
  totals: Totals;
  promoCode?: string | null;
  taxRate?: number;
}

export function OrderTotals({ totals, promoCode, taxRate }: OrderTotalsProps) {
  const { formatMoney, currency, rate } = useMoney();
  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotal)}</dd>
      </div>
      {totals.discount > 0 &&
      <div className="flex justify-between text-success">
          <dt>Discount{promoCode ? ` (${promoCode})` : ''}</dt>
          <dd className="tabular-nums">−{formatMoney(totals.discount)}</dd>
        </div>
      }
      <div className="flex justify-between">
        <dt className="text-muted">Tax{taxRate !== undefined ? ` (${taxRate}%)` : ''}</dt>
        <dd className="tabular-nums">{formatMoney(totals.tax)}</dd>
      </div>
      {totals.charges > 0 &&
      <div className="flex justify-between">
          <dt className="text-muted">{totals.chargesLabel}</dt>
          <dd className="tabular-nums">{formatMoney(totals.charges)}</dd>
        </div>
      }
      <div className="flex items-baseline justify-between border-t border-line pt-3">
        <dt className="font-bold">Total</dt>
        <dd className="font-display text-2xl font-black tabular-nums">{formatMoney(totals.total)}</dd>
      </div>
      {currency === 'LKR' &&
      <p className="pt-1 text-xs text-muted">
          Shown in Sri Lankan rupees at Rs. {rate.toLocaleString('en-US')} = $1. The menu price is ${totals.total.toFixed(2)} USD.
        </p>
      }
    </dl>);

}