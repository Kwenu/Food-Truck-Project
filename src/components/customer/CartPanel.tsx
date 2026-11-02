import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBagIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { useCartTotals } from '../../hooks/useCartTotals';
import { CartLineItem } from './CartLineItem';
import { OrderTotals } from './OrderTotals';

export function CartPanel() {
  const { lines, orderType, tableNumber, promoCode } = useCart();
  const { settings } = useStore();
  const { totals, prepMinutes } = useCartTotals();

  return (
    <section aria-label="Your order" className="flex max-h-[calc(100vh-7rem)] flex-col rounded-3xl bg-surface ring-1 ring-line">
      <div className="border-b border-line px-5 py-4">
        <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Your order</h2>
        <p className="mt-0.5 text-sm text-muted">
          {orderType === 'dine-in' ? `Dine-in · Table ${tableNumber}` : `Takeaway · ready in ~${prepMinutes} min`}
        </p>
      </div>
      {lines.length === 0 ?
      <div className="flex flex-col items-center px-6 py-10 text-center">
          <ShoppingBagIcon size={28} className="text-muted" />
          <p className="mt-3 text-sm font-semibold">Your cart is empty</p>
          <p className="mt-1 text-xs text-muted">Tap + on any dish to add it.</p>
        </div> :

      <>
          <div className="flex-1 divide-y divide-line overflow-y-auto px-5">
            {lines.map((l) =>
          <CartLineItem key={l.lineId} line={l} compact />
          )}
          </div>
          <div className="space-y-4 border-t border-line px-5 py-4">
            <OrderTotals totals={totals} promoCode={promoCode} taxRate={settings.taxRate} />
            <Link
            to="/cart"
            className="flex h-14 w-full items-center justify-center rounded-full bg-brand font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
            
              Review &amp; checkout
            </Link>
          </div>
        </>
      }
    </section>);

}