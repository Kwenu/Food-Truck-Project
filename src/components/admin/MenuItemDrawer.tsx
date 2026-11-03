import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, PlusIcon, Trash2Icon, UploadIcon, XIcon } from 'lucide-react';
import { toast } from 'sonner';
import type { MenuItem, MenuTag } from '../../types/menu';
import { useStore } from '../../contexts/StoreContext';
import { createId } from '../../utils/id';
import { formatIn } from '../../utils/currency';
import { Sheet } from '../shared/Sheet';
import { Switch } from '../shared/Switch';

interface MenuItemDrawerProps {
  item: MenuItem | null;
  open: boolean;
  onClose: () => void;
}

const inputClass = 'mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm outline-none transition-colors duration-150 focus:border-brand';
const labelClass = 'text-sm font-semibold';
/** Select value meaning "create a new category" */
const NEW_CATEGORY = '__new__';

export function MenuItemDrawer({ item, open, onClose }: MenuItemDrawerProps) {
  const { categories, settings, upsertMenuItem, deleteMenuItem, addCategory } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<MenuItem | null>(null);
  const [priceText, setPriceText] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const isNew = !item;
  // Read inside the effect without re-running it: a background refresh must not wipe what is being typed
  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  useEffect(() => {
    if (!open) return;
    const sorted = [...categoriesRef.current].sort((a, b) => a.sortOrder - b.sortOrder);
    const base: MenuItem = item ?? {
      id: createId('item'),
      name: '',
      description: '',
      price: 0,
      categoryId: sorted.find((c) => c.id !== 'offers')?.id ?? sorted[0]?.id ?? NEW_CATEGORY,
      image: '',
      veg: true,
      tags: [],
      enabled: true,
      soldOut: false,
      prepMinutes: 10,
      addOns: []
    };
    setDraft({ ...base, addOns: base.addOns.map((a) => ({ ...a })) });
    setPriceText(base.price ? String(base.price) : '');
    setErrors({});
    setConfirmDelete(false);
    setNewCategoryName('');
  }, [open, item]);

  if (!draft) return null;

  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  // If the chosen category no longer exists (or none existed yet), fall back instead of silently failing
  const categoryValue =
  draft.categoryId === NEW_CATEGORY || sortedCategories.some((c) => c.id === draft.categoryId) ?
  draft.categoryId :
  sortedCategories.find((c) => c.id !== 'offers')?.id ?? sortedCategories[0]?.id ?? NEW_CATEGORY;
  const creatingCategory = categoryValue === NEW_CATEGORY;
  const priceNumber = parseFloat(priceText);

  const set = <K extends keyof MenuItem,>(key: K, value: MenuItem[K]) => setDraft((d) => d ? { ...d, [key]: value } : d);
  const toggleTag = (tag: MenuTag) => set('tags', draft.tags.includes(tag) ? draft.tags.filter((t) => t !== tag) : [...draft.tags, tag]);

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    if (file.size > 1.5 * 1024 * 1024) {
      toast.error('Image is too large. Use one under 1.5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('image', String(reader.result));
    reader.readAsDataURL(file);
  };

  const save = () => {
    const price = parseFloat(priceText);
    const e: Record<string, string> = {};
    if (draft.name.trim().length < 2) e.name = 'Name is required.';
    if (!Number.isFinite(price) || price <= 0) e.price = 'Enter a price above 0.';
    if (!draft.image) e.image = 'Add a photo so customers can see the dish.';
    if (creatingCategory && newCategoryName.trim().length < 2) e.category = 'Type a name for the new category.';
    setErrors(e);
    if (Object.keys(e).length) {
      toast.error(Object.values(e)[0]);
      return;
    }
    const categoryId = creatingCategory ? addCategory(newCategoryName.trim()).id : categoryValue;
    upsertMenuItem({
      ...draft,
      categoryId,
      name: draft.name.trim(),
      description: draft.description.trim(),
      price: Math.round(price * 100) / 100,
      addOns: draft.addOns.filter((a) => a.label.trim())
    });
    toast.success(isNew ? `${draft.name} added to the menu` : `${draft.name} updated`);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isNew ? 'New menu item' : 'Edit item'}
      variant="drawer"
      footer={
      confirmDelete ?
      <div className="flex items-center gap-2">
            <p className="flex-1 text-sm font-semibold">Delete {draft.name}? This can’t be undone.</p>
            <button type="button" onClick={() => setConfirmDelete(false)} className="h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line">
              Cancel
            </button>
            <button
          type="button"
          onClick={() => {
            deleteMenuItem(draft.id);
            toast(`${draft.name} deleted`);
            onClose();
          }}
          className="h-11 rounded-full bg-danger px-4 text-sm font-semibold text-white">
          
              Delete
            </button>
          </div> :

      <div className="flex gap-2">
            {!isNew &&
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          aria-label="Delete item"
          className="grid h-12 w-12 place-items-center rounded-full text-danger ring-1 ring-line transition-colors duration-150 hover:bg-danger/5">
          
                <Trash2Icon size={18} />
              </button>
        }
            <button type="button" onClick={onClose} className="h-12 rounded-full px-5 font-semibold ring-1 ring-line hover:bg-cream">
              Cancel
            </button>
            <button type="button" onClick={save} className="h-12 flex-1 rounded-full bg-brand font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong">
              {isNew ? 'Add to menu' : 'Save changes'}
            </button>
          </div>

      }>
      
      <div className="space-y-5 p-5 md:p-6">
        <div>
          <span className={labelClass}>Photo</span>
          <div className="mt-1.5 flex gap-4">
            <div className={`grid h-28 w-36 shrink-0 place-items-center overflow-hidden rounded-2xl bg-cream ring-1 ${errors.image ? 'ring-danger' : 'ring-line'}`}>
              {draft.image ? <img src={draft.image} alt="Preview" className="h-full w-full object-cover" /> : <ImageIcon size={28} className="text-muted" />}
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} aria-label="Upload photo" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-10 w-fit items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white">
                
                <UploadIcon size={16} /> Upload image
              </button>
              <input
                value={draft.image.startsWith('data:') ? '' : draft.image}
                onChange={(e) => set('image', e.target.value)}
                placeholder="…or paste an image URL"
                aria-label="Image URL"
                className="h-10 rounded-xl border border-line px-3 text-sm outline-none focus:border-brand" />
              
            </div>
          </div>
          {errors.image && <p className="mt-1 text-xs font-medium text-danger">{errors.image}</p>}
        </div>

        <div>
          <label htmlFor="item-name" className={labelClass}>
            Name
          </label>
          <input id="item-name" value={draft.name} onChange={(e) => set('name', e.target.value)} className={`${inputClass} ${errors.name ? 'border-danger' : ''}`} />
          {errors.name && <p className="mt-1 text-xs font-medium text-danger">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="item-desc" className={labelClass}>
            Description
          </label>
          <textarea
            id="item-desc"
            value={draft.description}
            onChange={(e) => set('description', e.target.value)}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-line px-3.5 py-2.5 text-sm outline-none focus:border-brand" />
          
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="item-price" className={labelClass}>
              Price (USD)
            </label>
            <input
              id="item-price"
              inputMode="decimal"
              value={priceText}
              onChange={(e) => setPriceText(e.target.value.replace(/[^\d.]/g, ''))}
              className={`${inputClass} ${errors.price ? 'border-danger' : ''}`} />
            
            {errors.price && <p className="mt-1 text-xs font-medium text-danger">{errors.price}</p>}
            {Number.isFinite(priceNumber) && priceNumber > 0 &&
            <p className="mt-1 text-xs text-muted">≈ {formatIn(priceNumber, 'LKR', settings.lkrPerUsd)}</p>
            }
          </div>
          <div>
            <label htmlFor="item-prep" className={labelClass}>
              Prep (min)
            </label>
            <input
              id="item-prep"
              type="number"
              min={1}
              max={60}
              value={draft.prepMinutes}
              onChange={(e) => set('prepMinutes', Math.max(1, parseInt(e.target.value, 10) || 1))}
              className={inputClass} />
            
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label htmlFor="item-cat" className={labelClass}>
              Category
            </label>
            <select id="item-cat" value={categoryValue} onChange={(e) => set('categoryId', e.target.value)} className={`${inputClass} ${errors.category ? 'border-danger' : ''}`}>
              {sortedCategories.map((c) =>
              <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
              )}
              <option value={NEW_CATEGORY}>+ New category…</option>
            </select>
            {creatingCategory &&
            <input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder={sortedCategories.length === 0 ? 'Create your first category, e.g. Burgers' : 'New category name'}
              aria-label="New category name"
              className={`${inputClass} ${errors.category ? 'border-danger' : ''}`} />
            }
            {errors.category && <p className="mt-1 text-xs font-medium text-danger">{errors.category}</p>}
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Dietary</legend>
          <div className="mt-1.5 flex gap-2">
            {[
            { v: true, l: 'Vegetarian' },
            { v: false, l: 'Non-vegetarian' }].
            map(({ v, l }) =>
            <button
              key={l}
              type="button"
              aria-pressed={draft.veg === v}
              onClick={() => set('veg', v)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors duration-150 ${
              draft.veg === v ? v ? 'bg-veg text-white' : 'bg-nonveg text-white' : 'ring-1 ring-line hover:bg-cream'}`
              }>
              
                {l}
              </button>
            )}
          </div>
        </fieldset>

        <fieldset>
          <legend className={labelClass}>Tags</legend>
          <div className="mt-1.5 flex gap-2">
            {(
            [
            ['popular', 'Popular'],
            ['chef', "Chef's pick"]] as
            [MenuTag, string][]).
            map(([tag, label]) =>
            <button
              key={tag}
              type="button"
              aria-pressed={draft.tags.includes(tag)}
              onClick={() => toggleTag(tag)}
              className={`h-10 rounded-full px-4 text-sm font-semibold transition-colors duration-150 ${
              draft.tags.includes(tag) ? 'bg-ink text-white' : 'ring-1 ring-line hover:bg-cream'}`
              }>
              
                {label}
              </button>
            )}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-6 rounded-2xl bg-cream/60 p-4">
          <Switch checked={draft.enabled} onChange={(v) => set('enabled', v)} label="Show on menu" showLabel />
          <Switch checked={draft.soldOut} onChange={(v) => set('soldOut', v)} label="Sold out" showLabel tone="danger" />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className={labelClass}>Extras</span>
            <button
              type="button"
              onClick={() => set('addOns', [...draft.addOns, { id: createId('addon'), label: '', price: 1 }])}
              className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-sm font-semibold text-brand-strong hover:bg-brand/5">
              
              <PlusIcon size={16} /> Add extra
            </button>
          </div>
          {draft.addOns.length === 0 ?
          <p className="mt-1 text-sm text-muted">No extras. Customers can still add notes.</p> :

          <ul className="mt-2 space-y-2">
              {draft.addOns.map((a, i) =>
            <li key={a.id} className="flex gap-2">
                  <input
                value={a.label}
                onChange={(e) => set('addOns', draft.addOns.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                placeholder="e.g. Extra cheese"
                aria-label="Extra name"
                className="h-10 flex-1 rounded-xl border border-line px-3 text-sm outline-none focus:border-brand" />
              
                  <input
                type="number"
                step="0.5"
                min={0}
                value={a.price}
                onChange={(e) => set('addOns', draft.addOns.map((x, j) => j === i ? { ...x, price: parseFloat(e.target.value) || 0 } : x))}
                aria-label="Extra price"
                className="h-10 w-24 rounded-xl border border-line px-3 text-sm outline-none focus:border-brand" />
              
                  <button
                type="button"
                onClick={() => set('addOns', draft.addOns.filter((_, j) => j !== i))}
                aria-label="Remove extra"
                className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-cream hover:text-ink">
                
                    <XIcon size={16} />
                  </button>
                </li>
            )}
            </ul>
          }
        </div>
      </div>
    </Sheet>);

}