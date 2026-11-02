import React from 'react';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  showLabel?: boolean;
  tone?: 'brand' | 'danger';
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, showLabel = false, tone = 'brand', disabled = false }: SwitchProps) {
  const on = tone === 'danger' ? 'bg-danger' : 'bg-brand';
  return (
    <label className={`inline-flex items-center gap-2.5 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={showLabel ? undefined : label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        checked ? on : 'bg-ink/20'}`
        }>
        
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-snappy ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`
          } />
        
      </button>
      {showLabel && <span className="text-sm font-medium">{label}</span>}
    </label>);

}