import React from 'react';
import { motion } from 'framer-motion';
import { useStore } from '../../contexts/StoreContext';
import { Sheet } from '../shared/Sheet';

interface QrScanSheetProps {
  open: boolean;
  onClose: () => void;
  onScan: (tableNumber: number) => void;
}

export function QrScanSheet({ open, onClose, onScan }: QrScanSheetProps) {
  const { tables } = useStore();
  const sorted = [...tables].sort((a, b) => a.number - b.number);

  return (
    <Sheet open={open} onClose={onClose} title="Scan table QR">
      <div className="p-5 md:p-6">
        <div className="relative mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-3xl bg-night">
          {(['left-5 top-5 border-l-4 border-t-4 rounded-tl-xl', 'right-5 top-5 border-r-4 border-t-4 rounded-tr-xl', 'left-5 bottom-5 border-l-4 border-b-4 rounded-bl-xl', 'right-5 bottom-5 border-r-4 border-b-4 rounded-br-xl'] as const).map(
            (pos) =>
            <span key={pos} className={`absolute h-10 w-10 border-white ${pos}`} aria-hidden="true" />

          )}
          <motion.span
            aria-hidden="true"
            className="absolute inset-x-8 h-0.5 bg-brand"
            initial={{ top: '18%' }}
            animate={{ top: ['18%', '82%', '18%'] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }} />
          
          <p className="absolute inset-x-0 bottom-10 text-center text-xs font-medium text-white/80">Point at the code on your table</p>
        </div>
        <p className="mt-5 text-center text-sm text-muted">
          Camera access is simulated in this demo. Tap a table below to mimic scanning its QR code.
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {sorted.map((t) =>
          <button
            key={t.id}
            type="button"
            onClick={() => onScan(t.number)}
            className="h-12 rounded-xl bg-cream text-sm font-bold ring-1 ring-line transition-colors duration-150 hover:bg-brand hover:text-brand-ink hover:ring-brand">
            
              T{t.number}
            </button>
          )}
        </div>
      </div>
    </Sheet>);

}