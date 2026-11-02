import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownRightIcon, ArrowUpRightIcon, CheckCircle2Icon, MonitorIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../../types/order';
import { useStore } from '../../contexts/StoreContext';
import { useBrandColor } from '../../hooks/useBrandColor';
import { formatMoney } from '../../utils/currency';
import { ordersOnDay, popularItems, salesByHour, sumSales, typeSplit } from '../../utils/analytics';
import { isActiveStatus } from '../../utils/orderStatus';
import { formatClock } from '../../utils/time';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { OrderDetailPanel } from '../../components/admin/OrderDetailPanel';
import { StatusBadge } from '../../components/shared/StatusBadge';

export function Overview() {
  const { orders, updateOrderStatus } = useStore();
  const brand = useBrandColor();
  const [selected, setSelected] = useState<Order | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const data = useMemo(() => {
    const now = new Date();
    const today = ordersOnDay(orders, now);
    const yesterday = ordersOnDay(orders, subDays(now, 1));
    const sales = sumSales(today);
    const ySales = sumSales(yesterday);
    const validToday = today.filter((o) => o.status !== 'rejected');
    let popular = popularItems(today, 5);
    let popularLabel = 'Today';
    if (popular.length === 0) {
      popular = popularItems(orders.filter((o) => new Date(o.createdAt) > subDays(now, 7)), 5);
      popularLabel = 'Last 7 days';
    }
    return {
      today,
      sales,
      delta: ySales > 0 ? (sales - ySales) / ySales * 100 : null,
      count: validToday.length,
      avg: validToday.length ? sales / validToday.length : 0,
      pending: orders.filter((o) => o.status === 'received'),
      inProgress: orders.filter((o) => isActiveStatus(o.status)).length,
      completed: today.filter((o) => o.status === 'completed').length,
      split: typeSplit(today),
      hourly: salesByHour(today),
      popular,
      popularLabel
    };
  }, [orders]);

  const openOrder = (o: Order) => {
    setSelected(o);
    setPanelOpen(true);
  };
  const liveSelected = selected ? orders.find((o) => o.id === selected.id) ?? null : null;
  const splitTotal = data.split.takeaway.count + data.split.dineIn.count;
  const takeawayPct = splitTotal ? Math.round(data.split.takeaway.count / splitTotal * 100) : 0;
  const maxPopular = Math.max(1, ...data.popular.map((p) => p.quantity));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminPageHeader
        title="Today"
        description={format(new Date(), 'EEEE, MMMM d')}
        actions={
        <Link to="/kitchen" className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
            <MonitorIcon size={16} /> Open kitchen display
          </Link>
        } />
      

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-muted">Sales today</p>
              <p className="mt-1 font-display text-6xl font-black leading-none tracking-tight">{formatMoney(data.sales)}</p>
              {data.delta !== null &&
              <p className={`mt-2 inline-flex items-center gap-1 text-sm font-semibold ${data.delta >= 0 ? 'text-success' : 'text-danger'}`}>
                  {data.delta >= 0 ? <ArrowUpRightIcon size={16} /> : <ArrowDownRightIcon size={16} />}
                  {Math.abs(data.delta).toFixed(0)}% vs yesterday
                </p>
              }
            </div>
            <dl className="flex gap-8 text-sm">
              <div>
                <dt className="text-muted">Orders</dt>
                <dd className="font-display text-2xl font-extrabold">{data.count}</dd>
              </div>
              <div>
                <dt className="text-muted">Avg. order</dt>
                <dd className="font-display text-2xl font-extrabold">{formatMoney(data.avg)}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.hourly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="rgb(231,220,203)" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(107,96,86)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(107,96,86)' }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  cursor={{ fill: 'rgba(28,25,23,0.04)' }}
                  formatter={(v: number) => [formatMoney(v), 'Sales']}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgb(231,220,203)', fontSize: 13 }} />
                
                <Bar dataKey="sales" fill={brand} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="flex flex-col rounded-3xl bg-surface ring-1 ring-line">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Needs attention</h2>
            <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-bold text-brand-ink">{data.pending.length}</span>
          </div>
          {data.pending.length === 0 ?
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
              <CheckCircle2Icon size={28} className="text-success" />
              <p className="mt-2 font-semibold">All caught up</p>
              <p className="text-sm text-muted">New orders will appear here instantly.</p>
            </div> :

          <ul className="max-h-[340px] flex-1 divide-y divide-line overflow-y-auto">
              {data.pending.map((o) =>
            <li key={o.id} className="flex items-center gap-3 px-5 py-3">
                  <button type="button" onClick={() => openOrder(o)} className="min-w-0 flex-1 text-left">
                    <p className="font-semibold">
                      {o.number} <span className="font-normal text-muted">· {o.type === 'takeaway' ? 'Takeaway' : `Table ${o.tableNumber}`}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {formatClock(o.createdAt)} · {o.lines.reduce((s, l) => s + l.quantity, 0)} items · {formatMoney(o.totals.total)}
                    </p>
                  </button>
                  <button
                type="button"
                onClick={() => {
                  updateOrderStatus(o.id, 'confirmed');
                  toast.success(`${o.number} approved — sent to the kitchen`);
                }}
                className="h-9 rounded-full bg-brand px-4 text-sm font-semibold text-brand-ink">
                
                    Approve
                  </button>
                </li>
            )}
            </ul>
          }
        </section>
      </div>

      <section aria-label="Today at a glance" className="grid grid-cols-2 divide-line rounded-3xl bg-surface ring-1 ring-line md:grid-cols-4 md:divide-x">
        {[
        { label: 'Orders today', value: data.count },
        { label: 'In progress', value: data.inProgress },
        { label: 'Completed', value: data.completed }].
        map((s) =>
        <div key={s.label} className="p-5">
            <p className="text-sm text-muted">{s.label}</p>
            <p className="mt-1 font-display text-3xl font-extrabold">{s.value}</p>
          </div>
        )}
        <div className="col-span-2 border-t border-line p-5 md:col-span-1 md:border-t-0">
          <p className="text-sm text-muted">Takeaway vs dine-in</p>
          <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-info/20">
            <div className="bg-brand" style={{ width: `${takeawayPct}%` }} />
          </div>
          <div className="mt-2 flex justify-between text-xs font-semibold">
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-brand" />
              {data.split.takeaway.count} takeaway
            </span>
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full bg-info/40" />
              {data.split.dineIn.count} dine-in
            </span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Popular items</h2>
            <span className="text-xs text-muted">{data.popularLabel}</span>
          </div>
          <ol className="mt-4 space-y-4">
            {data.popular.map((p, i) =>
            <li key={p.itemId} className="flex items-center gap-3">
                <span className="w-4 text-sm font-bold text-muted">{i + 1}</span>
                <img src={p.image} alt="" className="h-11 w-11 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="truncate font-semibold">{p.name}</span>
                    <span className="shrink-0 text-muted">{p.quantity} sold</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-cream">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${p.quantity / maxPopular * 100}%` }} />
                  </div>
                </div>
              </li>
            )}
          </ol>
        </section>

        <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Recent orders</h2>
            <Link to="/admin/orders" className="text-sm font-semibold text-brand-strong hover:underline">
              View all
            </Link>
          </div>
          <ul className="mt-3 divide-y divide-line">
            {data.today.slice(0, 6).map((o) =>
            <li key={o.id}>
                <button type="button" onClick={() => openOrder(o)} className="flex w-full items-center gap-3 py-3 text-left text-sm">
                  <span className="w-16 font-semibold">{o.number}</span>
                  <span className="w-16 text-muted">{formatClock(o.createdAt)}</span>
                  <span className="hidden flex-1 truncate text-muted sm:block">{o.type === 'takeaway' ? o.customer.name || 'Takeaway' : `Table ${o.tableNumber}`}</span>
                  <span className="ml-auto tabular-nums">{formatMoney(o.totals.total)}</span>
                  <StatusBadge status={o.status} />
                </button>
              </li>
            )}
          </ul>
        </section>
      </div>

      <OrderDetailPanel order={liveSelected} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>);

}