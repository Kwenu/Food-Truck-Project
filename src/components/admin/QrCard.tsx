import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QrCardProps {
  /** DOM id (used for printing / exporting this exact card) */
  id?: string;
  truckName: string;
  heading: string;
  url: string;
  tagline: string;
  subtagline: string;
}

/**
 * The printable QR card. The preview, PNG download, PDF download and
 * "download all" PDF all use this one component, so they always match.
 */
export function QrCard({ id, truckName, heading, url, tagline, subtagline }: QrCardProps) {
  return (
    <div id={id} className="flex w-[300px] flex-col items-center rounded-3xl border border-line bg-white p-6 text-center text-black">
      <p className="font-display text-sm font-black uppercase tracking-tight">{truckName}</p>
      <p className="mt-1 font-display text-5xl font-black uppercase leading-none">{heading}</p>
      <div className="mt-5 rounded-2xl bg-white p-2 ring-1 ring-line">
        <QRCodeSVG value={url} size={200} level="M" fgColor="#1C1917" bgColor="#FFFFFF" marginSize={1} />
      </div>
      <p className="mt-4 text-sm font-semibold">{tagline}</p>
      <p className="mt-1 text-xs text-neutral-500">{subtagline}</p>
    </div>);

}

export const tableCardText = {
  tagline: 'Scan to order from your table',
  subtagline: 'No app needed · Pay on your phone'
};

export const counterCardText = {
  heading: 'Order here',
  tagline: 'Scan to order — skip the queue',
  subtagline: 'Dine-in or takeaway · Pay on your phone'
};
