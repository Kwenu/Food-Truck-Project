import React, { useEffect, useState } from 'react';
import { CheckIcon, ClockIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { MenuItem } from '../../types/menu';
import { useCart } from '../../contexts/CartContext';
import { useMoney } from '../../contexts/CurrencyContext';
import { Sheet } from '../shared/Sheet';
import { QuantityStepper } from '../shared/QuantityStepper';
import { VegMark } from '../shared/VegMark';

interface ItemDetailSheetProps {
  item: MenuItem | null;
  open: boolean;
  disabled: boolean;
  onClose: () => void;
}

export function ItemDetailSheet({ item, open, disabled, onClose }: ItemDetailSheetProps) {
  const { formatMoney } = useMoney();
  const { addLine } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addOnIds, setAddOnIds] = useState<string[]>([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setQuantity(1);
      setAddOnIds([]);
      setNote('');
    }
  }, [open, item?.id]);

  if (!item) return null;

  const unitPrice = item.price + item.addOns.filter((a) => addOnIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
  const toggleAddOn = (id: string) => setAddOnIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const handleAdd = () => {
    addLine(item, quantity, addOnIds, note);
    toast.success(`${quantity} × ${item.name} added`);
    onClose();
  };

  const cannotAdd = item.soldOut || disabled;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={item.name}
      hideHeader
      footer={
      <div className="flex items-center gap-3">
          <QuantityStepper value={quantity} onChange={setQuantity} min={1} size="lg" label={item.name} />
          <button
          type="button"
          onClick={handleAdd}
          disabled={cannotAdd}
          className="flex h-14 flex-1 items-center justify-between gap-3 rounded-full bg-brand px-6 font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
          
            <span className="whitespace-nowrap">{item.soldOut ? 'Sold out' : disabled ? 'Truck closed' : 'Add to order'}</span>
            {!cannotAdd && <span className="font-display text-lg font-extrabold">{formatMoney(unitPrice * quantity)}</span>}
          </button>
        </div>
      }>
      
      <div className="aspect-[16/10] w-full overflow-hidden bg-line">
        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-6 p-5 md:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <VegMark veg={item.veg} size="md" withLabel />
            {item.tags.includes('popular') && <span className="rounded-full bg-mustard px-2.5 py-0.5 text-xs font-bold text-ink">Popular</span>}
            {item.tags.includes('chef') && <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-bold text-white">Chef's pick</span>}
            <span className="ml-auto inline-flex items-center gap-1 text-sm text-muted">
              <ClockIcon size={14} /> ~{item.prepMinutes} min
            </span>
          </div>
          <h2 className="mt-3 font-display text-3xl font-black uppercase leading-none tracking-tight">{item.name}</h2>
          <p className="mt-2 text-muted">{item.description}</p>
          <p className="mt-3 font-display text-2xl font-extrabold">{formatMoney(item.price)}</p>
        </div>

        {item.addOns.length > 0 &&
        <fieldset>
            <legend className="text-sm font-bold">Extras</legend>
            <div className="mt-2 divide-y divide-line rounded-2xl ring-1 ring-line">
              {item.addOns.map((a) => {
              const checked = addOnIds.includes(a.id);
              return (
                <label key={a.id} className="flex min-h-[52px] cursor-pointer items-center gap-3 px-4">
                    <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleAddOn(a.id)} />
                    <span
                    className={`grid h-5 w-5 place-items-center rounded-md border-2 transition-colors duration-150 ${
                    checked ? 'border-brand bg-brand text-brand-ink' : 'border-line'}`
                    }
                    aria-hidden="true">
                    
                      {checked && <CheckIcon size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-sm font-medium">{a.label}</span>
                    <span className="text-sm text-muted">+{formatMoney(a.price)}</span>
                  </label>);

            })}
            </div>
          </fieldset>
        }

        <div>
          <label htmlFor="item-note" className="text-sm font-bold">
            Special instructions <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="item-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={140}
            rows={2}
            placeholder="e.g. No pickles, sauce on the side"
            className="mt-2 w-full resize-none rounded-2xl border border-line bg-cream/50 px-4 py-3 text-sm outline-none transition-colors duration-150 focus:border-brand" />
          
        </div>
      </div>
    </Sheet>);

}