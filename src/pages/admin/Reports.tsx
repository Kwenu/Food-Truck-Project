import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BarChart3Icon, DownloadIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../contexts/StoreContext';
import { useBrandColor } from '../../hooks/useBrandColor';
import { formatMoney } from '../../utils/currency';
import { ordersInBuckets, popularItems, revenueOrders, salesBuckets, sumSales, typeSplit, type ReportPeriod } from '../../utils/analytics';
import { downloadCsv } from '../../utils/csv';
import { paymentMethodLabel } from '../../utils/orderStatus';
import { formatDateTime } from '../../utils/time';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { EmptyState } from '../../components/shared/EmptyState';
import { StatusBadge } from '../../components/shared/StatusBadge';

const periodLabels: Record<ReportPeriod, string> = { daily: 'Daily · last 14 days', weekly: 'Weekly · last 8 weeks', monthly: 'Monthly · last 6 months' };
const DINE_COLOR = 'rgb(3,105,161)';

export function Reports() {
  const { orders } = useStore();
  const brand = useBrandColor();
  const [period, setPeriod] = useState<ReportPeriod>('daily');
  const [historyLimit, setHistoryLimit] = useState(25);

  const report = useMemo(() => {
    const buckets = salesBuckets(orders, period, new Date());
    const inRange = ordersInBuckets(orders, buckets);
    const valid = revenueOrders(inRange);
    const revenue = sumSales(inRange);
    return {
      buckets,
      inRange,
      revenue,
      count: valid.length,
      avg: valid.length ? revenue / valid.length : 0,
      rejected: inRange.length - valid.length,
      split: typeSplit(inRange),
      top: popularItems(inRange, 8)
    };
  }, [orders, period]);

  const exportSummary = () => {
    downloadCsv(`sales-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
    ['Period', 'Orders', 'Takeaway sales', 'Dine-in sales', 'Total sales'],
    ...report.buckets.map((b) => [b.label, b.orders, b.takeaway.toFixed(2), b.dineIn.toFixed(2), b.total.toFixed(2)])]
    );
    toast.success('Sales summary exported');
  };

  const exportOrders = () => {
    downloadCsv(`orders-${period}-${format(new Date(), 'yyyy-MM-dd')}.csv`, [
    ['Order', 'Date', 'Type', 'Table', 'Customer', 'Phone', 'Items', 'Subtotal', 'Discount', 'Tax', 'Charges', 'Total', 'Payment method', 'Payment status', 'Status'],
    ...report.inRange.map((o) => [
    o.number,
    o.createdAt,
    o.type,
    o.tableNumber ?? '',
    o.customer.name,
    o.customer.phone,
    o.lines.map((l) => `${l.quantity}x ${l.name}`).join('; '),
    o.totals.subtotal.toFixed(2),
    o.totals.discount.toFixed(2),
    o.totals.tax.toFixed(2),
    o.totals.charges.toFixed(2),
    o.totals.total.toFixed(2),
    o.payment.method,
    o.payment.status,
    o.status]
    )]
    );
    toast.success(`${report.inRange.length} orders exported`);
  };

  const splitTotal = report.split.takeaway.sales + report.split.dineIn.sales;
  const topRevenue = report.top.reduce((s, t) => s + t.revenue, 0);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminPageHeader
        title="Reports"
        description={periodLabels[period]}
        actions={
        <>
            <button type="button" onClick={exportSummary} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-line hover:bg-surface">
              <DownloadIcon size={16} /> Sales CSV
            </button>
            <button type="button" onClick={exportOrders} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white">
              <DownloadIcon size={16} /> Orders CSV
            </button>
          </>
        } />
      

      <div role="tablist" aria-label="Report period" className="inline-flex rounded-full bg-surface p-1 ring-1 ring-line">
        {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) =>
        <button
          key={p}
          type="button"
          role="tab"
          aria-selected={period === p}
          onClick={() => setPeriod(p)}
          className={`h-9 rounded-full px-5 text-sm font-semibold capitalize transition-colors duration-150 ${period === p ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
          
            {p}
          </button>
        )}
      </div>

      {report.inRange.length === 0 ?
      <div className="rounded-3xl bg-surface ring-1 ring-line">
          <EmptyState icon={BarChart3Icon} title="No sales in this range" body="Orders will show up here as soon as they come in." />
        </div> :

      <>
          <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              <div>
                <p className="text-sm text-muted">Revenue</p>
                <p className="font-display text-5xl font-black leading-none tracking-tight">{formatMoney(report.revenue)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Orders</p>
                <p className="font-display text-3xl font-extrabold">{report.count}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Avg. order</p>
                <p className="font-display text-3xl font-extrabold">{formatMoney(report.avg)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Rejected</p>
                <p className="font-display text-3xl font-extrabold">{report.rejected}</p>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.buckets} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgb(231,220,203)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgb(107,96,86)' }} interval="preserveStartEnd" />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: 'rgb(107,96,86)' }} tickFormatter={(v: number) => `$${v}`} />
                  <Tooltip
                  cursor={{ fill: 'rgba(28,25,23,0.04)' }}
                  formatter={(v: number, name: string) => [formatMoney(v), name]}
                  contentStyle={{ borderRadius: 12, border: '1px solid rgb(231,220,203)', fontSize: 13 }} />
                
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="takeaway" name="Takeaway" stackId="s" fill={brand} />
                  <Bar dataKey="dineIn" name="Dine-in" stackId="s" fill={DINE_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Takeaway vs dine-in</h2>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full">
                <div style={{ width: `${splitTotal ? report.split.takeaway.sales / splitTotal * 100 : 50}%`, backgroundColor: brand }} />
                <div className="flex-1" style={{ backgroundColor: DINE_COLOR }} />
              </div>
              <table className="mt-5 w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-2 font-semibold" />
                    <th className="pb-2 text-right font-semibold">Orders</th>
                    <th className="pb-2 text-right font-semibold">Sales</th>
                    <th className="pb-2 text-right font-semibold">Avg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {[
                { label: 'Takeaway', color: brand, ...report.split.takeaway },
                { label: 'Dine-in', color: DINE_COLOR, ...report.split.dineIn }].
                map((r) =>
                <tr key={r.label}>
                      <td className="py-2.5 font-semibold">
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                        {r.label}
                      </td>
                      <td className="py-2.5 text-right tabular-nums">{r.count}</td>
                      <td className="py-2.5 text-right font-semibold tabular-nums">{formatMoney(r.sales)}</td>
                      <td className="py-2.5 text-right tabular-nums">{formatMoney(r.count ? r.sales / r.count : 0)}</td>
                    </tr>
                )}
                </tbody>
              </table>
            </section>

            <section className="rounded-3xl bg-surface p-6 ring-1 ring-line">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Top products</h2>
              <table className="mt-4 w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="pb-2 font-semibold">Item</th>
                    <th className="pb-2 text-right font-semibold">Sold</th>
                    <th className="pb-2 text-right font-semibold">Revenue</th>
                    <th className="hidden pb-2 text-right font-semibold sm:table-cell">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.top.map((t, i) =>
                <tr key={t.itemId}>
                      <td className="py-2">
                        <span className="flex items-center gap-3">
                          <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
                          <img src={t.image} alt="" className="h-9 w-9 rounded-lg object-cover" />
                          <span className="font-semibold">{t.name}</span>
                        </span>
                      </td>
                      <td className="py-2 text-right tabular-nums">{t.quantity}</td>
                      <td className="py-2 text-right font-semibold tabular-nums">{formatMoney(t.revenue)}</td>
                      <td className="hidden py-2 text-right tabular-nums text-muted sm:table-cell">{topRevenue ? Math.round(t.revenue / topRevenue * 100) : 0}%</td>
                    </tr>
                )}
                </tbody>
              </table>
            </section>
          </div>

          <section className="overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Order history</h2>
              <span className="text-sm text-muted">{report.inRange.length} orders</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-y border-line bg-cream/50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-6 py-2.5 font-semibold">Order</th>
                    <th className="px-3 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Type</th>
                    <th className="px-3 py-2.5 font-semibold">Payment</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-6 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {report.inRange.slice(0, historyLimit).map((o) =>
                <tr key={o.id}>
                      <td className="px-6 py-3 font-semibold">{o.number}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-muted">{formatDateTime(o.createdAt)}</td>
                      <td className="px-3 py-3">{o.type === 'takeaway' ? 'Takeaway' : `Dine-in · T${o.tableNumber}`}</td>
                      <td className="px-3 py-3">{paymentMethodLabel[o.payment.method]}</td>
                      <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatMoney(o.totals.total)}</td>
                      <td className="px-6 py-3">
                        <StatusBadge status={o.status} />
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
            </div>
            {report.inRange.length > historyLimit &&
          <div className="border-t border-line p-4 text-center">
                <button type="button" onClick={() => setHistoryLimit((l) => l + 50)} className="h-10 rounded-full px-5 text-sm font-semibold ring-1 ring-line hover:bg-cream">
                  Show more
                </button>
              </div>
          }
          </section>
        </>
      }
    </div>);

}