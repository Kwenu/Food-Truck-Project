import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { DownloadIcon, ExternalLinkIcon, PrinterIcon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';
import { counterUrl } from '../../utils/url';
import { Sheet } from '../shared/Sheet';

interface CounterQrModalProps {
  open: boolean;
  onClose: () => void;
}

/** QR for the cashier / counter: opens the customer app where they pick dine-in or takeaway. */
export function CounterQrModal({ open, onClose }: CounterQrModalProps) {
  const { settings } = useStore();
  const url = counterUrl();
  const canvasId = 'qr-counter';

  const download = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'counter-qr.png';
    a.click();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cashier / counter QR"
      footer={
      <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={download} className="flex h-12 items-center justify-center gap-2 rounded-full font-semibold ring-1 ring-line hover:bg-cream">
            <DownloadIcon size={18} /> Download PNG
          </button>
          <button type="button" onClick={() => window.print()} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white">
            <PrinterIcon size={18} /> Print card
          </button>
        </div>
      }>
      
      <div className="bg-cream p-6">
        <div id="print-area" className="mx-auto flex max-w-[300px] flex-col items-center rounded-3xl bg-white p-6 text-center text-black ring-1 ring-line">
          <p className="font-display text-sm font-black uppercase tracking-tight">{settings.truckName}</p>
          <p className="mt-1 font-display text-5xl font-black uppercase leading-none">Order here</p>
          <div className="mt-5 rounded-2xl bg-white p-2 ring-1 ring-line">
            <QRCodeCanvas id={canvasId} value={url} size={200} level="M" fgColor="#1C1917" bgColor="#FFFFFF" marginSize={1} />
          </div>
          <p className="mt-4 text-sm font-semibold">Scan to order — skip the queue</p>
          <p className="mt-1 text-xs text-neutral-500">Dine-in or takeaway · Pay on your phone</p>
        </div>
        <div className="mt-5 flex items-center gap-2 rounded-xl bg-surface p-3 text-xs ring-1 ring-line">
          <span className="min-w-0 flex-1 truncate font-mono text-muted">{url}</span>
          <a href={url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1 font-semibold text-brand-strong hover:underline">
            Test <ExternalLinkIcon size={12} />
          </a>
        </div>
      </div>
    </Sheet>);

}
