import React from 'react';
import { MinusIcon, PlusIcon, Trash2Icon } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'lg';
  label: string;
  /** Show a trash icon instead of minus when at 1 */
  removable?: boolean;
}

export function QuantityStepper({ value, onChange, min = 0, max = 50, size = 'sm', label, removable = false }: QuantityStepperProps) {
  const btn = size === 'lg' ? 'h-12 w-12' : 'h-9 w-9';
  const showTrash = removable && value <= 1;
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface" role="group" aria-label={`Quantity for ${label}`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={showTrash ? `Remove ${label}` : `Decrease ${label}`}
        className={`${btn} grid place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-cream disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
        
        {showTrash ? <Trash2Icon size={16} /> : <MinusIcon size={16} />}
      </button>
      <span className={`min-w-[2ch] text-center font-display font-bold tabular-nums ${size === 'lg' ? 'text-xl' : 'text-base'}`} aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={`Increase ${label}`}
        className={`${btn} grid place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-cream disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
        
        <PlusIcon size={16} />
      </button>
    </div>);

}