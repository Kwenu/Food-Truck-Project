import React from 'react';

interface VegMarkProps {
  veg: boolean;
  size?: 'sm' | 'md';
  withLabel?: boolean;
}

export function VegMark({ veg, size = 'sm', withLabel = false }: VegMarkProps) {
  const box = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const dot = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';
  const color = veg ? 'border-veg text-veg' : 'border-nonveg text-nonveg';
  const label = veg ? 'Vegetarian' : 'Non-vegetarian';
  return (
    <span className="inline-flex items-center gap-1.5" title={label}>
      <span className={`grid shrink-0 place-items-center rounded-[3px] border-[1.5px] bg-surface ${box} ${color}`} role="img" aria-label={label}>
        <span className={`rounded-full bg-current ${dot}`} />
      </span>
      {withLabel && <span className={`text-xs font-semibold ${veg ? 'text-veg' : 'text-nonveg'}`}>{veg ? 'Veg' : 'Non-veg'}</span>}
    </span>);

}