export type OrderType = 'takeaway' | 'dine-in';

export type OrderStatus =
'received' |
'confirmed' |
'preparing' |
'ready' |
'completed' |
'rejected';

export type PaymentMethod = 'cash' | 'card' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderLine {
  lineId: string;
  itemId: string;
  name: string;
  image: string;
  veg: boolean;
  unitPrice: number;
  quantity: number;
  addOns: string[];
  note: string;
}

export interface OrderTotals {
  subtotal: number;
  discount: number;
  tax: number;
  charges: number;
  chargesLabel: string;
  total: number;
}

export interface Payment {
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
}

export interface Customer {
  name: string;
  phone: string;
}

export interface Pickup {
  mode: 'asap' | 'scheduled';
  at: string | null;
}

export interface Order {
  id: string;
  number: string;
  type: OrderType;
  tableNumber: number | null;
  customer: Customer;
  pickup: Pickup | null;
  lines: OrderLine[];
  note: string;
  promoCode: string | null;
  totals: OrderTotals;
  payment: Payment;
  status: OrderStatus;
  history: StatusEvent[];
  createdAt: string;
  prepMinutes: number;
  estimatedReadyAt: string;
  rejectReason?: string;
}