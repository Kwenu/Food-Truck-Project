import React, { useEffect, useRef } from 'react';

interface CategoryChipsProps {
  categories: {id: string;name: string;}[];
  active: string | null;
  onSelect: (id: string) => void;
}

export function CategoryChips({ categories, active, onSelect }: CategoryChipsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = containerRef.current?.querySelector<HTMLButtonElement>(`[data-cat="${active}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  return (
    <nav aria-label="Menu categories">
      <div ref={containerRef} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
        {categories.map((c) => {
          const isActive = active === `cat-${c.id}`;
          return (
            <button
              key={c.id}
              type="button"
              data-cat={`cat-${c.id}`}
              onClick={() => onSelect(c.id)}
              aria-current={isActive ? 'true' : undefined}
              className={`h-10 shrink-0 whitespace-nowrap rounded-full px-4 text-sm font-semibold transition-colors duration-150 ${
              isActive ? 'bg-ink text-white' : 'bg-surface text-ink ring-1 ring-line hover:ring-ink/30'}`
              }>
              
              {c.name}
            </button>);

        })}
      </div>
    </nav>);

}