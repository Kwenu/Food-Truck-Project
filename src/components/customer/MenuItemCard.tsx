import { PlusIcon } from 'lucide-react';
import type { MenuItem } from '../../types/menu';
import { useMoney } from '../../contexts/CurrencyContext';
import { VegMark } from '../shared/VegMark';

interface MenuItemCardProps {
  item: MenuItem;
  quantityInCart: number;
  disabled: boolean;
  onOpen: () => void;
  onQuickAdd: () => void;
}

export function MenuItemCard({ item, quantityInCart, disabled, onOpen, onQuickAdd }: MenuItemCardProps) {
  const { formatMoney } = useMoney();
  const unavailable = item.soldOut;
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-surface shadow-sm ring-1 ring-line transition-[transform,box-shadow] duration-200 ease-snappy hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/10">
      {/* Photo + name + description (tap to see details) */}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View ${item.name}`}
        className="flex flex-1 flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand">
        
        <div className="relative aspect-[16/10] w-full sm:aspect-[4/3] overflow-hidden bg-line">
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-500 ease-snappy group-hover:scale-105 ${unavailable ? 'grayscale' : ''}`} />
          
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {item.tags.includes('popular') &&
            <span className="rounded-full bg-mustard px-2.5 py-0.5 text-[11px] font-bold text-ink shadow-sm">Popular</span>
            }
            {item.tags.includes('chef') &&
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm">Chef's pick</span>
            }
          </div>
          {unavailable &&
          <div className="absolute inset-0 grid place-items-center bg-ink/40">
              <span className="rounded-full bg-surface px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink">Sold out</span>
            </div>
          }
        </div>
        <div className="flex flex-1 flex-col px-4 pb-2 pt-4">
          <div className="flex items-start gap-2">
            <span className="mt-[3px] shrink-0">
              <VegMark veg={item.veg} />
            </span>
            <h3 className="text-base font-bold leading-snug md:text-lg">{item.name}</h3>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{item.description}</p>
        </div>
      </button>

      {/* Price and add button sit side by side, so they can never overlap */}
      <div className="flex items-center justify-between gap-3 px-4 pb-4 pt-2">
        <p className="whitespace-nowrap font-display text-xl font-black tracking-tight text-brand-strong md:text-2xl">{formatMoney(item.price)}</p>
        <button
          type="button"
          onClick={onQuickAdd}
          disabled={unavailable || disabled}
          aria-label={`Add ${item.name}`}
          className={`grid h-11 min-w-[44px] shrink-0 place-items-center rounded-full px-3 text-sm font-bold transition-[transform,filter] duration-150 ease-snappy hover:brightness-110 active:scale-90 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
          quantityInCart > 0 ? 'bg-ink text-white' : 'bg-brand text-white'}`
          }>
          
          {quantityInCart > 0 ? <span className="tabular-nums">{quantityInCart}</span> : <PlusIcon size={22} strokeWidth={2.5} />}
        </button>
      </div>
    </article>);

}
