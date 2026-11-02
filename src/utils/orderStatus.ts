import type { Order, OrderStatus, OrderType, PaymentMethod, PaymentStatus } from '../types/order';

export const ACTIVE_STATUSES: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready'];
/** What the kitchen screen shows: only orders the cashier/admin has already approved. */
export const KITCHEN_STATUSES: OrderStatus[] = ['confirmed', 'preparing', 'ready'];
export const TRACK_STAGES: OrderStatus[] = ['received', 'confirmed', 'preparing', 'ready', 'completed'];

export function isActiveStatus(status: OrderStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}

export function isKitchenStatus(status: OrderStatus): boolean {
  return KITCHEN_STATUSES.includes(status);
}

/** When the kitchen's clock starts: the moment the order was approved (falls back to when it was placed). */
export function kitchenStart(order: Order): string {
  return order.history.find((h) => h.status === 'confirmed')?.at ?? order.createdAt;
}

export function statusLabel(status: OrderStatus, type: OrderType): string {
  switch (status) {
    case 'received':
      return 'Waiting for approval';
    case 'confirmed':
      return 'Approved · in the kitchen queue';
    case 'preparing':
      return 'Preparing your food';
    case 'ready':
      return type === 'takeaway' ? 'Ready for collection' : 'Ready to serve';
    case 'completed':
      return 'Completed';
    case 'rejected':
      return 'Rejected';
  }
}

export function shortStatusLabel(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    received: 'New',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready',
    completed: 'Completed',
    rejected: 'Rejected'
  };
  return map[status];
}

export function nextStatus(status: OrderStatus): OrderStatus | null {
  const map: Partial<Record<OrderStatus, OrderStatus>> = {
    received: 'confirmed',
    confirmed: 'preparing',
    preparing: 'ready',
    ready: 'completed'
  };
  return map[status] ?? null;
}

export function nextActionLabel(status: OrderStatus, type: OrderType): string | null {
  switch (status) {
    case 'received':
      return 'Approve order';
    case 'confirmed':
      return 'Start preparing';
    case 'preparing':
      return 'Mark ready';
    case 'ready':
      return type === 'takeaway' ? 'Collected' : 'Served';
    default:
      return null;
  }
}

export const statusTone: Record<OrderStatus, string> = {
  received: 'bg-brand/10 text-brand-strong',
  confirmed: 'bg-info/10 text-info',
  preparing: 'bg-warning/10 text-warning',
  ready: 'bg-success/10 text-success',
  completed: 'bg-ink/5 text-muted',
  rejected: 'bg-danger/10 text-danger'
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  cash: 'Cash at cashier',
  card: 'Card at cashier',
  online: 'Online'
};

export const paymentStatusTone: Record<PaymentStatus, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  failed: 'bg-danger/10 text-danger',
  refunded: 'bg-ink/5 text-muted'
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  pending: 'Unpaid',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded'
};