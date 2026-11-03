import React, { useState } from 'react';
import { DownloadIcon, ExternalLinkIcon, FileTextIcon, PrinterIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../contexts/StoreContext';
import { counterUrl } from '../../utils/url';
import { downloadCardPng, downloadCardsPdf } from '../../utils/qrExport';
import { Sheet } from '../shared/Sheet';
import { QrCard, counterCardText } from './QrCard';

interface CounterQrModalProps {
  open: boolean;
  onClose: () => void;
}

/** QR for the cashier / counter: opens the customer app where they pick dine-in or takeaway. */
export function CounterQrModal({ open, onClose }: CounterQrModalProps) {
  const { settings } = useStore();
  const [busy, setBusy] = useState<'png' | 'pdf' | null>(null);
  const url = counterUrl();
  const cardId = 'print-area';

  const run = async (kind: 'png' | 'pdf') => {
    const card = document.getElementById(cardId);
    if (!card) return;
    setBusy(kind);
    try {
      if (kind === 'png') await downloadCardPng(card, 'counter-qr.png');else
      await downloadCardsPdf([card], 'counter-qr.pdf', { layout: 'single' });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the download.');
    }
    setBusy(null);
  };

  const btn = 'flex h-12 items-center justify-center gap-2 rounded-full font-semibold ring-1 ring-line hover:bg-cream disabled:opacity-60';

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Cashier / counter QR"
      footer={
      <div className="grid grid-cols-3 gap-2">
          <button type="button" disabled={busy !== null} onClick={() => run('png')} className={btn}>
            <DownloadIcon size={18} /> {busy === 'png' ? 'Saving…' : 'PNG'}
          </button>
          <button type="button" disabled={busy !== null} onClick={() => run('pdf')} className={btn}>
            <FileTextIcon size={18} /> {busy === 'pdf' ? 'Saving…' : 'PDF'}
          </button>
          <button type="button" onClick={() => window.print()} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white">
            <PrinterIcon size={18} /> Print
          </button>
        </div>
      }>
      
      <div className="bg-cream p-6">
        <div className="flex justify-center">
        <QrCard id={cardId} truckName={settings.truckName} url={url} {...counterCardText} />
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
