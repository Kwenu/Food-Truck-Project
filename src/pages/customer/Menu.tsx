import React, { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { SearchIcon, SearchXIcon, StoreIcon, TagIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { MenuItem } from '../../types/menu';
import { useCart } from '../../contexts/CartContext';
import { useStore } from '../../contexts/StoreContext';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { useTableHold } from '../../hooks/useTableHold';
import { CustomerHeader } from '../../components/customer/CustomerHeader';
import { CategoryChips } from '../../components/customer/CategoryChips';
import { MenuItemCard } from '../../components/customer/MenuItemCard';
import { ItemDetailSheet } from '../../components/customer/ItemDetailSheet';
import { CartPanel } from '../../components/customer/CartPanel';
import { FloatingCartBar } from '../../components/customer/FloatingCartBar';
import { EmptyState } from '../../components/shared/EmptyState';
import { Switch } from '../../components/shared/Switch';

export function Menu() {
  const { categories, menuItems, settings, promotions } = useStore();
  const cart = useCart();
  useTableHold();
  const [query, setQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = menuItems.filter(
      (i) => i.enabled && (!vegOnly || i.veg) && (!q || i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    );
    return [...categories].
    sort((a, b) => a.sortOrder - b.sortOrder).
    map((c) => ({ category: c, items: visible.filter((i) => i.categoryId === c.id) })).
    filter((s) => s.items.length > 0);
  }, [categories, menuItems, query, vegOnly]);

  const active = useScrollSpy(sections.map((s) => `cat-${s.category.id}`));
  const activePromos = promotions.filter((p) => p.active);

  const qtyByItem = useMemo(() => {
    const map = new Map<string, number>();
    cart.lines.forEach((l) => map.set(l.itemId, (map.get(l.itemId) ?? 0) + l.quantity));
    return map;
  }, [cart.lines]);

  if (!cart.orderType) return <Navigate to="/" replace />;
  if (cart.orderType === 'dine-in' && !cart.tableNumber) return <Navigate to="/dine-in" replace />;

  const scrollTo = (id: string) => {
    const el = document.getElementById(`cat-${id}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 150;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const openItem = (item: MenuItem) => {
    setSelected(item);
    setSheetOpen(true);
  };

  const quickAdd = (item: MenuItem) => {
    if (item.addOns.length > 0) {
      openItem(item);
      return;
    }
    cart.addLine(item, 1, [], '');
    toast.success(`${item.name} added`);
  };

  const navCategories = sections.map((s) => ({ id: s.category.id, name: s.category.name, count: s.items.length }));

  return (
    <div className="customer-bg min-h-screen w-full pb-28 lg:pb-12">
      <CustomerHeader />

      {!settings.isOpen &&
      <div className="bg-ink text-white">
          <div className="mx-auto flex max-w-[1680px] items-center gap-3 px-4 py-3 text-sm md:px-8 xl:px-12" role="status">
            <StoreIcon size={18} className="shrink-0 text-mustard" />
            <span>
              <strong className="font-semibold">We’re closed right now.</strong> Browse the menu - ordering opens again soon.
            </span>
          </div>
        </div>
      }

      <div className="mx-auto max-w-[1680px] px-4 md:px-8 xl:px-12">
        <div className="flex flex-col gap-4 pb-4 pt-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-4xl font-black uppercase leading-none tracking-tight md:text-5xl">Menu</h1>
            <p className="mt-2 text-sm font-medium text-muted md:text-base">
              {cart.orderType === 'dine-in' ? `Ordering for Table ${cart.tableNumber}. We’ll bring it over.` : 'Takeaway - we’ll call your name when it’s ready.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-80 md:flex-none xl:w-96">
              <SearchIcon size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes"
                aria-label="Search dishes"
                className="h-12 w-full rounded-full border border-line bg-surface pl-11 pr-10 text-sm outline-none transition-colors duration-150 focus:border-brand" />
              
              {query &&
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-cream">
                
                  <XIcon size={16} />
                </button>
              }
            </div>
            <div className="flex h-12 shrink-0 items-center rounded-full bg-surface px-4 ring-1 ring-line">
              <Switch checked={vegOnly} onChange={setVegOnly} label="Veg only" showLabel />
            </div>
          </div>
        </div>

        {activePromos.length > 0 && !query &&
        <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {activePromos.map((p) =>
          <p key={p.id} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-brand/10 px-4 py-2 text-sm text-ink">
                <TagIcon size={15} className="text-brand-strong" />
                <span className="font-semibold">{p.title}</span>
                <span className="text-muted">· code</span>
                <span className="font-mono font-bold text-brand-strong">{p.code}</span>
              </p>
          )}
          </div>
        }

        <div className="glass sticky top-16 z-20 -mx-4 border-b border-line/60 px-4 py-3 md:-mx-8 md:px-8 xl:-mx-12 xl:px-12">
          <CategoryChips categories={navCategories} active={active} onSelect={scrollTo} />
        </div>

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 lg:pt-6 xl:gap-10">
          <div>
            {sections.length === 0 ?
            <EmptyState
              icon={SearchXIcon}
              title="Nothing matches"
              body={vegOnly ? 'Try turning off Veg only or searching for something else.' : 'Try a different dish name or ingredient.'}
              action={
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setVegOnly(false);
                }}
                className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white">
                
                    Clear filters
                  </button>
              } /> :


            sections.map(({ category, items }, index) =>
            <section key={category.id} id={`cat-${category.id}`} aria-labelledby={`h-${category.id}`} className="pb-10 pt-6">
                  <div className="flex items-baseline gap-3">
                    <h2 id={`h-${category.id}`} className="font-display text-3xl font-extrabold uppercase tracking-tight md:text-4xl">
                      {category.name}
                    </h2>
                    <span className="text-sm font-semibold text-muted">{items.length} items</span>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] xl:gap-6">
                    {items.map((item) =>
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantityInCart={qtyByItem.get(item.id) ?? 0}
                  disabled={!settings.isOpen}
                  onOpen={() => openItem(item)}
                  onQuickAdd={() => quickAdd(item)} />

                )}
                  </div>
                </section>
            )
            }
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-40">
              <CartPanel />
            </div>
          </aside>
        </div>
      </div>

      <FloatingCartBar />
      <ItemDetailSheet item={selected} open={sheetOpen} disabled={!settings.isOpen} onClose={() => setSheetOpen(false)} />
    </div>);

}