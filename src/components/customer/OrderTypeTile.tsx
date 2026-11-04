import React from 'react';
import { ArrowRightIcon } from 'lucide-react';

interface OrderTypeTileProps {
  title: string;
  subtitle: string;
  image: string;
  onSelect: () => void;
  /** Colour theme of the tile */
  accent?: 'warm' | 'cool';
}

const accents = {
  warm: { bar: 'gradient-brand', glow: 'hover:shadow-brand/25', ring: 'ring-brand/25', tint: 'from-brand/20' },
  cool: { bar: 'gradient-cool', glow: 'hover:shadow-ink/10', ring: 'ring-brand/20', tint: 'from-ink/10' }
};

export function OrderTypeTile({ title, subtitle, image, onSelect, accent = 'warm' }: OrderTypeTileProps) {
  const a = accents[accent];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex min-h-[148px] w-full items-stretch overflow-hidden rounded-3xl bg-surface text-left shadow-lg shadow-ink/5 ring-1 ${a.ring} transition-[box-shadow,transform] duration-300 ease-snappy hover:-translate-y-1 hover:shadow-2xl ${a.glow} active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand`}>
      
      <span className="relative w-[38%] shrink-0 overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-snappy group-hover:scale-[1.07]" />
        <span className={`absolute inset-0 bg-gradient-to-tr ${a.tint} to-transparent`} aria-hidden="true" />
      </span>
      <span className="flex flex-1 items-center justify-between gap-3 p-5 md:p-7">
        <span>
          <span className="block font-display text-3xl font-black uppercase leading-none tracking-tight md:text-4xl">{title}</span>
          <span className="mt-2 block text-sm text-muted md:text-base">{subtitle}</span>
        </span>
        <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full ${a.bar} text-white shadow-lg transition-transform duration-200 ease-snappy group-hover:translate-x-1`}>
          <ArrowRightIcon size={22} />
        </span>
      </span>
    </button>);

}
