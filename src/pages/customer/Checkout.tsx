import React, { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AlertCircleIcon, Loader2Icon, UtensilsIcon } from 'lucide-react';
import type { PaymentMethod } from '../../types/order';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { useCartTotals } from '../../hooks/useCartTotals';
import { useTableHold } from '../../hooks/useTableHold';
import { useMoney } from '../../contexts/CurrencyContext';
import { pickupSlots } from '../../utils/time';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { OrderTotals } from '../../components/customer/OrderTotals';
import { PickupTimePicker } from '../../components/customer/PickupTimePicker';
import { PaymentMethodPicker } from '../../components/customer/PaymentMethodPicker';
import { VegMark } from '../../components/shared/VegMark';

export function Checkout() {
  const { formatMoney } = useMoney();
  const navigate = useNavigate();
  const cart = useCart();
  const { settings, placeOrder } = useStore();
  const { totals, promoApplied, prepMinutes } = useCartTotals();
  const isDineIn = cart.orderType === 'dine-in';
  useTableHold();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [pickupMode, setPickupMode] = useState<'asap' | 'scheduled'>('asap');
  const [slot, setSlot] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const slots = useMemo(() => pickupSlots(new Date(), prepMinutes, 8), [prepMinutes]);

  if (!cart.orderType) return <Navigate to="/" replace />;
  if (cart.lines.length === 0) return <Navigate to="/cart" replace />;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const digits = phone.replace(/\D/g, '');
    if (!isDineIn && name.trim().length < 2) e.customerName = 'Enter your name so we can call it out.';
    if (!isDineIn && digits.length !== 10) e.phone = 'Enter a 10-digit mobile number.';
    if (isDineIn && digits.length > 0 && digits.length !== 10) e.phone = 'Mobile number should be 10 digits.';
    if (!isDineIn && settings.scheduledPickup && pickupMode === 'scheduled' && !slot) e.slot = 'Pick a pickup time.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError('');
    if (!validate()) return;
    setSubmitting(true);
    const useScheduled = !isDineIn && settings.scheduledPickup && pickupMode === 'scheduled' && slot;
    try {
      // The server re-prices the order from the live menu. It then waits for the cashier to approve it.
      const order = await placeOrder({
        type: cart.orderType ?? 'takeaway',
        tableNumber: isDineIn ? cart.tableNumber : null,
        tableToken: isDineIn ? cart.tableToken : null,
        customer: { name: name.trim(), phone: phone.replace(/\D/g, '') },
        pickup: isDineIn ? null : useScheduled ? { mode: 'scheduled', at: slot } : { mode: 'asap', at: null },
        lines: cart.lines,
        note: cart.note.trim(),
        promoCode: promoApplied ? cart.promoCode : null,
        payment: { method }
      });
      cart.rememberOrder(order.number);
      cart.clearCart();
      navigate(`/order/${order.number}`, { replace: true, state: { justPlaced: true } });
    } catch (err) {
      setPaymentError(err instanceof Error && err.message ? err.message : 'We couldn’t place your order. Please try again.');
      setSubmitting(false);
    }
  };

  const field = (id: string, label: string, value: string, onChange: (v: string) => void, props: React.InputHTMLAttributes<HTMLInputElement>, optional = false) =>
  <div>
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={!!errors[id]}
      className={`mt-1.5 h-12 w-full rounded-xl border bg-surface px-4 outline-none transition-colors duration-150 focus:border-brand ${
      errors[id] ? 'border-danger' : 'border-line'}`
      }
      {...props} />
    
      {errors[id] && <p className="mt-1 text-xs font-medium text-danger">{errors[id]}</p>}
    </div>;


  const sectionTitle = 'font-display text-2xl font-extrabold uppercase tracking-tight';

  return (
    <div className="customer-bg min-h-screen w-full pb-12">
      <CustomerHeader backTo="/cart" showCart={false} />
      <main className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 xl:px-12">
        <h1 className="text-gradient w-fit font-display text-5xl font-black uppercase leading-none tracking-tight md:text-6xl">Checkout</h1>

        <form onSubmit={submit} noValidate className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
          <div className="space-y-6">
            <section className="rounded-3xl bg-surface p-5 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
              <h2 className={sectionTitle}>{isDineIn ? 'Your table' : 'Pickup'}</h2>
              <div className="mt-4">
                {isDineIn ?
                <div className="flex items-center gap-4 rounded-2xl bg-cream p-4">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-cool font-display text-2xl font-black text-white shadow-lg shadow-ink/10">{cart.tableNumber}</span>
                    <div className="flex-1">
                      <p className="font-semibold">Table {cart.tableNumber}</p>
                      <p className="text-sm text-muted">We’ll serve your food here in ~{prepMinutes} min.</p>
                    </div>
                    <Link to="/dine-in" className="text-sm font-semibold text-brand-strong hover:underline">
                      Change
                    </Link>
                  </div> :

                <PickupTimePicker
                  mode={pickupMode}
                  onModeChange={setPickupMode}
                  slot={slot}
                  onSlotChange={setSlot}
                  slots={slots}
                  prepMinutes={prepMinutes}
                  schedulingEnabled={settings.scheduledPickup}
                  error={errors.slot} />

                }
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
              <h2 className={sectionTitle}>Your details</h2>
              <p className="mt-1 text-sm text-muted">{isDineIn ? 'Optional — your name helps us find your order.' : 'So we can call your name when your order is ready.'}</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {field('customerName', 'Name', name, setName, { autoComplete: 'name', placeholder: 'Maya Chen' }, isDineIn)}
                {field('phone', 'Mobile number', phone, (v) => setPhone(v.replace(/[^\d\s-]/g, '').slice(0, 14)), { autoComplete: 'tel', inputMode: 'tel', placeholder: '555 123 4567' }, isDineIn)}
              </div>
            </section>

            <section className="rounded-3xl bg-surface p-5 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
              <h2 className={sectionTitle}>Payment · at the cashier</h2>
              <div className="mt-4">
                <PaymentMethodPicker method={method} onMethodChange={setMethod} />
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <section className="rounded-3xl bg-surface p-5 shadow-lg shadow-ink/5 ring-1 ring-line/60 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-extrabold uppercase tracking-tight">Order summary</h2>
                <Link to="/cart" className="text-sm font-semibold text-brand-strong hover:underline">
                  Edit
                </Link>
              </div>
              <ul className="mt-4 space-y-3">
                {cart.lines.map((l) =>
                <li key={l.lineId} className="flex gap-3 text-sm">
                    <span className="font-bold tabular-nums">{l.quantity}×</span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 font-medium">
                        <VegMark veg={l.veg} /> {l.name}
                      </p>
                      {l.addOns.length > 0 && <p className="text-xs text-muted">+ {l.addOns.join(', ')}</p>}
                      {l.note && <p className="text-xs italic text-muted">“{l.note}”</p>}
                    </div>
                    <span className="tabular-nums">{formatMoney(l.unitPrice * l.quantity)}</span>
                  </li>
                )}
              </ul>
              {cart.note &&
              <p className="mt-4 flex gap-2 rounded-xl bg-mustard/20 p-3 text-xs">
                  <UtensilsIcon size={14} className="mt-0.5 shrink-0" /> {cart.note}
                </p>
              }
              <div className="mt-5 border-t border-line pt-4">
                <OrderTotals totals={totals} promoCode={promoApplied ? cart.promoCode : null} taxRate={settings.taxRate} />
              </div>

              {paymentError &&
              <p className="mt-4 flex gap-2 rounded-xl bg-danger/10 p-3 text-sm font-medium text-danger" role="alert">
                  <AlertCircleIcon size={18} className="shrink-0" /> {paymentError}
                </p>
              }
              {Object.keys(errors).length > 0 &&
              <p className="mt-4 text-sm font-medium text-danger" role="alert">
                  Please fix the highlighted fields.
                </p>
              }

              <button
                type="submit"
                disabled={submitting || !settings.isOpen}
                className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full gradient-brand font-semibold text-white transition-colors duration-150 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60">
                
                {submitting ?
                <>
                    <Loader2Icon size={20} className="animate-spin" /> Placing order…
                  </> :
                !settings.isOpen ?
                'Ordering paused' :

                <>
                    Place order · <span className="font-display text-lg font-extrabold">{formatMoney(totals.total)}</span>
                  </>
                }
              </button>
            </section>
          </aside>
        </form>
      </main>
    </div>);

}