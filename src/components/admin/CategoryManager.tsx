import React, { useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../../contexts/StoreContext';

export function CategoryManager() {
  const { categories, menuItems, addCategory, renameCategory, deleteCategory, moveCategory } = useStore();
  const [name, setName] = useState('');
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    if (categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) {
      toast.error('That category already exists');
      return;
    }
    addCategory(n);
    toast.success(`Category “${n}” created`);
    setName('');
  };

  return (
    <div className="max-w-2xl space-y-4">
      <form onSubmit={add} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name, e.g. Breakfast"
          aria-label="New category name"
          className="h-11 flex-1 rounded-full border border-line bg-surface px-4 text-sm outline-none focus:border-brand" />
        
        <button type="submit" disabled={!name.trim()} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-brand-ink disabled:opacity-50">
          <PlusIcon size={18} /> Create
        </button>
      </form>

      <ul className="divide-y divide-line overflow-hidden rounded-3xl bg-surface ring-1 ring-line">
        {sorted.map((c, i) => {
          const count = menuItems.filter((m) => m.categoryId === c.id).length;
          return (
            <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveCategory(c.id, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${c.name} up`}
                  className="grid h-6 w-7 place-items-center rounded text-muted hover:bg-cream hover:text-ink disabled:opacity-25">
                  
                  <ArrowUpIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(c.id, 1)}
                  disabled={i === sorted.length - 1}
                  aria-label={`Move ${c.name} down`}
                  className="grid h-6 w-7 place-items-center rounded text-muted hover:bg-cream hover:text-ink disabled:opacity-25">
                  
                  <ArrowDownIcon size={14} />
                </button>
              </div>
              <input
                defaultValue={c.name}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.name) {
                    renameCategory(c.id, v);
                    toast.success('Category renamed');
                  } else e.target.value = c.name;
                }}
                aria-label={`Rename ${c.name}`}
                className="h-10 flex-1 rounded-xl border border-transparent px-3 font-semibold outline-none hover:border-line focus:border-brand" />
              
              <span className="w-16 text-right text-sm text-muted">{count} items</span>
              <button
                type="button"
                onClick={() => {
                  deleteCategory(c.id);
                  toast(`Category “${c.name}” deleted`);
                }}
                disabled={count > 0}
                title={count > 0 ? 'Move or delete its items first' : 'Delete category'}
                aria-label={`Delete ${c.name}`}
                className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors duration-150 hover:bg-danger/5 hover:text-danger disabled:cursor-not-allowed disabled:opacity-30">
                
                <Trash2Icon size={16} />
              </button>
            </li>);

        })}
      </ul>
      <p className="text-xs text-muted">Categories with items can’t be deleted. Order here controls the customer menu.</p>
    </div>);

}