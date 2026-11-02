import React from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { DownloadIcon, ExternalLinkIcon, PrinterIcon } from 'lucide-react';
import type { DiningTable } from '../../types/table';
import { useStore } from '../../contexts/StoreContext';
import { Sheet } from '../shared/Sheet';
import { tableUrl } from '../../utils/url';

interface TableQrModalProps {
  table: DiningTable | null;
  open: boolean;
  onClose: () => void;
}

export { tableUrl };

export function TableQrModal({ table, open, onClose }: TableQrModalProps) {
  const { settings } = useStore();
  if (!table) return null;
  const url = tableUrl(table.code);
  const canvasId = `qr-${table.id}`;

  const download = () => {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `table-${table.number}-qr.png`;
    a.click();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Table ${table.number} QR`}
      footer={
      <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={download} className="flex h-12 items-center justify-center gap-2 rounded-full font-semibold ring-1 ring-line hover:bg-cream">
            <DownloadIcon size={18} /> Download PNG
          </button>
          <button type="button" onClick={() => window.print()} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-semibold text-white">
            <PrinterIcon size={18} /> Print table card
          </button>
        </div>
      }>
      
      <div className="bg-cream p-6">
        <div id="print-area" className="mx-auto flex max-w-[300px] flex-col items-center rounded-3xl bg-white p-6 text-center text-black ring-1 ring-line">
          <p className="font-display text-sm font-black uppercase tracking-tight">{settings.truckName}</p>
          <p className="mt-1 font-display text-5xl font-black uppercase leading-none">Table {table.number}</p>
          <div className="mt-5 rounded-2xl bg-white p-2 ring-1 ring-line">
            <QRCodeCanvas id={canvasId} value={url} size={200} level="M" fgColor="#1C1917" bgColor="#FFFFFF" marginSize={1} />
          </div>
          <p className="mt-4 text-sm font-semibold">Scan to order from your table</p>
          <p className="mt-1 text-xs text-neutral-500">No app needed · Pay on your phone</p>
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