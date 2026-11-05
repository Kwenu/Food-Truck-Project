import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2Icon, LockIcon, QrCodeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { EmptyState } from '../../components/shared/EmptyState';

/** Landing route encoded in each table's QR code. Reserves the table for this device, or says it is taken. */
export function TableLanding() {
  const { tableCode } = useParams();
  const { tables } = useStore();
  const { claimTable } = useCart();
  const navigate = useNavigate();
  const table = tables.find((t) => t.code === tableCode);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!table) return;
    let cancelled = false;
    setBusyMessage(null);
    setProblem(null);
    claimTable(table.number).
    then(() => {
      if (cancelled) return;
      toast.success(`Welcome! You're ordering for Table ${table.number}`);
      navigate('/menu', { replace: true });
    }).
    catch((e) => {
      if (cancelled) return;
      const message = e instanceof Error ? e.message : '';
      if (/occupied/i.test(message)) setBusyMessage(message);else
      setProblem('We couldn’t reserve your table right now. Please check your connection and try again.');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table?.number, attempt]);

  if (table && problem) {
    return (
      <main className="customer-bg grid min-h-screen w-full place-items-center px-4">
        <EmptyState
          icon={QrCodeIcon}
          title="Something went wrong"
          body={problem}
          action={
          <button type="button" onClick={() => setAttempt((n) => n + 1)} className="inline-flex h-12 items-center rounded-full gradient-brand px-6 font-semibold text-white shadow-lg shadow-brand/25">
              Try again
            </button>
          } />
        
      </main>);

  }

  if (table && !busyMessage) {
    return (
      <main className="customer-bg grid min-h-screen w-full place-items-center">
        <p role="status" className="flex items-center gap-3 font-semibold text-muted">
          <Loader2Icon className="animate-spin" size={20} /> Reserving Table {table.number} for you…
        </p>
      </main>);

  }

  if (table && busyMessage) {
    return (
      <main className="customer-bg grid min-h-screen w-full place-items-center px-4">
        <EmptyState
          icon={LockIcon}
          title={`Table ${table.number} is occupied`}
          body={busyMessage}
          action={
          <Link to="/dine-in" className="inline-flex h-12 items-center rounded-full gradient-brand px-6 font-semibold text-white shadow-lg shadow-brand/25">
              Choose another table
            </Link>
          } />
        
      </main>);

  }

  return (
    <main className="customer-bg grid min-h-screen w-full place-items-center px-4">
      <EmptyState
        icon={QrCodeIcon}
        title="We don't recognise this table"
        body="This QR code may be out of date. Enter your table number instead."
        action={
        <Link to="/dine-in" className="inline-flex h-12 items-center rounded-full gradient-brand px-6 font-semibold text-white shadow-lg shadow-brand/25">
            Choose my table
          </Link>
        } />
      
    </main>);

}
