import React from 'react';

interface CategoryRailProps {
  categories: {id: string;name: string;count: number;}[];
  active: string | null;
  onSelect: (id: string) => void;
}

export function CategoryRail({ categories, active, onSelect }: CategoryRailProps) {
  return (
    <nav aria-label="Menu categories">
      <ul className="space-y-1">
        {categories.map((c) => {
          const isActive = active === `cat-${c.id}`;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                aria-current={isActive ? 'true' : undefined}
                className={`flex h-11 w-full items-center justify-between rounded-xl px-3 text-left text-sm font-semibold transition-colors duration-150 ${
                isActive ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`
                }>
                
                <span className="truncate">{c.name}</span>
                <span className={`text-xs tabular-nums ${isActive ? 'text-white/70' : 'text-muted'}`}>{c.count}</span>
              </button>
            </li>);

        })}
      </ul>
    </nav>);

}