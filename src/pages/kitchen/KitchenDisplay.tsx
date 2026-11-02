import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { AlertTriangleIcon, ChefHatIcon, LayoutDashboardIcon, Loader2Icon, LogOutIcon, Volume2Icon, VolumeXIcon, WifiOffIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { OrderStatus, OrderType } from '../../types/order';
import { useStore } from '../../contexts/StoreContext';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { useNow } from '../../hooks/useNow';
import { useNewOrderChime } from '../../hooks/useNewOrderChime';
import { isKitchenStatus, kitchenStart, nextStatus, statusLabel } from '../../utils/orderStatus';
import { Logo } from '../../components/shared/Logo';
import { KitchenTicket } from '../../components/kitchen/KitchenTicket';

type Filter = 'all' | OrderType;

const columns: {key: string;title: string;statuses: OrderStatus[];empty: string;}[] = [
{ key: 'new', title: 'To cook', statuses: ['confirmed'], empty: 'No approved orders waiting' },
{ key: 'preparing', title: 'Preparing', statuses: ['preparing'], empty: 'Nothing on the grill' },
{ key: 'ready', title: 'Ready', statuses: ['ready'], empty: 'Nothing waiting' }];


export function KitchenDisplay() {
  const { orders, ordersReady, connection, settings, updateOrderStatus, rejectOrder } = useStore();
  const { user, logout } = useStaffAuth();
  const canOpenAdmin = user?.role === 'admin' || user?.role === 'manager';
  const now = useNow(1000);
  const [filter, setFilter] = useState<Filter>('all');
  // Mute is per device (this tablet), saved in the browser; admins can also switch the chime off for everyone in Settings.
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem('ember-wheel:kitchen-muted') === '1';
    } catch {
      return false;
    }
  });
  const chimeOn = settings.chimeEnabled && !muted;
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem('ember-wheel:kitchen-muted', next ? '1' : '0');
    } catch {

      // storage unavailable
    }};
  useNewOrderChime(orders, chimeOn, ordersReady, 'confirmed');

  const active = useMemo(
    () => orders.filter((o) => isKitchenStatus(o.status)).sort((a, b) => kitchenStart(a).localeCompare(kitchenStart(b))),
    [orders]
  );
  const filtered = filter === 'all' ? active : active.filter((o) => o.type === filter);
  const delayedCount = active.filter(
    (o) => o.status !== 'ready' && o.pickup?.mode !== 'scheduled' && now - new Date(kitchenStart(o)).getTime() > o.prepMinutes * 60000
  ).length;

  const counts: Record<Filter, number> = {
    all: active.length,
    takeaway: active.filter((o) => o.type === 'takeaway').length,
    'dine-in': active.filter((o) => o.type === 'dine-in').length
  };

  const advance = (id: string) => {
    const order = orders.find((o) => o.id === id);
    if (!order) return;
    if (order.status !== 'confirmed' && order.status !== 'preparing') return;
    const next = nextStatus(order.status);
    if (!next) return;
    updateOrderStatus(id, next);
    toast.success(`${order.number} · ${statusLabel(next, order.type)}`);
  };

  return (
    <div className="min-h-screen w-full bg-night text-white">
      <header className="sticky top-0 z-20 border-b border-night-line bg-night/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <Link to="/" aria-label="Customer app">
            <Logo size="sm" tone="light" />
          </Link>
          <span className="hidden items-center gap-1.5 rounded-full bg-night-raised px-3 py-1 text-xs font-bold uppercase tracking-wide text-night-muted sm:inline-flex">
            <ChefHatIcon size={14} /> Kitchen
          </span>

          <div role="tablist" aria-label="Filter orders" className="order-last flex w-full rounded-xl bg-night-raised p-1 md:order-none md:ml-6 md:w-auto">
            {(['all', 'takeaway', 'dine-in'] as Filter[]).map((f) =>
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors duration-150 md:flex-none ${
              filter === f ? 'bg-white text-ink' : 'text-night-muted hover:text-white'}`
              }>
              
                {f === 'all' ? 'All' : f === 'takeaway' ? 'Takeaway' : 'Dine-in'}
                <span className={`rounded-md px-1.5 text-xs tabular-nums ${filter === f ? 'bg-ink/10' : 'bg-night-line'}`}>{counts[f]}</span>
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {delayedCount > 0 &&
            <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-danger px-3 text-sm font-bold">
                <AlertTriangleIcon size={16} /> {delayedCount} delayed
              </span>
            }
            <span className="hidden font-mono text-lg font-bold tabular-nums sm:inline">{format(now, 'h:mm a')}</span>
            <button
              type="button"
              onClick={toggleMute}
              aria-label={chimeOn ? 'Mute new order chime' : 'Unmute new order chime'}
              aria-pressed={chimeOn}
              className="grid h-10 w-10 place-items-center rounded-xl bg-night-raised text-night-muted transition-colors duration-150 hover:text-white">
              
              {chimeOn ? <Volume2Icon size={18} /> : <VolumeXIcon size={18} />}
            </button>
            {canOpenAdmin &&
            <Link
              to="/admin"
              aria-label="Admin dashboard"
              className="grid h-10 w-10 place-items-center rounded-xl bg-night-raised text-night-muted transition-colors duration-150 hover:text-white">
              
                <LayoutDashboardIcon size={18} />
              </Link>
            }
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Sign out"
              title={user ? `Sign out ${user.name}` : 'Sign out'}
              className="grid h-10 w-10 place-items-center rounded-xl bg-night-raised text-night-muted transition-colors duration-150 hover:text-white">
              
              <LogOutIcon size={18} />
            </button>
          </div>
        </div>
      </header>
      {connection === 'offline' &&
      <div role="alert" className="flex items-center gap-2 bg-danger px-4 py-2 text-sm font-semibold text-white md:px-6">
          <WifiOffIcon size={16} /> Connection lost — reconnecting. New orders may be delayed.
        </div>
      }
      {!ordersReady && connection !== 'offline' &&
      <div role="status" className="flex items-center gap-2 bg-night-raised px-4 py-2 text-sm text-night-muted md:px-6">
          <Loader2Icon size={16} className="animate-spin" /> Loading orders…
        </div>
      }

      <main className="no-scrollbar flex gap-4 overflow-x-auto p-4 md:p-6 lg:grid lg:grid-cols-3 lg:overflow-visible">
        {columns.map((col) => {
          const items = filtered.filter((o) => col.statuses.includes(o.status));
          return (
            <section key={col.key} aria-labelledby={`col-${col.key}`} className="flex min-w-[300px] flex-1 flex-col sm:min-w-[340px] lg:min-w-0">
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 id={`col-${col.key}`} className="font-display text-2xl font-black uppercase tracking-tight">
                  {col.title}
                </h2>
                <span className="rounded-lg bg-night-raised px-2.5 py-1 font-mono text-sm font-bold tabular-nums">{items.length}</span>
              </div>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {items.map((o) =>
                  <KitchenTicket
                    key={o.id}
                    order={o}
                    now={now}
                    onAdvance={() => advance(o.id)}
                    onReject={(reason) => {
                      rejectOrder(o.id, reason);
                      toast(`${o.number} rejected`);
                    }} />

                  )}
                </AnimatePresence>
                {items.length === 0 &&
                <div className="grid h-32 place-items-center rounded-2xl border-2 border-dashed border-night-line text-sm text-night-muted">{col.empty}</div>
                }
              </div>
            </section>);

        })}
      </main>
    </div>);

}