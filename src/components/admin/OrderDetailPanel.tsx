import React, { useState } from 'react';
import { CheckIcon, PhoneIcon, PrinterIcon, ShoppingBagIcon, UtensilsIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../types/order';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../utils/currency';
import { TRACK_STAGES, nextActionLabel, nextStatus, paymentMethodLabel, statusLabel } from '../../utils/orderStatus';
import { formatClock, formatDateTime } from '../../utils/time';
import { Sheet } from '../shared/Sheet';
import { PaymentBadge, StatusBadge } from '../shared/StatusBadge';
import { VegMark } from '../shared/VegMark';
import { OrderTotals } from '../customer/OrderTotals';
import { ReceiptModal } from './ReceiptModal';

interface OrderDetailPanelProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

const rejectReasons = ['Item ran out', 'Kitchen too busy', 'Duplicate order', 'Customer request'];

export function OrderDetailPanel({ order, open, onClose }: OrderDetailPanelProps) {
  const { updateOrderStatus, rejectOrder, setPaymentStatus, settings } = useStore();
  const [rejecting, setRejecting] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);

  if (!order) return null;

  const next = nextStatus(order.status);
  const action = nextActionLabel(order.status, order.type);
  const currentIndex = TRACK_STAGES.indexOf(order.status);

  const advance = () => {
    if (!next) return;
    updateOrderStatus(order.id, next);
    toast.success(`${order.number} · ${statusLabel(next, order.type)}`);
  };

  const sectionTitle = 'text-xs font-bold uppercase tracking-wide text-muted';

  return (
    <>
      <Sheet
        open={open}
        onClose={() => {
          setRejecting(false);
          onClose();
        }}
        title={`Order ${order.number}`}
        variant="drawer"
        footer={
        <div className="space-y-3">
            {rejecting ?
          <div>
                <p className="text-sm font-semibold">Why are you rejecting this order?</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {rejectReasons.map((r) =>
              <button
                key={r}
                type="button"
                onClick={() => {
                  rejectOrder(order.id, r);
                  setRejecting(false);
                  toast(`${order.number} rejected`);
                }}
                className="h-10 rounded-full bg-danger px-4 text-sm font-semibold text-white">
                
                      {r}
                    </button>
              )}
                  <button type="button" onClick={() => setRejecting(false)} className="h-10 rounded-full px-4 text-sm font-semibold ring-1 ring-line">
                    Cancel
                  </button>
                </div>
              </div> :

          <div className="flex flex-wrap gap-2">
                <button
              type="button"
              onClick={() => setReceiptOpen(true)}
              className="flex h-12 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-line transition-colors duration-150 hover:bg-cream">
              
                  <PrinterIcon size={16} /> Receipt
                </button>
                {order.status === 'received' &&
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="h-12 rounded-full px-4 text-sm font-semibold text-danger ring-1 ring-danger/30 transition-colors duration-150 hover:bg-danger/5">
              
                    Reject
                  </button>
            }
                {order.status === 'received' && order.payment.status === 'pending' &&
            <button
              type="button"
              onClick={() => {
                setPaymentStatus(order.id, 'paid');
                advance();
              }}
              className="h-12 whitespace-nowrap rounded-full bg-ink px-5 font-semibold text-white transition-colors duration-150 hover:bg-ink/90">
              
                    Paid &amp; approve
                  </button>
            }
                {action &&
            <button
              type="button"
              onClick={advance}
              className="h-12 flex-1 whitespace-nowrap rounded-full bg-brand px-5 font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
              
                    {action}
                  </button>
            }
              </div>
          }
          </div>
        }>
        
        <div className="space-y-6 p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={order.status} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-2.5 py-1 text-xs font-semibold">
              {order.type === 'takeaway' ? <ShoppingBagIcon size={13} /> : <UtensilsIcon size={13} />}
              {order.type === 'takeaway' ? 'Takeaway' : `Dine-in · Table ${order.tableNumber}`}
            </span>
            <span className="ml-auto text-sm text-muted">{formatDateTime(order.createdAt)}</span>
          </div>

          {order.status === 'rejected' &&
          <p className="rounded-2xl bg-danger/10 p-3 text-sm text-danger">Rejected: {order.rejectReason ?? 'No reason given'}</p>
          }

          {order.status !== 'rejected' &&
          <ol className="grid grid-cols-5 gap-1" aria-label="Progress">
              {TRACK_STAGES.map((s, i) =>
            <li key={s} className="text-center">
                  <span className={`block h-1.5 rounded-full ${i <= currentIndex ? 'bg-brand' : 'bg-line'}`} />
                  <span className={`mt-1.5 block text-[11px] font-semibold ${i <= currentIndex ? 'text-ink' : 'text-muted'}`}>
                    {['Received', 'Confirmed', 'Preparing', 'Ready', 'Done'][i]}
                  </span>
                </li>
            )}
            </ol>
          }

          <section>
            <h3 className={sectionTitle}>Customer</h3>
            <div className="mt-2 rounded-2xl bg-cream/60 p-4 text-sm">
              <p className="font-semibold">{order.customer.name || 'Walk-in guest'}</p>
              {order.customer.phone ?
              <a href={`tel:${order.customer.phone}`} className="mt-1 inline-flex items-center gap-1.5 text-brand-strong hover:underline">
                  <PhoneIcon size={14} /> {order.customer.phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')}
                </a> :

              <p className="mt-1 text-muted">No phone provided</p>
              }
              {order.type === 'takeaway' &&
              <p className="mt-2 text-muted">
                  Pickup: {order.pickup?.mode === 'scheduled' && order.pickup.at ? `Scheduled ${formatClock(order.pickup.at)}` : 'ASAP'} · est.{' '}
                  {formatClock(order.estimatedReadyAt)}
                </p>
              }
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>Items</h3>
            <ul className="mt-2 divide-y divide-line">
              {order.lines.map((l) =>
              <li key={l.lineId} className="flex gap-3 py-3">
                  <img src={l.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <VegMark veg={l.veg} /> {l.quantity} × {l.name}
                    </p>
                    {l.addOns.length > 0 && <p className="text-xs text-muted">+ {l.addOns.join(', ')}</p>}
                    {l.note && <p className="text-xs italic text-warning">“{l.note}”</p>}
                  </div>
                  <span className="text-sm tabular-nums">{formatMoney(l.unitPrice * l.quantity)}</span>
                </li>
              )}
            </ul>
            {order.note && <p className="mt-2 rounded-xl bg-mustard/20 p-3 text-sm">Kitchen note: {order.note}</p>}
          </section>

          <section>
            <OrderTotals totals={order.totals} promoCode={order.promoCode} taxRate={settings.taxRate} />
          </section>

          <section>
            <h3 className={sectionTitle}>Payment</h3>
            <div className="mt-2 flex items-center justify-between gap-3 rounded-2xl bg-cream/60 p-4 text-sm">
              <div>
                <p className="flex items-center gap-2 font-semibold">
                  {paymentMethodLabel[order.payment.method]} <PaymentBadge status={order.payment.status} />
                </p>
                {order.payment.reference && <p className="mt-1 font-mono text-xs text-muted">{order.payment.reference}</p>}
              </div>
              {order.payment.status === 'pending' && order.status !== 'rejected' &&
              <button
                type="button"
                onClick={() => {
                  setPaymentStatus(order.id, 'paid');
                  toast.success(`${order.number} marked as paid`);
                }}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full bg-ink px-4 text-sm font-semibold text-white">
                
                  <CheckIcon size={16} /> Mark paid
                </button>
              }
            </div>
          </section>

          <section>
            <h3 className={sectionTitle}>History</h3>
            <ul className="mt-2 space-y-1.5 text-sm">
              {order.history.map((h, i) =>
              <li key={`${h.status}-${i}`} className="flex justify-between">
                  <span>{statusLabel(h.status, order.type)}</span>
                  <span className="text-muted">{formatClock(h.at)}</span>
                </li>
              )}
            </ul>
          </section>
        </div>
      </Sheet>
      <ReceiptModal order={order} open={receiptOpen} onClose={() => setReceiptOpen(false)} />
    </>);

}