import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeleteIcon, QrCodeIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { QrScanSheet } from '../../components/customer/QrScanSheet';

export function DineInSetup() {
  const navigate = useNavigate();
  const { tables } = useStore();
  const { startOrder, tableNumber } = useCart();
  const [entry, setEntry] = useState(tableNumber ? String(tableNumber) : '');
  const [error, setError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const sorted = [...tables].sort((a, b) => a.number - b.number);

  const go = (n: number) => {
    const table = tables.find((t) => t.number === n);
    if (!table) {
      setError(`There's no Table ${n}. Check the number on your table.`);
      return;
    }
    startOrder('dine-in', n);
    toast.success(`Ordering for Table ${n}`);
    navigate('/menu');
  };

  const press = (key: string) => {
    setError('');
    if (key === 'del') setEntry((e) => e.slice(0, -1));else
    if (key === 'clear') setEntry('');else
    setEntry((e) => e.length >= 2 ? e : (e + key).replace(/^0+/, ''));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'];

  return (
    <div className="min-h-screen w-full bg-cream">
      <CustomerHeader backTo="/" showCart={false} showMode={false} />
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
        <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">Which table are you at?</h1>
        <p className="mt-2 text-muted">Scan the code on your table, or enter the number printed on it.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-10">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="flex h-20 w-full items-center gap-4 rounded-3xl bg-ink px-5 text-left text-white transition-colors duration-150 hover:bg-ink/90">
              
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-ink">
                <QrCodeIcon size={24} />
              </span>
              <span>
                <span className="block text-lg font-semibold">Scan table QR</span>
                <span className="block text-sm text-white/70">Fastest — we’ll set your table for you</span>
              </span>
            </button>

            <div className="rounded-3xl bg-surface p-5 ring-1 ring-line">
              <p className="text-sm font-semibold text-muted">Or enter your table number</p>
              <div
                className={`mt-3 flex h-20 items-center justify-center rounded-2xl font-display text-5xl font-black tabular-nums ${
                error ? 'bg-danger/5 text-danger' : 'bg-cream'}`
                }
                aria-live="polite">
                
                {entry || <span className="text-ink/25">—</span>}
              </div>
              {error &&
              <p className="mt-2 text-sm font-medium text-danger" role="alert">
                  {error}
                </p>
              }
              <div className="mt-4 grid grid-cols-3 gap-2">
                {keys.map((k) =>
                <button
                  key={k}
                  type="button"
                  onClick={() => press(k)}
                  aria-label={k === 'del' ? 'Delete digit' : k === 'clear' ? 'Clear' : k}
                  className="grid h-14 place-items-center rounded-2xl bg-cream text-xl font-bold transition-colors duration-100 hover:bg-line active:bg-line">
                  
                    {k === 'del' ? <DeleteIcon size={22} /> : k === 'clear' ? <span className="text-sm font-semibold">Clear</span> : k}
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={!entry}
                onClick={() => go(parseInt(entry, 10))}
                className="mt-4 h-14 w-full rounded-full bg-brand font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong disabled:cursor-not-allowed disabled:bg-line disabled:text-muted">
                
                {entry ? `Start ordering at Table ${entry}` : 'Enter a table number'}
              </button>
            </div>
          </div>

          <section aria-labelledby="tables-heading">
            <h2 id="tables-heading" className="font-display text-2xl font-extrabold uppercase tracking-tight">
              Tap your table
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sorted.map((t) => {
                const busy = t.status === 'occupied';
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => go(t.number)}
                    className={`flex h-28 flex-col justify-between rounded-2xl p-4 text-left ring-1 transition-[box-shadow,background-color] duration-150 hover:ring-2 hover:ring-brand ${
                    tableNumber === t.number ? 'bg-brand/5 ring-2 ring-brand' : 'bg-surface ring-line'}`
                    }>
                    
                    <span className="font-display text-3xl font-black leading-none">T{t.number}</span>
                    <span className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-muted">
                        <UsersIcon size={13} /> {t.seats}
                      </span>
                      <span className={`font-semibold ${busy ? 'text-warning' : 'text-success'}`}>{busy ? 'Occupied' : 'Free'}</span>
                    </span>
                  </button>);

              })}
            </div>
            <p className="mt-3 text-xs text-muted">Sharing a table? Pick it anyway — orders are tracked separately.</p>
          </section>
        </div>
      </main>
      <QrScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(n) => {
          setScanOpen(false);
          go(n);
        }} />
      
    </div>);

}