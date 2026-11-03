import React, { useRef, useState } from 'react';
import { FileTextIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../contexts/StoreContext';
import { counterUrl, tableUrl } from '../../utils/url';
import { downloadCardsPdf } from '../../utils/qrExport';
import { QrCard, counterCardText, tableCardText } from './QrCard';

/** One PDF with the counter QR and every table QR (four cards per A4 page). */
export function AllQrPdfButton({ className = '' }: {className?: string;}) {
  const { tables, settings } = useStore();
  const [busy, setBusy] = useState(false);
  const holderRef = useRef<HTMLDivElement>(null);
  const sorted = [...tables].sort((a, b) => a.number - b.number);

  const run = async () => {
    setBusy(true);
    try {
      // let React mount the off-screen cards, then give the QR images a moment to paint
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      const nodes = Array.from(holderRef.current?.querySelectorAll<HTMLElement>('[data-qr-card]') ?? []);
      await downloadCardsPdf(nodes, 'all-qr-codes.pdf', { layout: 'grid' });
      toast.success(`Saved a PDF with ${nodes.length} QR codes`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create the PDF.');
    }
    setBusy(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={`inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold ring-1 ring-line transition-colors duration-150 hover:bg-cream disabled:opacity-60 ${className}`}>
        
        <FileTextIcon size={18} /> {busy ? 'Preparing PDF…' : 'Download all as PDF'}
      </button>
      {busy &&
      <div ref={holderRef} aria-hidden="true" style={{ position: 'fixed', left: -10000, top: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div data-qr-card>
            <QrCard truckName={settings.truckName} url={counterUrl()} {...counterCardText} />
          </div>
          {sorted.map((t) =>
        <div key={t.id} data-qr-card>
              <QrCard truckName={settings.truckName} heading={`Table ${t.number}`} url={tableUrl(t.code)} {...tableCardText} />
            </div>
        )}
        </div>
      }
    </>);

}
