import React from 'react';
import { ZapIcon, CalendarClockIcon } from 'lucide-react';
import { formatClock } from '../../utils/time';

interface PickupTimePickerProps {
  mode: 'asap' | 'scheduled';
  onModeChange: (mode: 'asap' | 'scheduled') => void;
  slot: string | null;
  onSlotChange: (slot: string) => void;
  slots: string[];
  prepMinutes: number;
  schedulingEnabled: boolean;
  error?: string;
}

export function PickupTimePicker({ mode, onModeChange, slot, onSlotChange, slots, prepMinutes, schedulingEnabled, error }: PickupTimePickerProps) {
  const option = (value: 'asap' | 'scheduled', title: string, body: string, Icon: typeof ZapIcon) => {
    const selected = mode === value;
    return (
      <label
        className={`flex min-h-[72px] cursor-pointer items-center gap-3 rounded-2xl p-4 ring-1 transition-[box-shadow,background-color] duration-150 ${
        selected ? 'bg-brand/5 ring-2 ring-brand' : 'bg-surface ring-line hover:ring-ink/30'}`
        }>
        
        <input type="radio" name="pickup-mode" value={value} checked={selected} onChange={() => onModeChange(value)} className="sr-only" />
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${selected ? 'gradient-brand text-white' : 'bg-cream text-ink'}`}>
          <Icon size={20} />
        </span>
        <span>
          <span className="block font-semibold">{title}</span>
          <span className="block text-sm text-muted">{body}</span>
        </span>
      </label>);

  };

  return (
    <div>
      <div className={`grid gap-3 ${schedulingEnabled ? 'sm:grid-cols-2' : ''}`} role="radiogroup" aria-label="Pickup time">
        {option('asap', 'As soon as possible', `Ready in about ${prepMinutes} min`, ZapIcon)}
        {schedulingEnabled && option('scheduled', 'Schedule pickup', 'Pick a 15-minute slot', CalendarClockIcon)}
      </div>
      {schedulingEnabled && mode === 'scheduled' &&
      <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">Choose a time</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {slots.map((s) =>
          <button
            key={s}
            type="button"
            onClick={() => onSlotChange(s)}
            aria-pressed={slot === s}
            className={`h-11 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-150 ${
            slot === s ? 'bg-ink text-white' : 'bg-surface ring-1 ring-line hover:ring-ink/30'}`
            }>
            
                {formatClock(s)}
              </button>
          )}
          </div>
          {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        </div>
      }
    </div>);

}