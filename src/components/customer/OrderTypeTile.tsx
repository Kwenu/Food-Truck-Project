import React from 'react';
import { ArrowRightIcon } from 'lucide-react';

interface OrderTypeTileProps {
  title: string;
  subtitle: string;
  image: string;
  onSelect: () => void;
}

export function OrderTypeTile({ title, subtitle, image, onSelect }: OrderTypeTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex min-h-[132px] w-full items-stretch overflow-hidden rounded-3xl bg-surface text-left ring-1 ring-line transition-[box-shadow,transform] duration-200 ease-snappy hover:shadow-xl hover:shadow-ink/10 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">
      
      <span className="relative w-[38%] shrink-0 overflow-hidden">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-snappy group-hover:scale-[1.04]" />
      </span>
      <span className="flex flex-1 items-center justify-between gap-3 p-5 md:p-6">
        <span>
          <span className="block font-display text-3xl font-black uppercase leading-none tracking-tight md:text-4xl">{title}</span>
          <span className="mt-2 block text-sm text-muted md:text-base">{subtitle}</span>
        </span>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand text-brand-ink transition-transform duration-200 ease-snappy group-hover:translate-x-1">
          <ArrowRightIcon size={22} />
        </span>
      </span>
    </button>);

}