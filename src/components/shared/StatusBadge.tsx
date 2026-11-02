import React from 'react';
import type { OrderStatus, PaymentStatus } from '../../types/order';
import { paymentStatusLabel, paymentStatusTone, shortStatusLabel, statusTone } from '../../utils/orderStatus';

export function StatusBadge({ status }: {status: OrderStatus;}) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusTone[status]}`}>
      {shortStatusLabel(status)}
    </span>);

}

export function PaymentBadge({ status }: {status: PaymentStatus;}) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStatusTone[status]}`}>
      {paymentStatusLabel[status]}
    </span>);

}