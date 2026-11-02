import { useCallback, useEffect, useState } from 'react';
import type { Order } from '../types/order';
import { fetchOrdersByNumber } from '../lib/db';

const POLL_MS = 5000;

/**
 * Follows one order by its number. Customers can't read the orders table directly,
 * so this asks the server's get_orders() function every few seconds until the
 * order is finished (completed or rejected).
 */
export function useTrackedOrder(number: string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [found] = await fetchOrdersByNumber([number]);
      setOrder(found ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the order.');
    } finally {
      setLoading(false);
    }
  }, [number]);

  useEffect(() => {
    setLoading(true);
    setOrder(null);
    void load();
  }, [load]);

  const finished = order?.status === 'completed' || order?.status === 'rejected';

  useEffect(() => {
    if (finished) return;
    const tick = () => {
      if (document.visibilityState === 'visible') void load();
    };
    const id = window.setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [finished, load]);

  return { order, loading, error };
}
