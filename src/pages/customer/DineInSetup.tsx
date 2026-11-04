import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2Icon, DeleteIcon, Loader2Icon, LockIcon, QrCodeIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { fetchTableStates, type TableState } from '../../lib/db';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { QrScanSheet } from '../../components/customer/QrScanSheet';

const REFRESH_MS = 8000;

export function DineInSetup() {
  const navigate = useNavigate();
  const { tables } = useStore();
  const { claimTable, tableNumber, tableToken } = useCart();
  const [entry, setEntry] = useState(tableNumber ? String(tableNumber) : '');
  const [error, setError] = useState('');
  const [scanOpen, setScanOpen] = useState(false);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [states, setStates] = useState<Record<number, TableState>>({});
  const sorted = [...tables].sort((a, b) => a.number - b.number);

  // Live availability: refreshed every few seconds so a table that was just taken (or freed) shows up quickly
  const loadStates = useCallback(async () => {
    try {
      const list = await fetchTableStates(tableToken);
      setStates(Object.fromEntries(list.map((s) => [s.number, s])));
    } catch {
      // keep whatever we already show
    }
  }, [tableToken]);

  useEffect(() => {
    void loadStates();
    const tick = () => {
      if (document.visibilityState === 'visible') void loadStates();
    };
    const id = window.setInterval(tick, REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [loadStates]);

  const isBusy = (n: number, fallbackStatus: string) => states[n] ? states[n].busy : fallbackStatus === 'occupied';
  const isMine = (n: number) => !!states[n]?.mine;

  const go = async (n: number) => {
    const table = tables.find((t) => t.number === n);
    if (!table) {
      setError(`There's no Table ${n}. Check the number on your table.`);
      return;
    }
    if (isBusy(n, table.status)) {
      const msg = `Table ${n} is already occupied. Please choose another table.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    setClaiming(n);
    setError('');
    try {
      await claimTable(n); // the server re-checks and reserves it, so two people can never both get it
      toast.success(`Ordering for Table ${n}`);
      navigate('/menu');
    } catch (e) {
      const msg = e instanceof Error && e.message ? e.message : `Table ${n} is not available right now.`;
      setError(msg);
      toast.error(msg);
      void loadStates();
    } finally {
      setClaiming(null);
    }
  };

  const press = (key: string) => {
    setError('');
    if (key === 'del') setEntry((e) => e.slice(0, -1));else
    if (key === 'clear') setEntry('');else
    setEntry((e) => e.length >= 2 ? e : (e + key).replace(/^0+/, ''));
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'del'];
  const freeCount = sorted.filter((t) => !isBusy(t.number, t.status)).length;

  return (
    <div className="customer-bg min-h-screen w-full">
      <CustomerHeader backTo="/" showCart={false} showMode={false} />
      <main className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12 xl:px-12">
        <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight md:text-6xl">
          Which table <span className="text-gradient">are you at?</span>
        </h1>
        <p className="mt-3 text-muted md:text-lg">Scan the code on your table, or enter the number printed on it.</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,460px)_1fr] lg:gap-10 xl:gap-14">
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="flex h-24 w-full items-center gap-4 rounded-3xl gradient-night px-6 text-left text-white shadow-xl shadow-ink/10 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-2xl active:scale-[0.99]">
              
              <span className="grid h-14 w-14 place-items-center rounded-2xl gradient-sun text-ink">
                <QrCodeIcon size={26} />
              </span>
              <span>
                <span className="block text-lg font-bold">Scan table QR</span>
                <span className="block text-sm text-white/75">Fastest — we’ll reserve your table for you</span>
              </span>
            </button>

            <div className="rounded-3xl bg-surface p-6 shadow-lg shadow-ink/5 ring-1 ring-line/60">
              <p className="text-sm font-semibold text-muted">Or enter your table number</p>
              <div
                className={`mt-3 flex h-20 items-center justify-center rounded-2xl font-display text-5xl font-black tabular-nums ${
                error ? 'bg-danger/5 text-danger' : 'bg-cream'}`
                }
                aria-live="polite">
                
                {entry || <span className="text-ink/25">—</span>}
              </div>
              {error &&
              <p className="mt-2 flex items-start gap-2 text-sm font-medium text-danger" role="alert">
                  <LockIcon size={16} className="mt-0.5 shrink-0" /> {error}
                </p>
              }
              <div className="mt-4 grid grid-cols-3 gap-2">
                {keys.map((k) =>
                <button
                  key={k}
                  type="button"
                  onClick={() => press(k)}
                  aria-label={k === 'del' ? 'Delete digit' : k === 'clear' ? 'Clear' : k}
                  className="grid h-14 place-items-center rounded-2xl bg-cream text-xl font-bold transition-all duration-100 hover:bg-brand/10 active:scale-95">
                  
                    {k === 'del' ? <DeleteIcon size={22} /> : k === 'clear' ? <span className="text-sm font-semibold">Clear</span> : k}
                  </button>
                )}
              </div>
              <button
                type="button"
                disabled={!entry || claiming !== null}
                onClick={() => void go(parseInt(entry, 10))}
                className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-full gradient-brand font-semibold text-white shadow-lg shadow-brand/25 transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-line disabled:bg-none disabled:text-muted disabled:shadow-none">
                
                {claiming !== null && claiming === parseInt(entry, 10) ?
                <>
                    <Loader2Icon size={20} className="animate-spin" /> Reserving…
                  </> :
                entry ? `Start ordering at Table ${entry}` : 'Enter a table number'}
              </button>
            </div>
          </div>

          <section aria-labelledby="tables-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="tables-heading" className="font-display text-3xl font-extrabold uppercase tracking-tight">
                Tap your table
              </h2>
              <span className="inline-flex items-center gap-2 rounded-full bg-surface px-3 py-1.5 text-xs font-bold shadow-sm ring-1 ring-line/70">
                <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" /> {freeCount} of {sorted.length} free
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4">
              {sorted.map((t) => {
                const busy = isBusy(t.number, t.status);
                const mine = isMine(t.number) || tableNumber === t.number && !busy;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => void go(t.number)}
                    disabled={busy || claiming !== null}
                    aria-disabled={busy}
                    aria-label={busy ? `Table ${t.number}, occupied` : `Table ${t.number}, ${t.seats} seats, free`}
                    className={`relative flex h-32 flex-col justify-between overflow-hidden rounded-3xl p-4 text-left transition-all duration-200 ${
                    busy ?
                    'cursor-not-allowed bg-line/50 text-muted ring-1 ring-line' :
                    mine ?
                    'gradient-cool text-white shadow-xl shadow-ink/10 ring-2 ring-brand' :
                    'bg-surface shadow-md shadow-ink/5 ring-1 ring-line/70 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/20 hover:ring-2 hover:ring-brand'}`
                    }>
                    
                    {!busy && !mine && <span className="absolute inset-x-0 top-0 h-1.5 gradient-fresh" aria-hidden="true" />}
                    <span className="flex items-start justify-between">
                      <span className="font-display text-4xl font-black leading-none">T{t.number}</span>
                      {busy && <LockIcon size={18} aria-hidden="true" />}
                      {mine && <CheckCircle2Icon size={20} aria-hidden="true" />}
                    </span>
                    <span className="flex items-center justify-between text-xs">
                      <span className={`inline-flex items-center gap-1 ${mine ? 'text-white/85' : 'text-muted'}`}>
                        <UsersIcon size={13} /> {t.seats}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 font-bold ${busy ? 'bg-warning/15 text-warning' : mine ? 'bg-white/25 text-white' : 'bg-success/10 text-success'}`}>
                        {busy ? 'Occupied' : mine ? 'Your table' : 'Free'}
                      </span>
                    </span>
                  </button>);

              })}
            </div>
            <p className="mt-4 flex items-start gap-2 text-sm text-muted">
              <LockIcon size={15} className="mt-0.5 shrink-0" />
              A table that is in use is locked for everyone else until our staff complete its order.
            </p>
          </section>
        </div>
      </main>
      <QrScanSheet
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(n) => {
          setScanOpen(false);
          void go(n);
        }} />
      
    </div>);

}
