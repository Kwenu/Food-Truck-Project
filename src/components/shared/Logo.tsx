import React from 'react';
import { FlameIcon } from 'lucide-react';
import { useStore } from '../../contexts/StoreContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: 'dark' | 'light';
  showName?: boolean;
}

const boxSize = { sm: 'h-8 w-8 rounded-lg', md: 'h-10 w-10 rounded-xl', lg: 'h-14 w-14 rounded-2xl' };
const iconSize = { sm: 16, md: 20, lg: 28 };
const textSize = { sm: 'text-base', md: 'text-xl', lg: 'text-3xl' };

export function Logo({ size = 'md', tone = 'dark', showName = true }: LogoProps) {
  const { settings } = useStore();
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`grid shrink-0 place-items-center bg-brand text-brand-ink ${boxSize[size]}`} aria-hidden="true">
        <FlameIcon size={iconSize[size]} strokeWidth={2.5} />
      </span>
      {showName &&
      <span
        className={`whitespace-nowrap font-display font-black uppercase leading-none tracking-tight ${textSize[size]} ${
        tone === 'light' ? 'text-white' : 'text-ink'}`
        }>
        
          {settings.truckName}
        </span>
      }
    </span>);

}