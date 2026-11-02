import React, { useState } from 'react';
import { PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import type { PromotionType } from '../../types/menu';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../utils/currency';
import { createId } from '../../utils/id';
import { Switch } from '../shared/Switch';

const inputClass = 'mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none focus:border-brand';

export function PromotionsPanel() {
  const { promotions, upsertPromotion, deletePromotion } = useStore();
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<PromotionType>('percent');
  const [value, setValue] = useState('10');
  const [min, setMin] = useState('0');
  const [error, setError] = useState('');

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase().replace(/\s+/g, '');
    const v = parseFloat(value);
    const m = parseFloat(min) || 0;
    if (c.length < 3) return setError('Code must be at least 3 characters.');
    if (promotions.some((p) => p.code === c)) return setError('That code already exists.');
    if (!Number.isFinite(v) || v <= 0 || type === 'percent' && v > 90) return setError('Enter a valid discount.');
    setError('');
    upsertPromotion({
      id: createId('promo'),
      code: c,
      title: title.trim() || (type === 'percent' ? `${v}% off` : `${formatMoney(v)} off`),
      description: m > 0 ? `On orders over ${formatMoney(m)}.` : 'On any order.',
      type,
      value: v,
      minSubtotal: m,
      active: true
    });
    toast.success(`Promo ${c} is live`);
    setCode('');
    setTitle('');
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
        {promotions.length === 0 && <li className="p-8 text-center text-sm text-muted">No promotions yet.</li>}
        {promotions.map((p) =>
        <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
            <span className="rounded-lg bg-ink px-2.5 py-1 font-mono text-sm font-bold text-mustard">{p.code}</span>
            <div className="min-w-[160px] flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-xs text-muted">
                {p.type === 'percent' ? `${p.value}% off` : `${formatMoney(p.value)} off`}
                {p.minSubtotal > 0 ? ` · min ${formatMoney(p.minSubtotal)}` : ''}
              </p>
            </div>
            <Switch
            checked={p.active}
            onChange={(v) => {
              upsertPromotion({ ...p, active: v });
              toast(v ? `${p.code} activated` : `${p.code} paused`);
            }}
            label={p.active ? 'Active' : 'Paused'}
            showLabel />
          
            <button
            type="button"
            onClick={() => {
              deletePromotion(p.id);
              toast(`${p.code} deleted`);
            }}
            aria-label={`Delete ${p.code}`}
            className="grid h-10 w-10 place-items-center rounded-full text-muted hover:bg-danger/5 hover:text-danger">
            
              <Trash2Icon size={16} />
            </button>
          </li>
        )}
      </ul>

      <form onSubmit={create} className="rounded-3xl bg-surface p-5 ring-1 ring-line">
        <h3 className="font-display text-xl font-extrabold uppercase tracking-tight">New offer</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="promo-code" className="text-sm font-semibold">
              Code
            </label>
            <input id="promo-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="LUNCH20" className={`${inputClass} font-mono uppercase`} />
          </div>
          <div>
            <label htmlFor="promo-title" className="text-sm font-semibold">
              Headline <span className="font-normal text-muted">(shown on menu)</span>
            </label>
            <input id="promo-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="20% off lunch" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="promo-type" className="text-sm font-semibold">
                Type
              </label>
              <select id="promo-type" value={type} onChange={(e) => setType(e.target.value as PromotionType)} className={inputClass}>
                <option value="percent">Percent</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>
            <div>
              <label htmlFor="promo-value" className="text-sm font-semibold">
                {type === 'percent' ? 'Percent' : 'Amount ($)'}
              </label>
              <input id="promo-value" inputMode="decimal" value={value} onChange={(e) => setValue(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="promo-min" className="text-sm font-semibold">
              Minimum order ($)
            </label>
            <input id="promo-min" inputMode="decimal" value={min} onChange={(e) => setMin(e.target.value)} className={inputClass} />
          </div>
          {error && <p className="text-sm font-medium text-danger">{error}</p>}
          <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink">
            <PlusIcon size={18} /> Create offer
          </button>
        </div>
      </form>
    </div>);

}