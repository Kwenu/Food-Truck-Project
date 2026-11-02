import React, { useEffect, useState } from 'react';
import { CheckIcon, RotateCcwIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { BrandPalette } from '../../types/settings';
import { useStore } from '../../contexts/StoreContext';
import { isValidHex, paletteColors } from '../../utils/theme';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { Switch } from '../../components/shared/Switch';

interface NumberFieldProps {
  id: string;
  label: string;
  hint?: string;
  value: number;
  suffix: string;
  min: number;
  max: number;
  onCommit: (v: number) => void;
}

function NumberField({ id, label, hint, value, suffix, min, max, onCommit }: NumberFieldProps) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    const n = parseFloat(text);
    if (!Number.isFinite(n) || n < min || n > max) {
      setText(String(value));
      toast.error(`${label} must be between ${min} and ${max}`);
      return;
    }
    if (n !== value) {
      onCommit(n);
      toast.success(`${label} updated`);
    }
  };
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-4">
      <div>
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        {hint && <p className="text-sm text-muted">{hint}</p>}
      </div>
      <div className="relative w-32">
        <input
          id={id}
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="h-11 w-full rounded-xl border border-line bg-surface pl-3.5 pr-12 text-right font-semibold tabular-nums outline-none focus:border-brand" />
        
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>
      </div>
    </div>);

}

function ToggleRow({ label, hint, checked, onChange }: {label: string;hint: string;checked: boolean;onChange: (v: boolean) => void;}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-sm text-muted">{hint}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>);

}

