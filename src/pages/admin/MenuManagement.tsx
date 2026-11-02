import React, { useState } from 'react';
import { useStore } from '../../contexts/StoreContext';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { MenuItemsPanel } from '../../components/admin/MenuItemsPanel';
import { CategoryManager } from '../../components/admin/CategoryManager';
import { PromotionsPanel } from '../../components/admin/PromotionsPanel';

type Tab = 'items' | 'categories' | 'promotions';

export function MenuManagement() {
  const { menuItems, categories, promotions } = useStore();
  const [tab, setTab] = useState<Tab>('items');
  const soldOut = menuItems.filter((m) => m.soldOut).length;

  const tabs: {id: Tab;label: string;count: number;}[] = [
  { id: 'items', label: 'Items', count: menuItems.length },
  { id: 'categories', label: 'Categories', count: categories.length },
  { id: 'promotions', label: 'Offers', count: promotions.filter((p) => p.active).length }];


  return (
    <div className="space-y-6 p-4 md:p-8">
      <AdminPageHeader
        title="Menu"
        description={`${menuItems.filter((m) => m.enabled).length} items live${soldOut ? ` · ${soldOut} sold out` : ''}. Changes appear on the customer menu instantly.`} />
      
      <div role="tablist" aria-label="Menu sections" className="flex gap-6 border-b border-line">
        {tabs.map((t) =>
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
          className={`-mb-px flex h-11 items-center gap-2 border-b-2 text-sm font-semibold transition-colors duration-150 ${
          tab === t.id ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`
          }>
          
            {t.label}
            <span className="rounded-full bg-ink/5 px-2 text-xs tabular-nums">{t.count}</span>
          </button>
        )}
      </div>
      {tab === 'items' && <MenuItemsPanel />}
      {tab === 'categories' && <CategoryManager />}
      {tab === 'promotions' && <PromotionsPanel />}
    </div>);

}