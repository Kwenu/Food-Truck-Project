import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCart } from '../contexts/CartContext';

const RENEW_MS = 3 * 60 * 1000;

/**
 * Dine-in only. While the customer is on the menu / cart / checkout, keep their table reserved
 * for them. If someone else got the table in the meantime, send them back to pick another one.
 */
export function useTableHold() {
  const { orderType, tableNumber, renewTable } = useCart();
  const navigate = useNavigate();
  const active = orderType === 'dine-in' && !!tableNumber;

  useEffect(() => {
    if (!active) return;
    let stopped = false;

    const renew = () => {
      if (document.visibilityState !== 'visible') return;
      renewTable().catch((e) => {
        if (stopped) return;
        const message = e instanceof Error ? e.message : '';
        // Only react to "table is taken" answers, not to a flaky connection
        if (/occupied|does not exist/i.test(message)) {
          toast.error(message);
          navigate('/dine-in', { replace: true });
        }
      });
    };

    renew();
    const id = window.setInterval(renew, RENEW_MS);
    document.addEventListener('visibilitychange', renew);
    return () => {
      stopped = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', renew);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, tableNumber]);
}
