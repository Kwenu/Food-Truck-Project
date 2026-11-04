import React from 'react';
import { accentGradient } from '../../utils/accents';

interface CategoryRailProps {
  categories: {id: string;name: string;count: number;}[];
  active: string | null;
  onSelect: (id: string) => void;
}

export function CategoryRail({ categories, active, onSelect }: CategoryRailProps) {
  return (
    <nav aria-label="Menu categories" className="rounded-3xl bg-surface/80 p-2.5 shadow-md shadow-ink/5 ring-1 ring-line/60 backdrop-blur">
      <ul className="space-y-1">
        {categories.map((c, i) => {
          const isActive = active === `cat-${c.id}`;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold transition-all duration-200 ${
                isActive ? `bg-gradient-to-r ${accentGradient(i)} text-white shadow-md` : 'text-ink hover:bg-cream'}`
                }>
                
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full bg-gradient-to-br ${accentGradient(i)} ${isActive ? 'ring-2 ring-white/70' : ''}`} aria-hidden="true" />
                <span className="flex-1 truncate">{c.name}</span>
                <span className={`rounded-full px-2 text-xs font-bold tabular-nums ${isActive ? 'bg-white/25 text-white' : 'bg-line/60 text-muted'}`}>{c.count}</span>
              </button>
            </li>);

        })}
      </ul>
    </nav>);

}
