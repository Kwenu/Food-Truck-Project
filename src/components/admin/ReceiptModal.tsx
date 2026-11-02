import React from 'react';
import { PrinterIcon } from 'lucide-react';
import type { Order } from '../../types/order';
import { useStore } from '../../contexts/StoreContext';
import { formatMoney } from '../../utils/currency';
import { paymentMethodLabel, paymentStatusLabel } from '../../utils/orderStatus';
import { formatDateTime } from '../../utils/time';
import { Sheet } from '../shared/Sheet';

interface ReceiptModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptModal({ order, open, onClose }: ReceiptModalProps) {
  const { settings } = useStore();
  if (!order) return null;

  const row = (label: string, value: string, bold = false) =>
  <div className={`flex justify-between ${bold ? 'font-bold' : ''}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>;


  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Receipt"
      footer={
      <button
        type="button"
        onClick={() => window.print()}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white transition-colors duration-150 hover:bg-ink/90">
        
          <PrinterIcon size={18} /> Print receipt
        </button>
      }>
      
      <div className="bg-cream p-5">
        <div id="print-area" className="mx-auto max-w-[320px] bg-white p-6 font-mono text-[13px] leading-relaxed text-black shadow-sm">
          <p className="text-center text-base font-bold uppercase">{settings.truckName}</p>
          <p className="text-center text-xs">Fresh Food. Fast Service. Great Taste.</p>
          <div className="my-3 border-t border-dashed border-black" />
          {row('Order', order.number, true)}
          {row('Date', formatDateTime(order.createdAt))}
          {row('Type', order.type === 'takeaway' ? 'Takeaway' : `Dine-in · Table ${order.tableNumber}`)}
          {order.customer.name && row('Customer', order.customer.name)}
          <div className="my-3 border-t border-dashed border-black" />
          {order.lines.map((l) =>
          <div key={l.lineId} className="mb-1">
              {row(`${l.quantity} x ${l.name}`, formatMoney(l.unitPrice * l.quantity))}
              {l.addOns.length > 0 && <p className="pl-4 text-xs">+ {l.addOns.join(', ')}</p>}
              {l.note && <p className="pl-4 text-xs">* {l.note}</p>}
            </div>
          )}
          <div className="my-3 border-t border-dashed border-black" />
          {row('Subtotal', formatMoney(order.totals.subtotal))}
          {order.totals.discount > 0 && row(`Discount${order.promoCode ? ` ${order.promoCode}` : ''}`, `-${formatMoney(order.totals.discount)}`)}
          {row('Tax', formatMoney(order.totals.tax))}
          {order.totals.charges > 0 && row(order.totals.chargesLabel, formatMoney(order.totals.charges))}
          <div className="my-2 border-t border-black" />
          {row('TOTAL', formatMoney(order.totals.total), true)}
          <div className="my-3 border-t border-dashed border-black" />
          {row('Payment', `${paymentMethodLabel[order.payment.method]} · ${paymentStatusLabel[order.payment.status]}`)}
          {order.payment.reference && row('Ref', order.payment.reference)}
          <p className="mt-4 text-center text-xs">Thank you! Track your order with {order.number}</p>
        </div>
      </div>
    </Sheet>);

}