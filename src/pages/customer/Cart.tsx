import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ClockIcon, PlusIcon, ShoppingBagIcon, TagIcon, XIcon } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { useCartTotals } from '../../hooks/useCartTotals';
import { useTableHold } from '../../hooks/useTableHold';
import { useMoney } from '../../contexts/CurrencyContext';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CartLineItem } from '../../components/customer/CartLineItem';
import { OrderTotals } from '../../components/customer/OrderTotals';
import { EmptyState } from '../../components/shared/EmptyState';

export function Cart() {
  const { formatMoney } = useMoney();
  const navigate = useNavigate();
  const { lines, note, setNote, promoCode, setPromoCode, orderType, tableNumber } = useCart();
  useTableHold();
  const { promotions, settings } = useStore();
  const { totals, promo, promoApplied, prepMinutes } = useCartTotals();
  const [codeInput, setCodeInput] = useState('');
  const [promoError, setPromoError] = useState('');

  const applyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const found = promotions.find((p) => p.code === code);
    if (!found || !found.active) {
      setPromoError('That code isn’t valid right now.');
      return;
    }
    setPromoError('');
    setPromoCode(found.code);
    setCodeInput('');
  };

  return (
    <div className="customer-bg min-h-screen w-full pb-12">
      <CustomerHeader backTo="/menu" showCart={false} />
      <main className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 xl:px-12">
        <h1 className="text-gradient w-fit font-display text-5xl font-black uppercase leading-none tracking-tight md:text-6xl">Your order</h1>
        <p className="mt-1.5 text-sm text-muted">
          {orderType === 'dine-in' ? `Dine-in · Table ${tableNumber}` : 'Takeaway'}
        </p>

        {lines.length === 0 ?
        <div className="mt-8 rounded-3xl bg-surface shadow-lg shadow-ink/5 ring-1 ring-line/60">
            <EmptyState
            icon={ShoppingBagIcon}
            title="Your cart is empty"
            body="Burgers, pizza, bowls and more are waiting for you."
            action={
            <Link to={orderType ? '/menu' : '/'} className="inline-flex h-12 items-center rounded-full gradient-brand px-6 font-semibold text-white">
                  Browse the menu
                </Link>
            } />
          
          </div> :

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
            <div className="space-y-6">
              <section aria-label="Items" className="rounded-3xl bg-surface px-4 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:px-6">
                <div className="divide-y divide-line">
                  {lines.map((l) =>
                <CartLineItem key={l.lineId} line={l} />
                )}
                </div>
                <Link
                to="/menu"
                className="flex h-14 items-center gap-2 border-t border-line text-sm font-semibold text-brand-strong hover:underline">
                
                  <PlusIcon size={18} /> Add more items
                </Link>
              </section>

              <section className="rounded-3xl bg-surface p-4 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
                <label htmlFor="order-note" className="font-semibold">
                  Note for the kitchen
                </label>
                <p className="text-sm text-muted">Allergies, cutlery, anything we should know.</p>
                <textarea
                id="order-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={240}
                placeholder="e.g. Nut allergy — please take care"
                className="mt-3 w-full resize-none rounded-2xl border border-line bg-cream/50 px-4 py-3 text-sm outline-none transition-colors duration-150 focus:border-brand" />
              
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-24">
              <section className="rounded-3xl bg-surface p-5 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
                <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Summary</h2>

                <div className="mt-4">
                  {promoCode ?
                <div className={`flex items-center gap-3 rounded-2xl p-3 ${promoApplied ? 'bg-success/10' : 'bg-warning/10'}`}>
                      <TagIcon size={18} className={promoApplied ? 'text-success' : 'text-warning'} />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-semibold">{promoCode}</p>
                        <p className="text-xs text-muted">
                          {promoApplied ?
                      promo?.title :
                      promo ?
                      `Add ${formatMoney(promo.minSubtotal - totals.subtotal)} more to unlock` :
                      'No longer available'}
                        </p>
                      </div>
                      <button type="button" onClick={() => setPromoCode(null)} aria-label="Remove promo code" className="grid h-8 w-8 place-items-center rounded-full hover:bg-surface">
                        <XIcon size={16} />
                      </button>
                    </div> :

                <form onSubmit={applyPromo} className="flex gap-2">
                      <input
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Promo code"
                    aria-label="Promo code"
                    className="h-11 min-w-0 flex-1 rounded-full border border-line bg-cream/50 px-4 text-sm uppercase outline-none placeholder:normal-case focus:border-brand" />
                  
                      <button type="submit" className="h-11 rounded-full gradient-night px-5 text-sm font-semibold text-white">
                        Apply
                      </button>
                    </form>
                }
                  {promoError && <p className="mt-2 text-xs font-medium text-danger">{promoError}</p>}
                </div>

                <div className="mt-5">
                  <OrderTotals totals={totals} promoCode={promoApplied ? promoCode : null} taxRate={settings.taxRate} />
                </div>

                <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <ClockIcon size={16} /> Estimated prep time ~{prepMinutes} min
                </p>

                <button
                type="button"
                onClick={() => navigate('/checkout')}
                disabled={!settings.isOpen}
                className="mt-5 flex h-14 w-full items-center justify-between rounded-full gradient-brand px-6 font-semibold text-white transition-colors duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
                
                  <span>{settings.isOpen ? 'Checkout' : 'Ordering paused'}</span>
                  <span className="font-display text-lg font-extrabold">{formatMoney(totals.total)}</span>
                </button>
              </section>
            </aside>
          </div>
        }
      </main>
    </div>);

}