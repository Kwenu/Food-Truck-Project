import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { QrCodeIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { EmptyState } from '../../components/shared/EmptyState';

/** Landing route encoded in each table's QR code. */
export function TableLanding() {
  const { tableCode } = useParams();
  const { tables } = useStore();
  const { startOrder } = useCart();
  const navigate = useNavigate();
  const table = tables.find((t) => t.code === tableCode);

  useEffect(() => {
    if (!table) return;
    startOrder('dine-in', table.number);
    toast.success(`Welcome! You're ordering for Table ${table.number}`);
    navigate('/menu', { replace: true });
  }, [table, startOrder, navigate]);

  if (table) return <div className="min-h-screen w-full bg-cream" />;

  return (
    <main className="grid min-h-screen w-full place-items-center bg-cream">
      <EmptyState
        icon={QrCodeIcon}
        title="We don't recognise this table"
        body="This QR code may be out of date. Enter your table number instead."
        action={
        <Link to="/dine-in" className="inline-flex h-12 items-center rounded-full bg-brand px-6 font-semibold text-brand-ink">
            Choose my table
          </Link>
        } />
      
    </main>);

}