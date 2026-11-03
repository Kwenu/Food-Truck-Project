import React, { useState } from 'react';
import { MessageSquareIcon, XIcon } from 'lucide-react';
import type { OrderLine } from '../../types/order';
import { useCart } from '../../contexts/CartContext';
import { useMoney } from '../../contexts/CurrencyContext';
import { QuantityStepper } from '../shared/QuantityStepper';
import { VegMark } from '../shared/VegMark';

interface CartLineItemProps {
  line: OrderLine;
  compact?: boolean;
}

export function CartLineItem({ line, compact = false }: CartLineItemProps) {
  const { formatMoney } = useMoney();
  const { updateQuantity, removeLine, setLineNote } = useCart();
  const [editingNote, setEditingNote] = useState(false);

  return (
    <div className={`flex gap-3 ${compact ? 'py-3' : 'py-4'}`}>
      <img src={line.image} alt="" className={`shrink-0 rounded-xl object-cover ${compact ? 'h-14 w-14' : 'h-20 w-20'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-2">
          <span className="mt-[3px]">
            <VegMark veg={line.veg} />
          </span>
          <p className={`flex-1 font-semibold leading-snug ${compact ? 'text-sm' : ''}`}>{line.name}</p>
          {!compact &&
          <button
            type="button"
            onClick={() => removeLine(line.lineId)}
            aria-label={`Remove ${line.name}`}
            className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-cream hover:text-ink">
            
              <XIcon size={16} />
            </button>
          }
        </div>
        {line.addOns.length > 0 && <p className="mt-0.5 text-xs text-muted">+ {line.addOns.join(', ')}</p>}
        {line.note && !editingNote && <p className="mt-1 text-xs italic text-ink/80">“{line.note}”</p>}
        {!compact && editingNote &&
        <input
          autoFocus
          value={line.note}
          onChange={(e) => setLineNote(line.lineId, e.target.value)}
          onBlur={() => setEditingNote(false)}
          onKeyDown={(e) => e.key === 'Enter' && setEditingNote(false)}
          maxLength={140}
          placeholder="e.g. No onions"
          aria-label={`Instructions for ${line.name}`}
          className="mt-2 h-9 w-full rounded-lg border border-line bg-cream/50 px-3 text-sm outline-none focus:border-brand" />

        }
        <div className={`flex items-center justify-between gap-2 ${compact ? 'mt-2' : 'mt-3'}`}>
          <div className="flex items-center gap-2">
            <QuantityStepper value={line.quantity} onChange={(q) => updateQuantity(line.lineId, q)} label={line.name} removable />
            {!compact && !editingNote &&
            <button
              type="button"
              onClick={() => setEditingNote(true)}
              className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold text-muted transition-colors duration-150 hover:bg-cream hover:text-ink">
              
                <MessageSquareIcon size={14} />
                {line.note ? 'Edit note' : 'Add note'}
              </button>
            }
          </div>
          <div className="text-right">
            <p className="font-display text-base font-extrabold">{formatMoney(line.unitPrice * line.quantity)}</p>
            {line.quantity > 1 && <p className="text-xs text-muted">{formatMoney(line.unitPrice)} each</p>}
          </div>
        </div>
      </div>
    </div>);

}