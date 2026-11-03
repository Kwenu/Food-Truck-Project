import React from 'react';
import { ArrowLeftRightIcon } from 'lucide-react';
import { useMoney } from '../../contexts/CurrencyContext';
import type { Currency } from '../../utils/currency';

const options: {value: Currency;label: string;}[] = [
{ value: 'USD', label: 'USD' },
{ value: 'LKR', label: 'LKR' }];


interface CurrencyToggleProps {
  className?: string;
  /** One small button that swaps currency (for tight headers) instead of a two-option switch */
  compact?: boolean;
}

/** Lets the customer see prices in US dollars or Sri Lankan rupees. */
export function CurrencyToggle({ className = '', compact = false }: CurrencyToggleProps) {
  const { currency, setCurrency } = useMoney();
  const other: Currency = currency === 'USD' ? 'LKR' : 'USD';

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setCurrency(other)}
        aria-label={`Showing prices in ${currency}. Switch to ${other}`}
        className={`inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-line bg-surface px-3 text-xs font-bold transition-colors duration-150 hover:border-ink/30 ${className}`}>
        
        {currency}
        <ArrowLeftRightIcon size={13} className="text-muted" aria-hidden="true" />
      </button>);

  }

  return (
    <div role="group" aria-label="Currency" className={`inline-flex h-10 items-center rounded-full border border-line bg-surface p-0.5 text-xs font-bold ${className}`}>
      {options.map((o) =>
      <button
        key={o.value}
        type="button"
        aria-pressed={currency === o.value}
        onClick={() => setCurrency(o.value)}
        className={`h-full rounded-full px-3 transition-colors duration-150 ${currency === o.value ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
        
          {o.label}
        </button>
      )}
    </div>);

}
