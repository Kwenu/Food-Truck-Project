import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangleIcon, ClockIcon, ShoppingBagIcon, UtensilsIcon } from 'lucide-react';
import type { Order } from '../../types/order';
import { kitchenStart, nextActionLabel } from '../../utils/orderStatus';
import { formatClock, formatElapsed } from '../../utils/time';

interface KitchenTicketProps {
  order: Order;
  now: number;
  onAdvance: () => void;
  onReject: (reason: string) => void;
}

const rejectReasons = ['Item ran out', 'Kitchen too busy', 'Duplicate order'];

export function KitchenTicket({ order, now, onAdvance, onReject }: KitchenTicketProps) {
  const [confirmReject, setConfirmReject] = useState(false);
  const startedAt = kitchenStart(order);
  const elapsed = now - new Date(startedAt).getTime();
  const scheduled = order.pickup?.mode === 'scheduled';
  const targetMs = order.prepMinutes * 60000;
  const delayed = !scheduled && order.status !== 'ready' && elapsed > targetMs;
  const overBy = Math.ceil((elapsed - targetMs) / 60000);
  const isTakeaway = order.type === 'takeaway';
  // The kitchen only cooks: confirmed → preparing → ready. Serving/collecting is done by the waiter in the admin panel.
  const action = order.status === 'confirmed' || order.status === 'preparing' ? nextActionLabel(order.status, order.type) : null;

  const actionStyle =
  order.status === 'confirmed' ?
  'bg-brand text-brand-ink hover:bg-brand-strong' :
  order.status === 'preparing' ?
  'bg-success text-white hover:bg-success/90' :
  order.status === 'ready' ?
  'bg-white text-ink hover:bg-white/90' :
  'bg-night-line text-white hover:bg-night-line/80';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: -12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className={`overflow-hidden rounded-2xl bg-night-raised ${delayed ? 'ring-2 ring-danger' : 'ring-1 ring-night-line'}`}
      aria-label={`Order ${order.number}`}>
      
      <motion.div key={delayed ? 'late' : 'ok'} initial={delayed ? { scale: 0.985 } : false} animate={{ scale: 1 }} transition={{ duration: 0.25 }}>
        <header className="flex items-start justify-between gap-3 border-b border-night-line p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black uppercase tracking-wide text-ink ${
                isTakeaway ? 'bg-mustard' : 'bg-night-dine'}`
                }>
                
                {isTakeaway ? <ShoppingBagIcon size={12} /> : <UtensilsIcon size={12} />}
                {isTakeaway ? 'Takeaway' : 'Dine-in'}
              </span>
              {order.status === 'confirmed' && <span className="text-[11px] font-bold uppercase tracking-wide text-brand">New</span>}
            </div>
            <p className="mt-1.5 font-display text-3xl font-black leading-none tracking-tight">{order.number}</p>
            <p className="mt-1.5 truncate text-sm text-night-muted">
              {isTakeaway ?
              <>
                  <span className="font-semibold text-white">{order.customer.name || 'Guest'}</span> ·{' '}
                  {scheduled && order.pickup?.at ? `Pickup ${formatClock(order.pickup.at)}` : 'ASAP'}
                </> :

              <span className="font-display text-xl font-black text-white">Table {order.tableNumber}</span>
              }
            </p>
          </div>
          <div className="text-right">
            <p className={`font-mono text-2xl font-bold tabular-nums ${delayed ? 'text-danger' : 'text-white'}`}>{formatElapsed(elapsed)}</p>
            <p className="mt-1 inline-flex items-center gap-1 text-xs text-night-muted">
              <ClockIcon size={12} /> {formatClock(startedAt)}
            </p>
          </div>
        </header>

        {delayed &&
        <p className="flex items-center gap-2 bg-danger px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
            <AlertTriangleIcon size={14} /> Delayed +{overBy} min
          </p>
        }

        <ul className="space-y-3 p-4">
          {order.lines.map((l) =>
          <li key={l.lineId} className="flex gap-3">
              <span className="grid h-8 min-w-[32px] place-items-center rounded-lg bg-night-line font-display text-lg font-black">{l.quantity}</span>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold leading-snug">{l.name}</p>
                {l.addOns.length > 0 && <p className="text-sm text-night-muted">+ {l.addOns.join(', ')}</p>}
                {l.note && <p className="text-sm font-semibold text-mustard">→ {l.note}</p>}
              </div>
            </li>
          )}
        </ul>

        {order.note &&
        <div className="mx-4 mb-4 flex gap-2 rounded-xl bg-mustard/15 p-3 text-sm font-semibold text-mustard">
            <AlertTriangleIcon size={16} className="mt-0.5 shrink-0" /> {order.note}
          </div>
        }

        <footer className="p-4 pt-0">
          {confirmReject ?
          <div className="rounded-xl bg-night p-3">
              <p className="text-sm font-semibold">Reject this order?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {rejectReasons.map((r) =>
              <button
                key={r}
                type="button"
                onClick={() => onReject(r)}
                className="h-10 rounded-lg bg-danger px-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-danger/90">
                
                    {r}
                  </button>
              )}
                <button type="button" onClick={() => setConfirmReject(false)} className="h-10 rounded-lg px-3 text-sm font-semibold text-night-muted hover:text-white">
                  Keep
                </button>
              </div>
            </div> :

          <div className="flex gap-2">
              {order.status === 'confirmed' &&
            <button
              type="button"
              onClick={() => setConfirmReject(true)}
              className="h-14 rounded-xl px-4 font-semibold text-night-muted ring-1 ring-night-line transition-colors duration-150 hover:text-white">
              
                  Reject
                </button>
            }
              {action &&
            <button
              type="button"
              onClick={onAdvance}
              className={`h-14 flex-1 rounded-xl text-lg font-bold transition-[background-color,transform] duration-150 active:scale-[0.98] ${actionStyle}`}>
              
                  {action}
                </button>
            }
              {order.status === 'ready' &&
            <p className="flex h-14 flex-1 items-center justify-center rounded-xl bg-night text-sm font-semibold text-night-muted">
                  Waiting for the waiter to collect
                </p>
            }
            </div>
          }
        </footer>
      </motion.div>
    </motion.article>);

}