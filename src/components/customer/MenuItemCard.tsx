import React from 'react';
import { PlusIcon } from 'lucide-react';
import type { MenuItem } from '../../types/menu';
import { formatMoney } from '../../utils/currency';
import { VegMark } from '../shared/VegMark';

interface MenuItemCardProps {
  item: MenuItem;
  quantityInCart: number;
  disabled: boolean;
  onOpen: () => void;
  onQuickAdd: () => void;
}

export function MenuItemCard({ item, quantityInCart, disabled, onOpen, onQuickAdd }: MenuItemCardProps) {
  const unavailable = item.soldOut;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-surface ring-1 ring-line">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${item.name}`}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
        
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-line">
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-300 ease-snappy group-hover:scale-[1.03] ${unavailable ? 'grayscale' : ''}`} />
          
          <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
            {item.tags.includes('popular') &&
            <span className="rounded-full bg-mustard px-2 py-0.5 text-[11px] font-bold text-ink">Popular</span>
            }
            {item.tags.includes('chef') &&
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-bold text-white">Chef's pick</span>
            }
          </div>
          {unavailable &&
          <div className="absolute inset-0 grid place-items-center bg-ink/40">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">Sold out</span>
            </div>
          }
        </div>
        <div className="flex flex-1 flex-col p-3 md:p-4">
          <div className="flex items-start gap-2">
            <span className="mt-[3px]">
              <VegMark veg={item.veg} />
            </span>
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug md:text-base">{item.name}</h3>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted md:text-sm">{item.description}</p>
          <p className="mt-auto pt-3 font-display text-lg font-extrabold tracking-tight md:text-xl">{formatMoney(item.price)}</p>
        </div>
      </button>
      <button
        type="button"
        onClick={onQuickAdd}
        disabled={unavailable || disabled}
        aria-label={`Add ${item.name}`}
        className={`absolute bottom-3 right-3 grid h-10 min-w-[40px] place-items-center rounded-full px-2 text-sm font-bold transition-[transform,background-color] duration-150 ease-snappy active:scale-95 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
        quantityInCart > 0 ? 'bg-ink text-white' : 'bg-brand text-brand-ink hover:bg-brand-strong'}`
        }>
        
        {quantityInCart > 0 ? <span className="tabular-nums">{quantityInCart}</span> : <PlusIcon size={20} strokeWidth={2.5} />}
      </button>
    </article>);

}