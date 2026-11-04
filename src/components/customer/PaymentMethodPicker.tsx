import React from 'react';
import { BanknoteIcon, CreditCardIcon, StoreIcon } from 'lucide-react';
import type { PaymentMethod } from '../../types/order';

interface PaymentMethodPickerProps {
  method: PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
}

/** Customers don't pay online: they choose how they'll pay at the cashier. */
export function PaymentMethodPicker({ method, onMethodChange }: PaymentMethodPickerProps) {
  const options: {value: PaymentMethod;title: string;body: string;Icon: typeof CreditCardIcon;}[] = [
  { value: 'cash', title: 'Cash', body: 'Pay in cash at the cashier', Icon: BanknoteIcon },
  { value: 'card', title: 'Card', body: 'Pay by card machine at the cashier', Icon: CreditCardIcon }];


  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="How will you pay at the cashier?">
        {options.map(({ value, title, body, Icon }) => {
          const selected = method === value;
          return (
            <label
              key={value}
              className={`flex min-h-[72px] cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-[box-shadow,background-color] duration-150 ${
              selected ? 'bg-brand/5 ring-2 ring-brand' : 'bg-surface ring-line hover:ring-ink/30'}`
              }>
              
              <input type="radio" name="payment" value={value} checked={selected} onChange={() => onMethodChange(value)} className="sr-only" />
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'gradient-brand text-white' : 'bg-cream'}`}>
                <Icon size={20} />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="block text-xs text-muted">{body}</span>
              </span>
            </label>);

        })}
      </div>

      <p className="mt-4 flex gap-3 rounded-2xl bg-cream/60 p-4 text-sm text-muted ring-1 ring-line">
        <StoreIcon size={18} className="mt-0.5 shrink-0" />
        <span>
          Place your order, then go to the <strong className="text-ink">cashier</strong> with your order number to pay. The kitchen starts cooking once the cashier approves your order.
        </span>
      </p>
    </div>);

}
