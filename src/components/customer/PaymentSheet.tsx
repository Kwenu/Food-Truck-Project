import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircleIcon, Loader2Icon, LockIcon } from 'lucide-react';
import { useMoney } from '../../contexts/CurrencyContext';
import { processPayment, type PaymentResult } from '../../utils/paymentGateway';
import { Sheet } from '../shared/Sheet';

interface PaymentSheetProps {
  open: boolean;
  amount: number;
  onClose: () => void;
  onSuccess: (result: PaymentResult) => void;
}

const wallets = [
{ id: 'upi', label: 'UPI' },
{ id: 'apple', label: 'Apple Pay' },
{ id: 'google', label: 'Google Pay' }];


type Stage = 'choose' | 'processing' | 'failed';

export function PaymentSheet({ open, amount, onClose, onSuccess }: PaymentSheetProps) {
  const { formatMoney } = useMoney();
  const [wallet, setWallet] = useState('upi');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [stage, setStage] = useState<Stage>('choose');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setStage('choose');
      setMessage('');
    }
  }, [open]);

  const pay = async () => {
    setStage('processing');
    const result = await processPayment({ method: 'online', amount, simulateFailure });
    if (result.ok) {
      onSuccess(result);
    } else {
      setMessage(result.message ?? 'Payment failed.');
      setStage('failed');
    }
  };

  return (
    <Sheet open={open} onClose={stage === 'processing' ? () => undefined : onClose} title="Secure payment">
      <div className="p-5 md:p-6">
        <div className="flex items-center justify-between rounded-2xl bg-cream p-4">
          <span className="text-sm text-muted">Amount due</span>
          <span className="font-display text-2xl font-black">{formatMoney(amount)}</span>
        </div>

        {stage === 'choose' &&
        <>
            <fieldset className="mt-5">
              <legend className="text-sm font-bold">Pay with</legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {wallets.map((w) =>
              <label
                key={w.id}
                className={`flex h-14 cursor-pointer items-center justify-center rounded-xl text-sm font-semibold ring-1 transition-colors duration-150 ${
                wallet === w.id ? 'bg-ink text-white ring-ink' : 'bg-surface ring-line hover:ring-ink/30'}`
                }>
                
                    <input type="radio" name="wallet" className="sr-only" checked={wallet === w.id} onChange={() => setWallet(w.id)} />
                    {w.label}
                  </label>
              )}
              </div>
            </fieldset>
            <label className="mt-4 flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={simulateFailure} onChange={(e) => setSimulateFailure(e.target.checked)} className="h-4 w-4 accent-current" />
              Simulate a failed payment (demo)
            </label>
            <button
            type="button"
            onClick={pay}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-full bg-brand font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
            
              <LockIcon size={18} /> Pay {formatMoney(amount)}
            </button>
          </>
        }

        {stage === 'processing' &&
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-10 text-center" role="status">
            <Loader2Icon size={36} className="animate-spin text-brand" />
            <p className="mt-4 font-semibold">Confirming with your provider…</p>
            <p className="mt-1 text-sm text-muted">Please don’t close this window.</p>
          </motion.div>
        }

        {stage === 'failed' &&
        <div className="mt-5 text-center" role="alert">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-danger/10 text-danger">
              <AlertCircleIcon size={28} />
            </span>
            <p className="mt-3 font-semibold">Payment didn’t go through</p>
            <p className="mt-1 text-sm text-muted">{message}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={onClose} className="h-12 rounded-full font-semibold ring-1 ring-line transition-colors duration-150 hover:bg-cream">
                Change method
              </button>
              <button
              type="button"
              onClick={() => setStage('choose')}
              className="h-12 rounded-full bg-brand font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
              
                Try again
              </button>
            </div>
          </div>
        }
        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted">
          <LockIcon size={12} /> Payments are simulated in this prototype
        </p>
      </div>
    </Sheet>);

}