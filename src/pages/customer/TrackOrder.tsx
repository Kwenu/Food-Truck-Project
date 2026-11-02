import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRightIcon, SearchIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import type { Order } from '../../types/order';
import { fetchOrdersByNumber } from '../../lib/db';
import { formatClock } from '../../utils/time';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { StatusBadge } from '../../components/shared/StatusBadge';

export function TrackOrder() {
  const navigate = useNavigate();
  const { myOrders } = useCart();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<Order[]>([]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    try {
      const [order] = await fetchOrdersByNumber([value]);
      if (!order) {
        setError(`No order found for “${value.trim()}”. Order numbers look like EW-1047.`);
        return;
      }
      navigate(`/order/${order.number}`);
    } catch {
      setError('We couldn’t check that right now. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  // Orders placed from this device
  useEffect(() => {
    if (myOrders.length === 0) return;
    let cancelled = false;
    fetchOrdersByNumber(myOrders).
    then((found) => {
      if (!cancelled) setRecent(found);
    }).
    catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [myOrders]);

  return (
    <div className="min-h-screen w-full bg-cream">
      <CustomerHeader backTo="/" showCart={false} showMode={false} />
      <main className="mx-auto max-w-xl px-4 py-10 md:py-16">
        <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">Track your order</h1>
        <p className="mt-2 text-muted">Enter the order number from your confirmation or receipt.</p>
        <form onSubmit={submit} className="mt-6">
          <label htmlFor="order-number" className="sr-only">
            Order number
          </label>
          <div className="flex gap-2">
            <input
              id="order-number"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              placeholder="EW-1047"
              autoFocus
              className={`h-14 min-w-0 flex-1 rounded-full border bg-surface px-5 font-display text-xl font-bold uppercase tracking-wide outline-none transition-colors duration-150 placeholder:text-ink/25 focus:border-brand ${
              error ? 'border-danger' : 'border-line'}`
              } />
            
            <button type="submit" disabled={!value.trim() || searching} className="flex h-14 items-center gap-2 rounded-full bg-brand px-6 font-semibold text-brand-ink disabled:opacity-50">
              <SearchIcon size={18} /> Track
            </button>
          </div>
          {error &&
          <p className="mt-2 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          }
        </form>

        {recent.length > 0 &&
        <section className="mt-10">
            <h2 className="text-sm font-bold text-muted">Your recent orders on this device</h2>
            <ul className="mt-3 divide-y divide-line rounded-3xl bg-surface ring-1 ring-line">
              {recent.map((o) =>
            <li key={o.id}>
                  <Link to={`/order/${o.number}`} className="flex h-16 items-center gap-3 px-5 transition-colors duration-150 hover:bg-cream/60">
                    <span className="font-display text-lg font-black">{o.number}</span>
                    <span className="text-sm text-muted">{formatClock(o.createdAt)}</span>
                    <span className="ml-auto">
                      <StatusBadge status={o.status} />
                    </span>
                    <ChevronRightIcon size={18} className="text-muted" />
                  </Link>
                </li>
            )}
            </ul>
          </section>
        }
      </main>
    </div>);

}