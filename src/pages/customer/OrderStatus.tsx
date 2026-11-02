import React from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckIcon, SearchXIcon, StoreIcon, XCircleIcon } from 'lucide-react';
import { Loader2Icon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { useTrackedOrder } from '../../hooks/useTrackedOrder';
import { useNow } from '../../hooks/useNow';
import { formatMoney } from '../../utils/currency';
import { paymentMethodLabel } from '../../utils/orderStatus';
import { formatClock, minutesUntil } from '../../utils/time';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { StatusTracker } from '../../components/customer/StatusTracker';
import { OrderTotals } from '../../components/customer/OrderTotals';
import { EmptyState } from '../../components/shared/EmptyState';
import { PaymentBadge } from '../../components/shared/StatusBadge';
import { VegMark } from '../../components/shared/VegMark';

export function OrderStatus() {
  const { number = '' } = useParams();
  const location = useLocation();
  const justPlaced = (location.state as {justPlaced?: boolean;} | null)?.justPlaced ?? false;
  const { settings } = useStore();
  const now = useNow(1000);
  const { order, loading, error } = useTrackedOrder(number);

  if (loading && !order) {
    return (
      <div className="min-h-screen w-full bg-cream">
        <CustomerHeader showCart={false} showMode={false} />
        <main className="mx-auto max-w-xl px-4 py-16">
          <p role="status" className="flex items-center justify-center gap-3 text-muted">
            <Loader2Icon className="animate-spin" size={20} /> Finding your order…
          </p>
        </main>
      </div>);

  }

  if (!order) {
    return (
      <div className="min-h-screen w-full bg-cream">
        <CustomerHeader showCart={false} showMode={false} />
        <main className="mx-auto max-w-xl px-4 py-12">
          <EmptyState
            icon={SearchXIcon}
            title="Order not found"
            body={error ? `We couldn't load order ${number} right now. Check your connection and try again.` : `We couldn't find order ${number}. Check the number on your receipt.`}
            action={
            <Link to="/track" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-brand-ink">
                Try another number
              </Link>
            } />
          
        </main>
      </div>);

  }

  const isTakeaway = order.type === 'takeaway';
  const minsLeft = minutesUntil(order.estimatedReadyAt, now);
  const scheduled = order.pickup?.mode === 'scheduled';

  let headline: string;
  let sub: string;
  if (order.status === 'rejected') {
    headline = 'Order cancelled';
    sub = order.rejectReason ? `Sorry — ${order.rejectReason.toLowerCase()}.` : 'Sorry, the kitchen couldn’t take this order.';
  } else if (order.status === 'ready') {
    headline = isTakeaway ? 'Ready to collect!' : 'On its way to you!';
    sub = isTakeaway ? 'Head to the pickup window and show your order number.' : `Bringing it to Table ${order.tableNumber} now.`;
  } else if (order.status === 'completed') {
    headline = 'Enjoy your meal';
    sub = 'Thanks for eating with us. See you soon!';
  } else if (order.status === 'received') {
    headline = 'Waiting for approval';
    sub = 'Please pay at the cashier and show your order number.';
  } else if (scheduled) {
    headline = `Pickup at ${formatClock(order.estimatedReadyAt)}`;
    sub = 'We’ll have it hot and ready for your slot.';
  } else {
    headline = minsLeft > 0 ? `Ready in ~${minsLeft} min` : 'Almost ready';
    sub = `Estimated ${formatClock(order.estimatedReadyAt)}`;
  }

  return (
    <div className="min-h-screen w-full bg-cream pb-12">
      <CustomerHeader showCart={false} showMode={false} />
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {justPlaced &&
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="mb-6 flex items-center gap-3">
          
            <span className="grid h-11 w-11 place-items-center rounded-full bg-success text-white">
              <CheckIcon size={24} strokeWidth={3} />
            </span>
            <div>
              <p className="font-display text-2xl font-black uppercase leading-none tracking-tight">Order placed</p>
              <p className="text-sm text-muted">Now pay at the cashier. Keep this page open to follow along.</p>
            </div>
          </motion.div>
        }

        <section className={`rounded-3xl p-6 md:p-8 ${order.status === 'rejected' ? 'bg-danger text-white' : 'bg-ink text-white'}`}>
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-medium text-white/70">Order number</p>
              <p className="font-display text-6xl font-black leading-none tracking-tight md:text-7xl">{order.number}</p>
              <p className="mt-3 text-sm text-white/70">
                {isTakeaway ? `Takeaway${order.customer.name ? ` for ${order.customer.name}` : ''}` : `Dine-in · Table ${order.tableNumber}`}
              </p>
            </div>
            <div className="md:text-right" aria-live="polite">
              {order.status === 'rejected' && <XCircleIcon size={28} className="mb-2 md:ml-auto" />}
              <p className={`font-display text-3xl font-black uppercase leading-none tracking-tight md:text-4xl ${order.status === 'ready' ? 'text-mustard' : ''}`}>
                {headline}
              </p>
              <p className="mt-2 text-sm text-white/80">{sub}</p>
            </div>
          </div>
        </section>

        {order.payment.status === 'pending' && order.status !== 'rejected' && order.status !== 'completed' &&
        <div role="note" className="mt-6 flex gap-3 rounded-3xl bg-mustard/25 p-5 ring-1 ring-mustard/40">
            <StoreIcon size={22} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Pay at the cashier</p>
              <p className="text-sm">
                Show order number <strong className="font-display text-base">{order.number}</strong> and pay by {order.payment.method === 'card' ? 'card' : 'cash'}.
                {order.status === 'received' ? ' Your order goes to the kitchen once the cashier approves it.' : ''}
              </p>
            </div>
          </div>
        }

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
          <section className="rounded-3xl bg-surface p-6 ring-1 ring-line md:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Live status</h2>
              {order.status !== 'rejected' && order.status !== 'completed' &&
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> Updating live
                </span>
              }
            </div>
            <div className="mt-6">
              {order.status === 'rejected' ?
              <p className="text-muted">
                  {order.payment.status === 'refunded' ?
                'Your payment will be refunded at the cashier.' :
                'You haven’t been charged. Please speak to our team at the cashier.'}
                </p> :

              <StatusTracker order={order} />
              }
            </div>
          </section>

          <aside className="rounded-3xl bg-surface p-6 ring-1 ring-line">
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Details</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Placed</dt>
                <dd>{formatClock(order.createdAt)}</dd>
              </div>
              {isTakeaway &&
              <div className="flex justify-between gap-4">
                  <dt className="text-muted">Pickup</dt>
                  <dd>{scheduled ? formatClock(order.estimatedReadyAt) : 'As soon as ready'}</dd>
                </div>
              }
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Payment</dt>
                <dd className="flex items-center gap-2">
                  {paymentMethodLabel[order.payment.method]} <PaymentBadge status={order.payment.status} />
                </dd>
              </div>
            </dl>
            <ul className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
              {order.lines.map((l) =>
              <li key={l.lineId} className="flex gap-2">
                  <span className="font-bold tabular-nums">{l.quantity}×</span>
                  <span className="flex flex-1 items-center gap-1.5">
                    <VegMark veg={l.veg} /> {l.name}
                  </span>
                  <span className="tabular-nums">{formatMoney(l.unitPrice * l.quantity)}</span>
                </li>
              )}
            </ul>
            <div className="mt-4 border-t border-line pt-4">
              <OrderTotals totals={order.totals} promoCode={order.promoCode} taxRate={settings.taxRate} />
            </div>
          </aside>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/menu" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
            Order something else
          </Link>
          <Link to="/track" className="inline-flex h-12 items-center rounded-full px-6 font-semibold ring-1 ring-line transition-colors duration-150 hover:bg-surface">
            Track another order
          </Link>
        </div>
      </main>
    </div>);

}