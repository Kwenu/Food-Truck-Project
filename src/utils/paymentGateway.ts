import type { PaymentMethod, PaymentStatus } from '../types/order';

/**
 * Payment adapter. Swap the body of `processPayment` for a real provider
 * (Stripe, Square, Razorpay…) without touching the checkout UI.
 */
export interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  card?: CardDetails;
  simulateFailure?: boolean;
}

export interface PaymentResult {
  ok: boolean;
  status: PaymentStatus;
  reference: string | null;
  message?: string;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function processPayment(req: PaymentRequest): Promise<PaymentResult> {
  if (req.method === 'cash') {
    return { ok: true, status: 'pending', reference: null };
  }
  await wait(1400);
  const digits = req.card?.number.replace(/\D/g, '') ?? '';
  if (req.method === 'card' && digits.endsWith('0002')) {
    return { ok: false, status: 'failed', reference: null, message: 'Your card was declined. Try another card.' };
  }
  if (req.simulateFailure) {
    return { ok: false, status: 'failed', reference: null, message: 'The payment could not be completed. No money was taken.' };
  }
  const prefix = req.method === 'card' ? 'ch' : 'pay';
  return {
    ok: true,
    status: 'paid',
    reference: `${prefix}_${Math.random().toString(36).slice(2, 12)}`
  };
}

export function luhnValid(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return sum % 10 === 0;
}