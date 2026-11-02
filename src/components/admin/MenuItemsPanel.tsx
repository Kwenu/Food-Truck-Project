import React, { useMemo, useState } from 'react';
import { PencilIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { MenuItem } from '../../types/menu';
import { useStore } from '../../contexts/StoreContext';
import { Switch } from '../shared/Switch';
import { VegMark } from '../shared/VegMark';
import { MenuItemDrawer } from './MenuItemDrawer';

function PriceInput({ item }: {item: MenuItem;}) {
  const { patchMenuItem } = useStore();
  const [value, setValue] = useState(item.price.toFixed(2));
  const commit = () => {
    const n = parseFloat(value);
    if (!Number.isFinite(n) || n <= 0) {
      setValue(item.price.toFixed(2));
      return;
    }
    const rounded = Math.round(n * 100) / 100;
    if (rounded !== item.price) {
      patchMenuItem(item.id, { price: rounded });
      toast.success(`${item.name} now $${rounded.toFixed(2)}`);
    }
    setValue(rounded.toFixed(2));
  };
  return (
    <div className="relative w-24">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
      <input
        value={value}
        inputMode="decimal"
        onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        aria-label={`Price for ${item.name}`}
        className="h-10 w-full rounded-xl border border-transparent bg-cream/60 pl-6 pr-2 text-right text-sm font-semibold tabular-nums outline-none transition-colors duration-150 hover:border-line focus:border-brand focus:bg-surface" />
      
    </div>);

}

export function MenuItemsPanel() {
  const { categories, menuItems, patchMenuItem } = useStore();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...categories].
    sort((a, b) => a.sortOrder - b.sortOrder).
    filter((c) => category === 'all' || c.id === category).
    map((c) => ({ category: c, items: menuItems.filter((i) => i.categoryId === c.id && (!q || i.name.toLowerCase().includes(q))) })).
    filter((g) => g.items.length > 0);
  }, [categories, menuItems, query, category]);

  const openEditor = (item: MenuItem | null) => {
    setEditing(item);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <SearchIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items"
            aria-label="Search items"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none focus:border-brand" />
          
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none focus:border-brand">
          
          <option value="all">All categories</option>
          {categories.map((c) =>
          <option key={c.id} value={c.id}>
              {c.name}
            </option>
          )}
        </select>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
          
          <PlusIcon size={18} /> Add item
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
        {groups.length === 0 && <p className="p-8 text-center text-sm text-muted">No items match your search.</p>}
        {groups.map(({ category: c, items }) =>
        <section key={c.id} aria-labelledby={`mg-${c.id}`}>
            <h3 id={`mg-${c.id}`} className="border-b border-line bg-cream/50 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-muted">
              {c.name} · {items.length}
            </h3>
            <ul className="divide-y divide-line">
              {items.map((item) =>
            <li key={item.id} className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3 ${!item.enabled ? 'opacity-60' : ''}`}>
                  <img src={item.image} alt="" className="h-12 w-12 shrink-0 rounded-xl object-cover" />
                  <div className="min-w-[160px] flex-1">
                    <p className="flex items-center gap-2 font-semibold">
                      <VegMark veg={item.veg} /> {item.name}
                    </p>
                    <p className="mt-0.5 flex flex-wrap gap-1.5 text-xs text-muted">
                      {item.tags.includes('popular') && <span className="rounded bg-mustard/40 px-1.5 font-semibold text-ink">Popular</span>}
                      {item.tags.includes('chef') && <span className="rounded bg-ink px-1.5 font-semibold text-white">Chef's pick</span>}
                      {item.soldOut && <span className="rounded bg-danger/10 px-1.5 font-semibold text-danger">Sold out</span>}
                      {!item.enabled && <span className="rounded bg-ink/10 px-1.5 font-semibold">Hidden</span>}
                      <span>~{item.prepMinutes} min</span>
                    </p>
                  </div>
                  <PriceInput key={item.price} item={item} />
                  <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center gap-1">
                      <Switch checked={item.enabled} onChange={(v) => patchMenuItem(item.id, { enabled: v })} label={`Show ${item.name} on menu`} />
                      <span className="text-[11px] font-semibold text-muted">On menu</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <Switch
                    checked={item.soldOut}
                    onChange={(v) => {
                      patchMenuItem(item.id, { soldOut: v });
                      toast(v ? `${item.name} marked sold out` : `${item.name} back in stock`);
                    }}
                    label={`Mark ${item.name} sold out`}
                    tone="danger" />
                  
                      <span className="text-[11px] font-semibold text-muted">Sold out</span>
                    </div>
                    <button
                  type="button"
                  onClick={() => openEditor(item)}
                  aria-label={`Edit ${item.name}`}
                  className="grid h-10 w-10 place-items-center rounded-full ring-1 ring-line transition-colors duration-150 hover:bg-cream">
                  
                      <PencilIcon size={16} />
                    </button>
                  </div>
                </li>
            )}
            </ul>
          </section>
        )}
      </div>

      <MenuItemDrawer item={editing} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>);

}