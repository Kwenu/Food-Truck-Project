import React, { useMemo, useState } from 'react';
import { isSameDay, subDays } from 'date-fns';
import { SearchIcon, ReceiptTextIcon } from 'lucide-react';
import type { OrderStatus, OrderType, PaymentStatus } from '../../types/order';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../utils/currency';
import { isActiveStatus, paymentMethodLabel } from '../../utils/orderStatus';
import { formatClock, formatDateTime } from '../../utils/time';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { OrderDetailPanel } from '../../components/admin/OrderDetailPanel';
import { EmptyState } from '../../components/shared/EmptyState';
import { PaymentBadge, StatusBadge } from '../../components/shared/StatusBadge';

type TypeFilter = 'all' | OrderType;
type StatusFilter = 'all' | 'active' | OrderStatus;
type PaymentFilter = 'all' | PaymentStatus;
type RangeFilter = 'today' | '7d' | 'all';

const selectClass = 'h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none focus:border-brand';

export function Orders() {
  const { orders } = useStore();
  const [type, setType] = useState<TypeFilter>('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [payment, setPayment] = useState<PaymentFilter>('all');
  const [range, setRange] = useState<RangeFilter>('today');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(40);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = useMemo(() => {
    const now = new Date();
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const created = new Date(o.createdAt);
      if (range === 'today' && !isSameDay(created, now)) return false;
      if (range === '7d' && created < subDays(now, 7)) return false;
      if (type !== 'all' && o.type !== type) return false;
      if (status === 'active' && !isActiveStatus(o.status)) return false;
      if (status !== 'all' && status !== 'active' && o.status !== status) return false;
      if (payment !== 'all' && o.payment.status !== payment) return false;
      if (q) {
        const hay = `${o.number} ${o.customer.name} ${o.customer.phone} ${o.tableNumber ? `table ${o.tableNumber}` : ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [orders, type, status, payment, range, query]);

  const selected = selectedId ? orders.find((o) => o.id === selectedId) ?? null : null;
  const open = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
  };

  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminPageHeader title="Orders" description="Every incoming order, updated live from the customer app and kitchen." />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div role="tablist" aria-label="Order type" className="flex rounded-full bg-surface p-1 ring-1 ring-line">
          {(['all', 'takeaway', 'dine-in'] as TypeFilter[]).map((t) =>
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            onClick={() => setType(t)}
            className={`h-9 flex-1 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-150 xl:flex-none ${
            type === t ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`
            }>
            
              {t === 'all' ? 'All' : t === 'takeaway' ? 'Takeaway' : 'Dine-in'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Date range" value={range} onChange={(e) => setRange(e.target.value as RangeFilter)} className={selectClass}>
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="all">All time</option>
          </select>
          <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className={selectClass}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="received">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
          <select aria-label="Payment" value={payment} onChange={(e) => setPayment(e.target.value as PaymentFilter)} className={selectClass}>
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Unpaid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
        <div className="relative xl:ml-auto xl:w-72">
          <SearchIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Order #, name, phone, table"
            aria-label="Search orders"
            className="h-11 w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none focus:border-brand" />
          
        </div>
      </div>

      <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
        {filtered.length === 0 ?
        <EmptyState icon={ReceiptTextIcon} title="No orders found" body="Try a different date range or clear your filters." /> :

        <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-line bg-cream/50 text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-3 py-3 font-semibold">Time</th>
                  <th className="px-3 py-3 font-semibold">Type</th>
                  <th className="px-3 py-3 font-semibold">Customer</th>
                  <th className="px-3 py-3 text-right font-semibold">Items</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 font-semibold">Payment</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.slice(0, limit).map((o) =>
              <tr
                key={o.id}
                tabIndex={0}
                onClick={() => open(o.id)}
                onKeyDown={(e) => e.key === 'Enter' && open(o.id)}
                className="cursor-pointer transition-colors duration-150 hover:bg-cream/60 focus:bg-cream/60 focus:outline-none">
                
                    <td className="px-5 py-3.5 font-semibold">
                      {o.number}
                      {o.status === 'received' && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand align-middle" aria-label="new" />}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-muted">{range === 'today' ? formatClock(o.createdAt) : formatDateTime(o.createdAt)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5">{o.type === 'takeaway' ? 'Takeaway' : `Dine-in · T${o.tableNumber}`}</td>
                    <td className="max-w-[180px] truncate px-3 py-3.5">{o.customer.name || <span className="text-muted">Guest</span>}</td>
                    <td className="px-3 py-3.5 text-right tabular-nums">{o.lines.reduce((s, l) => s + l.quantity, 0)}</td>
                    <td className="px-3 py-3.5 text-right font-semibold tabular-nums">{formatMoney(o.totals.total)}</td>
                    <td className="whitespace-nowrap px-3 py-3.5">
                      <span className="mr-2 text-muted">{paymentMethodLabel[o.payment.method]}</span>
                      <PaymentBadge status={o.payment.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
        {filtered.length > limit &&
        <div className="border-t border-line p-4 text-center">
            <button type="button" onClick={() => setLimit((l) => l + 40)} className="h-10 rounded-full px-5 text-sm font-semibold ring-1 ring-line hover:bg-cream">
              Show more ({filtered.length - limit} remaining)
            </button>
          </div>
        }
      </section>

      <OrderDetailPanel order={selected} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>);

}