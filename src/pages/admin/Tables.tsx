import React, { useState } from 'react';
import { PlusIcon, QrCodeIcon, Trash2Icon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { DiningTable } from '../../types/table';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../utils/currency';
import { isActiveStatus } from '../../utils/orderStatus';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { TableQrModal } from '../../components/admin/TableQrModal';
import { AllQrPdfButton } from '../../components/admin/AllQrPdfButton';
import { CounterQrModal } from '../../components/admin/CounterQrModal';
import { OrderDetailPanel } from '../../components/admin/OrderDetailPanel';
import { StatusBadge } from '../../components/shared/StatusBadge';

export function Tables() {
  const { tables, orders, addTable, removeTable, setTableStatus } = useStore();
  const [seats, setSeats] = useState(4);
  const [qrTable, setQrTable] = useState<DiningTable | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const sorted = [...tables].sort((a, b) => a.number - b.number);
  const activeFor = (n: number) => orders.filter((o) => o.type === 'dine-in' && o.tableNumber === n && isActiveStatus(o.status));
  const orderingCount = sorted.filter((t) => activeFor(t.number).length > 0).length;
  const occupiedCount = sorted.filter((t) => t.status === 'occupied').length;

  const summary = [
  { label: 'Available', value: sorted.length - occupiedCount, dot: 'bg-success' },
  { label: 'Occupied', value: occupiedCount, dot: 'bg-warning' },
  { label: 'With live orders', value: orderingCount, dot: 'bg-brand' }];


  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminPageHeader
        title="Tables & QR"
        description="Each table has its own QR code that opens the dine-in menu with the table pre-selected."
        actions={
        <div className="flex items-center gap-2">
            <label htmlFor="new-seats" className="sr-only">
              Seats
            </label>
            <select
            id="new-seats"
            value={seats}
            onChange={(e) => setSeats(parseInt(e.target.value, 10))}
            className="h-11 rounded-full border border-line bg-surface px-4 text-sm font-medium outline-none focus:border-brand">
            
              {[2, 4, 6, 8].map((s) =>
            <option key={s} value={s}>
                  {s} seats
                </option>
            )}
            </select>
            <button
            type="button"
            onClick={() => {
              addTable(seats);
              toast.success('Table added');
            }}
            className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink">
            
              <PlusIcon size={18} /> Add table
            </button>
          </div>
        } />
      

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface p-5 ring-1 ring-line">
        <div>
          <p className="font-semibold">Cashier / counter QR</p>
          <p className="text-sm text-muted">One code for the counter. Customers choose dine-in or takeaway after scanning. The PDF includes the counter and every table.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AllQrPdfButton />
          <button type="button" onClick={() => setCounterOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white">
            <QrCodeIcon size={18} /> View counter QR
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        {summary.map((s) =>
        <p key={s.label} className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} aria-hidden="true" />
            <span className="font-display text-2xl font-extrabold">{s.value}</span>
            <span className="text-muted">{s.label}</span>
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sorted.map((t) => {
          const active = activeFor(t.number);
          const state = active.length > 0 ? 'ordering' : t.status;
          const stateStyle =
          state === 'ordering' ? 'bg-brand/10 text-brand-strong' : state === 'occupied' ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success';
          const stateLabel = state === 'ordering' ? 'Live order' : state === 'occupied' ? 'Occupied' : 'Available';
          return (
            <article key={t.id} className="flex flex-col rounded-3xl bg-surface p-5 ring-1 ring-line">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-4xl font-black leading-none">T{t.number}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted">
                    <UsersIcon size={12} /> {t.seats} seats · {t.code}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${stateStyle}`}>{stateLabel}</span>
              </div>

              <div className="mt-4 min-h-[56px] flex-1">
                {active.length === 0 ?
                <p className="text-sm text-muted">No active orders</p> :

                <ul className="space-y-1.5">
                    {active.map((o) =>
                  <li key={o.id}>
                        <button
                      type="button"
                      onClick={() => {
                        setOrderId(o.id);
                        setPanelOpen(true);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl bg-cream/60 px-3 py-2 text-left text-sm hover:bg-cream">
                      
                          <span className="font-semibold">{o.number}</span>
                          <span className="text-muted">{formatMoney(o.totals.total)}</span>
                          <span className="ml-auto">
                            <StatusBadge status={o.status} />
                          </span>
                        </button>
                      </li>
                  )}
                  </ul>
                }
              </div>

              <div className="mt-4 flex gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const next = t.status === 'occupied' ? 'available' : 'occupied';
                    setTableStatus(t.id, next);
                    toast(`Table ${t.number} marked ${next}`);
                  }}
                  className="h-10 flex-1 whitespace-nowrap rounded-full px-3 text-sm font-semibold ring-1 ring-line transition-colors duration-150 hover:bg-cream">
                  
                  {t.status === 'occupied' ? 'Mark available' : 'Mark occupied'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQrTable(t);
                    setQrOpen(true);
                  }}
                  aria-label={`QR code for table ${t.number}`}
                  className="grid h-10 w-10 place-items-center rounded-full bg-ink text-white">
                  
                  <QrCodeIcon size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeTable(t.id);
                    toast(`Table ${t.number} removed`);
                  }}
                  disabled={active.length > 0}
                  title={active.length > 0 ? 'Finish active orders first' : 'Remove table'}
                  aria-label={`Remove table ${t.number}`}
                  className="grid h-10 w-10 place-items-center rounded-full text-muted ring-1 ring-line hover:text-danger disabled:cursor-not-allowed disabled:opacity-30">
                  
                  <Trash2Icon size={16} />
                </button>
              </div>
            </article>);

        })}
      </div>

      <CounterQrModal open={counterOpen} onClose={() => setCounterOpen(false)} />
      <TableQrModal table={qrTable} open={qrOpen} onClose={() => setQrOpen(false)} />
      <OrderDetailPanel order={orderId ? orders.find((o) => o.id === orderId) ?? null : null} open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>);

}