export function Settings() {
  const { settings, updateSettings, loadSampleData } = useStore();
  const [name, setName] = useState(settings.truckName);
  const [hex, setHex] = useState(settings.brandColor ?? '');
  const [confirmReset, setConfirmReset] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);

  useEffect(() => setName(settings.truckName), [settings.truckName]);

  const setBrand = (color: string | null) => {
    updateSettings({ brandColor: color });
    setHex(color ?? '');
  };

  const section = 'rounded-3xl bg-surface px-6 py-2 ring-1 ring-line';
  const heading = 'mb-3 font-display text-xl font-extrabold uppercase tracking-tight';

  return (
    <div className="max-w-3xl space-y-8 p-4 md:p-8">
      <AdminPageHeader title="Settings" description="Changes apply to the customer app and kitchen immediately." />

      <section>
        <h2 className={heading}>Brand</h2>
        <div className={`${section} divide-y divide-line`}>
          <div className="flex flex-wrap items-center justify-between gap-3 py-4">
            <label htmlFor="truck-name" className="font-semibold">
              Truck name
            </label>
            <input
              id="truck-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                const n = name.trim();
                if (n && n !== settings.truckName) {
                  updateSettings({ truckName: n });
                  toast.success('Name updated');
                } else setName(settings.truckName);
              }}
              className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 font-semibold outline-none focus:border-brand sm:w-64" />
            
          </div>
          <div className="py-4">
            <p className="font-semibold">Brand color</p>
            <p className="text-sm text-muted">Match your logo. Repaints buttons, highlights and charts everywhere.</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {(Object.keys(paletteColors) as BrandPalette[]).map((p) => {
                const c = paletteColors[p];
                const selected = settings.brandColor?.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setBrand(c.hex)}
                    aria-label={`Use ${c.label}`}
                    aria-pressed={selected}
                    className="flex flex-col items-center gap-1.5">
                    
                    <span
                      className={`grid h-11 w-11 place-items-center rounded-full text-white ring-offset-2 transition-shadow duration-150 ${selected ? 'ring-2 ring-ink' : ''}`}
                      style={{ backgroundColor: c.hex }}>
                      
                      {selected && <CheckIcon size={18} strokeWidth={3} />}
                    </span>
                    <span className="text-xs font-medium text-muted">{c.label}</span>
                  </button>);

              })}
              <div className="ml-2 flex items-center gap-2">
                <input
                  type="color"
                  value={isValidHex(hex) ? hex : '#e04a10'}
                  onChange={(e) => setBrand(e.target.value)}
                  aria-label="Custom brand color"
                  className="h-11 w-11 cursor-pointer rounded-full border border-line bg-surface p-1" />
                
                <input
                  value={hex}
                  onChange={(e) => {
                    setHex(e.target.value);
                    if (isValidHex(e.target.value) && e.target.value.length >= 7) updateSettings({ brandColor: e.target.value });
                  }}
                  placeholder="#E04A10"
                  aria-label="Custom hex color"
                  className="h-11 w-28 rounded-xl border border-line px-3 font-mono text-sm uppercase outline-none focus:border-brand" />
                
              </div>
            </div>
            {settings.brandColor &&
            <button type="button" onClick={() => setBrand(null)} className="mt-3 text-sm font-semibold text-brand-strong hover:underline">
                Reset to default palette
              </button>
            }
          </div>
        </div>
      </section>

      <section>
        <h2 className={heading}>Operations</h2>
        <div className={`${section} divide-y divide-line`}>
          <ToggleRow
            label="Accepting orders"
            hint="When off, customers can browse but not order."
            checked={settings.isOpen}
            onChange={(v) => {
              updateSettings({ isOpen: v });
              toast(v ? 'Truck is open for orders' : 'Ordering paused');
            }} />
          
          <ToggleRow
            label="Scheduled pickup"
            hint="Let takeaway customers choose a 15-minute pickup slot."
            checked={settings.scheduledPickup}
            onChange={(v) => updateSettings({ scheduledPickup: v })} />
          
          <NumberField
            id="prep"
            label="Base prep time"
            hint="Minimum estimate shown to customers. Queue length adds to it."
            value={settings.basePrepMinutes}
            suffix="min"
            min={1}
            max={60}
            onCommit={(v) => updateSettings({ basePrepMinutes: Math.round(v) })} />
          
          <ToggleRow label="Kitchen chime" hint="Play a sound on the kitchen display for new orders." checked={settings.chimeEnabled} onChange={(v) => updateSettings({ chimeEnabled: v })} />
        </div>
      </section>

      <section>
        <h2 className={heading}>Pricing</h2>
        <div className={`${section} divide-y divide-line`}>
          <NumberField id="tax" label="Sales tax" value={settings.taxRate} suffix="%" min={0} max={30} onCommit={(v) => updateSettings({ taxRate: v })} />
          <NumberField
            id="packaging"
            label="Packaging fee"
            hint="Added to every takeaway order."
            value={settings.packagingFee}
            suffix="$"
            min={0}
            max={10}
            onCommit={(v) => updateSettings({ packagingFee: v })} />
          
          <NumberField
            id="service"
            label="Service charge"
            hint="Added to dine-in orders."
            value={settings.serviceChargeRate}
            suffix="%"
            min={0}
            max={25}
            onCommit={(v) => updateSettings({ serviceChargeRate: v })} />
          
        </div>
      </section>

      <section>
        <h2 className={heading}>Sample data</h2>
        <div className={`${section} flex flex-wrap items-center justify-between gap-4 py-5`}>
          <div>
            <p className="font-semibold">Load the sample menu</p>
            <p className="text-sm text-muted">Adds the sample categories, menu items, promotions and tables (replacing any with the same ID). Your orders and staff are never touched.</p>
          </div>
          {confirmReset ?
          <div className="flex gap-2">
              <button type="button" onClick={() => setConfirmReset(false)} className="h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line">
                Cancel
              </button>
              <button
              type="button"
              disabled={loadingSample}
              onClick={async () => {
                setLoadingSample(true);
                try {
                  await loadSampleData();
                  toast.success('Sample menu loaded');
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : 'Could not load the sample data.');
                }
                setLoadingSample(false);
                setConfirmReset(false);
              }}
              className="h-11 rounded-full bg-danger px-4 text-sm font-semibold text-white disabled:opacity-60">
              
                {loadingSample ? 'Loading…' : 'Yes, load it'}
              </button>
            </div> :

          <button type="button" onClick={() => setConfirmReset(true)} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-line hover:bg-cream">
              <RotateCcwIcon size={16} /> Load sample menu
            </button>
          }
        </div>
      </section>
    </div>);

}