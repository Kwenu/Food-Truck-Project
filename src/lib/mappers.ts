import type { Category, MenuItem, MenuTag, Promotion } from '../types/menu';
import type {
  Order,
  OrderLine,
  OrderStatus,
  OrderTotals,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  StatusEvent } from
'../types/order';
import type { Settings } from '../types/settings';
import type { DiningTable, TableStatus } from '../types/table';
import { defaultSettings } from '../data/settings';

/* ---------- Database row shapes (snake_case, as stored in Postgres) ---------- */

export interface OrderRow {
  id: string;
  number: string;
  type: OrderType;
  table_number: number | null;
  customer_name: string;
  customer_phone: string;
  pickup_mode: 'asap' | 'scheduled' | null;
  pickup_at: string | null;
  lines: OrderLine[];
  note: string;
  promo_code: string | null;
  totals: OrderTotals;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  status: OrderStatus;
  history: StatusEvent[];
  prep_minutes: number;
  estimated_ready_at: string;
  reject_reason: string | null;
  created_at: string;
}

export interface MenuItemRow {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  veg: boolean;
  tags: MenuTag[];
  enabled: boolean;
  sold_out: boolean;
  prep_minutes: number;
  add_ons: MenuItem['addOns'];
}

export interface CategoryRow {
  id: string;
  name: string;
  sort_order: number;
}

export interface PromotionRow {
  id: string;
  code: string;
  title: string;
  description: string;
  type: Promotion['type'];
  value: number | string;
  min_subtotal: number | string;
  active: boolean;
}

export interface TableRow {
  id: string;
  number: number;
  seats: number;
  code: string;
  status: TableStatus;
}

export interface SettingsRow {
  data: Partial<Settings>;
}

/* ---------- Row → app ---------- */

/** Normalises any Postgres timestamp string to a consistent ISO-8601 (UTC) string. */
const iso = (value: string): string => new Date(value).toISOString();

export function orderFromRow(r: OrderRow): Order {
  return {
    id: r.id,
    number: r.number,
    type: r.type,
    tableNumber: r.table_number,
    customer: { name: r.customer_name ?? '', phone: r.customer_phone ?? '' },
    pickup: r.pickup_mode ? { mode: r.pickup_mode, at: r.pickup_at ? iso(r.pickup_at) : null } : null,
    lines: r.lines ?? [],
    note: r.note ?? '',
    promoCode: r.promo_code,
    totals: r.totals,
    payment: { method: r.payment_method, status: r.payment_status, reference: r.payment_reference },
    status: r.status,
    history: (r.history ?? []).map((h) => ({ status: h.status, at: iso(h.at) })),
    createdAt: iso(r.created_at),
    prepMinutes: r.prep_minutes,
    estimatedReadyAt: iso(r.estimated_ready_at),
    ...(r.reject_reason ? { rejectReason: r.reject_reason } : {})
  };
}

export function menuItemFromRow(r: MenuItemRow): MenuItem {
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    description: r.description ?? '',
    price: Number(r.price),
    image: r.image ?? '',
    veg: r.veg,
    tags: r.tags ?? [],
    enabled: r.enabled,
    soldOut: r.sold_out,
    prepMinutes: r.prep_minutes,
    addOns: (r.add_ons ?? []).map((a) => ({ ...a, price: Number(a.price) }))
  };
}

export const categoryFromRow = (r: CategoryRow): Category => ({ id: r.id, name: r.name, sortOrder: r.sort_order });

export function promotionFromRow(r: PromotionRow): Promotion {
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    description: r.description,
    type: r.type,
    value: Number(r.value),
    minSubtotal: Number(r.min_subtotal),
    active: r.active
  };
}

export const tableFromRow = (r: TableRow): DiningTable => ({
  id: r.id,
  number: r.number,
  seats: r.seats,
  code: r.code,
  status: r.status
});

export const settingsFromRow = (r: SettingsRow | null | undefined): Settings => ({ ...defaultSettings, ...(r?.data ?? {}) });

/* ---------- App → row ---------- */

export function menuItemToRow(i: MenuItem): MenuItemRow {
  return {
    id: i.id,
    category_id: i.categoryId,
    name: i.name,
    description: i.description,
    price: i.price,
    image: i.image,
    veg: i.veg,
    tags: i.tags,
    enabled: i.enabled,
    sold_out: i.soldOut,
    prep_minutes: i.prepMinutes,
    add_ons: i.addOns
  };
}

/** Only the columns that were actually changed (for quick toggles like "sold out"). */
export function menuItemPatchToRow(p: Partial<MenuItem>): Partial<MenuItemRow> {
  const row: Partial<MenuItemRow> = {};
  if (p.categoryId !== undefined) row.category_id = p.categoryId;
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.price !== undefined) row.price = p.price;
  if (p.image !== undefined) row.image = p.image;
  if (p.veg !== undefined) row.veg = p.veg;
  if (p.tags !== undefined) row.tags = p.tags;
  if (p.enabled !== undefined) row.enabled = p.enabled;
  if (p.soldOut !== undefined) row.sold_out = p.soldOut;
  if (p.prepMinutes !== undefined) row.prep_minutes = p.prepMinutes;
  if (p.addOns !== undefined) row.add_ons = p.addOns;
  return row;
}

export const categoryToRow = (c: Category): CategoryRow => ({ id: c.id, name: c.name, sort_order: c.sortOrder });

export const promotionToRow = (p: Promotion): PromotionRow => ({
  id: p.id,
  code: p.code,
  title: p.title,
  description: p.description,
  type: p.type,
  value: p.value,
  min_subtotal: p.minSubtotal,
  active: p.active
});

export const tableToRow = (t: DiningTable): TableRow => ({
  id: t.id,
  number: t.number,
  seats: t.seats,
  code: t.code,
  status: t.status
});
