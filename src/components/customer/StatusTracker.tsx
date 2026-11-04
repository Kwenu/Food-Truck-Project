import React from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from 'lucide-react';
import type { Order } from '../../types/order';
import { TRACK_STAGES, statusLabel } from '../../utils/orderStatus';
import { formatClock } from '../../utils/time';

const stageHints: Record<string, {takeaway: string;dine: string;}> = {
  received: { takeaway: 'Please pay at the cashier. We’ll send it to the kitchen once it’s approved.', dine: 'Please pay at the cashier. We’ll send it to the kitchen once it’s approved.' },
  confirmed: { takeaway: 'Approved — it’s in the kitchen queue.', dine: 'Approved — it’s in the kitchen queue.' },
  preparing: { takeaway: 'Your food is on the grill.', dine: 'Your food is on the grill.' },
  ready: { takeaway: 'Show your order number at the pickup window.', dine: 'We’re bringing it to your table.' },
  completed: { takeaway: 'Enjoy your meal!', dine: 'Enjoy your meal!' }
};

export function StatusTracker({ order }: {order: Order;}) {
  const currentIndex = TRACK_STAGES.indexOf(order.status);
  const reachedAt = (stage: string) => [...order.history].reverse().find((h) => h.status === stage)?.at;

  return (
    <ol className="relative" aria-label="Order progress">
      {TRACK_STAGES.map((stage, i) => {
        const done = i < currentIndex || order.status === 'completed';
        const current = i === currentIndex && order.status !== 'completed';
        const at = reachedAt(stage);
        const last = i === TRACK_STAGES.length - 1;
        return (
          <li key={stage} className="relative flex gap-4 pb-7 last:pb-0" aria-current={current ? 'step' : undefined}>
            {!last &&
            <span className="absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 bg-line" aria-hidden="true">
                <motion.span
                className="block w-full gradient-brand"
                initial={false}
                animate={{ height: done ? '100%' : '0%' }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }} />
              
              </span>
            }
            <span
              className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 ${
              done ? 'border-brand gradient-brand text-white' : current ? 'border-brand bg-surface text-brand-strong' : 'border-line bg-surface text-muted'}`
              }>
              
              {done ?
              <CheckIcon size={18} strokeWidth={3} /> :
              current ?
              <motion.span
                className="h-3 w-3 rounded-full gradient-brand"
                animate={{ scale: [1, 0.7, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} /> :


              <span className="text-sm font-bold">{i + 1}</span>
              }
            </span>
            <div className="pt-1.5">
              <p className={`font-semibold leading-tight ${done || current ? 'text-ink' : 'text-muted'}`}>{statusLabel(stage, order.type)}</p>
              {(current || done && stage === 'ready') &&
              <p className="mt-1 text-sm text-muted">{order.type === 'takeaway' ? stageHints[stage].takeaway : stageHints[stage].dine}</p>
              }
              {at && (done || current) && <p className="mt-0.5 text-xs text-muted">{formatClock(at)}</p>}
            </div>
          </li>);

      })}
    </ol>);

}