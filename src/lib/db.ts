import type { Category, MenuItem, Promotion } from '../types/menu';
import type { Customer, Order, OrderLine, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Pickup } from '../types/order';
import type { Settings } from '../types/settings';
import type { DiningTable, TableStatus } from '../types/table';
import { normalizeOrderNumber } from '../utils/prepTime';
import { supabase } from './supabase';
import {
  categoryFromRow,
  categoryToRow,
  menuItemFromRow,
  menuItemPatchToRow,
  menuItemToRow,
  orderFromRow,
  promotionFromRow,
  promotionToRow,
  settingsFromRow,
  tableFromRow,
  tableToRow,
  type CategoryRow,
  type MenuItemRow,
  type OrderRow,
  type PromotionRow,
  type SettingsRow,
  type TableRow } from
'./mappers';

/**
 * Every call to Supabase lives in this file, so the rest of the app never
 * touches the database directly. Functions throw an Error with a readable
 * message when something goes wrong.
 */

interface DbError {
  message: string;
}

function ensure(error: DbError | null): void {
  if (error) throw new Error(error.message);
}

/** An UPDATE/DELETE that matches no rows (e.g. signed out, or no permission) is reported as an error. */
function ensureChanged(res: {data: unknown[] | null;error: DbError | null;}): void {
  ensure(res.error);
  if (!res.data || res.data.length === 0) {
    throw new Error('Nothing was changed. You may be signed out or not allowed to do this.');
  }
}

/* =============================== Reading =============================== */

export interface Catalog {
  settings: Settings;
  categories: Category[];
  menuItems: MenuItem[];
  promotions: Promotion[];
  tables: DiningTable[];
}

/** Everything a customer (or staff member) needs to render the menu. Publicly readable. */
export async function fetchCatalog(): Promise<Catalog> {
  const [settings, categories, items, promos, tables] = await Promise.all([
  supabase.from('settings').select('data').eq('id', 1).maybeSingle(),
  supabase.from('categories').select('*').order('sort_order'),
  supabase.from('menu_items').select('*').order('position'),
  supabase.from('promotions').select('*').order('code'),
  supabase.from('dining_tables').select('*').order('number')]
  );
  ensure(settings.error);
  ensure(categories.error);
  ensure(items.error);
  ensure(promos.error);
  ensure(tables.error);
  return {
    settings: settingsFromRow(settings.data as SettingsRow | null),
    categories: ((categories.data ?? []) as unknown as CategoryRow[]).map(categoryFromRow),
    menuItems: ((items.data ?? []) as unknown as MenuItemRow[]).map(menuItemFromRow),
    promotions: ((promos.data ?? []) as unknown as PromotionRow[]).map(promotionFromRow),
    tables: ((tables.data ?? []) as unknown as TableRow[]).map(tableFromRow)
  };
}

const PAGE_SIZE = 1000;

/** Staff only. Loads orders created since `sinceIso`, page by page (Supabase returns max 1000 rows per request). */
export async function fetchOrdersSince(sinceIso: string): Promise<Order[]> {
  const all: Order[] = [];
  for (let from = 0;; from += PAGE_SIZE) {
    const { data, error } = await supabase.
    from('orders').
    select('*').
    gte('created_at', sinceIso).
    order('created_at', { ascending: false }).
    order('id').
    range(from, from + PAGE_SIZE - 1);
    ensure(error);
    const rows = (data ?? []) as unknown as OrderRow[];
    all.push(...rows.map(orderFromRow));
    if (rows.length < PAGE_SIZE) break;
  }
  return all;
}

/** Staff only. Orders still in the kitchen, however old. */
export async function fetchActiveOrders(): Promise<Order[]> {
  const { data, error } = await supabase.
  from('orders').
  select('*').
  in('status', ['received', 'confirmed', 'preparing', 'ready']).
  order('created_at', { ascending: false });
  ensure(error);
  return ((data ?? []) as unknown as OrderRow[]).map(orderFromRow);
}

/** Public: how many orders are in the kitchen right now. */
export async function fetchQueueCount(): Promise<number> {
  const { data, error } = await supabase.rpc('queue_count');
  ensure(error);
  return typeof data === 'number' ? data : 0;
}

/** Public: look up orders by number (phone numbers are never returned). */
export async function fetchOrdersByNumber(numbers: string[]): Promise<Order[]> {
  const cleaned = Array.from(new Set(numbers.map(normalizeOrderNumber).filter(Boolean))).slice(0, 10);
  if (cleaned.length === 0) return [];
  const { data, error } = await supabase.rpc('get_orders', { order_numbers: cleaned });
  ensure(error);
  return ((data ?? []) as unknown as OrderRow[]).map(orderFromRow);
}

/* ============================== Placing orders ============================== */

export interface PlaceOrderInput {
  type: OrderType;
  tableNumber: number | null;
  customer: Customer;
  pickup: Pickup | null;
  lines: OrderLine[];
  note: string;
  promoCode: string | null;
  /** How the customer says they'll pay at the cashier. Payment is always recorded as unpaid until staff mark it paid. */
  payment: {method: PaymentMethod;};
  /** Anonymous per-device token that proves which device holds the table (dine-in only). */
  tableToken?: string | null;
}

/**
 * Sends the order to the server. Only the item ids, quantities, add-on names and
 * notes matter — the server re-prices everything from the live menu.
 */
export async function placeOrderRemote(input: PlaceOrderInput): Promise<Order> {
  const payload = {
    type: input.type,
    tableNumber: input.tableNumber,
    tableToken: input.tableToken ?? null,
    customer: input.customer,
    pickup: input.pickup,
    lines: input.lines.map((l) => ({
      lineId: l.lineId,
      itemId: l.itemId,
      quantity: l.quantity,
      addOns: l.addOns,
      note: l.note
    })),
    note: input.note,
    promoCode: input.promoCode,
    payment: input.payment
  };
  const { data, error } = await supabase.rpc('place_order', { payload });
  ensure(error);
  return orderFromRow(data as unknown as OrderRow);
}

/* ============================== Table locking ============================== */

export interface TableState {
  number: number;
  /** true = someone else is sitting there (or has just scanned it), so this device can't take it */
  busy: boolean;
  /** true = this device already holds the table */
  mine: boolean;
}

/** Reserves a table for this device (about 10 minutes, renewed while the customer is browsing). Throws if it is taken. */
export async function claimTableRemote(tableNumber: number, token: string): Promise<void> {
  ensure((await supabase.rpc('claim_table', { p_number: tableNumber, p_token: token })).error);
}

/** Lets go of whatever table this device is holding. */
export async function releaseTableRemote(token: string): Promise<void> {
  ensure((await supabase.rpc('release_table', { p_token: token })).error);
}

/** Live availability of every table, from this device's point of view. */
export async function fetchTableStates(token: string): Promise<TableState[]> {
  const { data, error } = await supabase.rpc('get_table_states', { p_token: token });
  ensure(error);
  return Array.isArray(data) ? (data as TableState[]) : [];
}

/* ============================== Staff writes ============================== */

export async function updateOrderRemote(
id: string,
patch: {status?: OrderStatus;rejectReason?: string;paymentStatus?: PaymentStatus;})
: Promise<void> {
  const row: Record<string, unknown> = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.rejectReason !== undefined) row.reject_reason = patch.rejectReason;
  if (patch.paymentStatus !== undefined) row.payment_status = patch.paymentStatus;
  ensureChanged(await supabase.from('orders').update(row).eq('id', id).select('id'));
}

export async function upsertMenuItemRemote(item: MenuItem): Promise<void> {
  ensure((await supabase.from('menu_items').upsert(menuItemToRow(item))).error);
}

export async function patchMenuItemRemote(id: string, patch: Partial<MenuItem>): Promise<void> {
  ensureChanged(await supabase.from('menu_items').update(menuItemPatchToRow(patch)).eq('id', id).select('id'));
}

export async function deleteMenuItemRemote(id: string): Promise<void> {
  ensureChanged(await supabase.from('menu_items').delete().eq('id', id).select('id'));
}

export async function upsertCategoriesRemote(categories: Category[]): Promise<void> {
  ensure((await supabase.from('categories').upsert(categories.map(categoryToRow))).error);
}

export async function deleteCategoryRemote(id: string): Promise<void> {
  ensureChanged(await supabase.from('categories').delete().eq('id', id).select('id'));
}

export async function upsertPromotionRemote(promo: Promotion): Promise<void> {
  ensure((await supabase.from('promotions').upsert(promotionToRow(promo))).error);
}

export async function deletePromotionRemote(id: string): Promise<void> {
  ensureChanged(await supabase.from('promotions').delete().eq('id', id).select('id'));
}

export async function insertTableRemote(table: DiningTable): Promise<void> {
  ensure((await supabase.from('dining_tables').insert(tableToRow(table))).error);
}

export async function deleteTableRemote(id: string): Promise<void> {
  ensureChanged(await supabase.from('dining_tables').delete().eq('id', id).select('id'));
}

export async function setTableStatusRemote(id: string, status: TableStatus): Promise<void> {
  ensureChanged(await supabase.from('dining_tables').update({ status }).eq('id', id).select('id'));
}

/** Admin or manager: open / close the truck. */
export async function setTruckOpenRemote(isOpen: boolean): Promise<void> {
  ensure((await supabase.rpc('set_truck_open', { is_open: isOpen })).error);
}

/** Admin: save the full settings object. */
export async function saveSettingsRemote(settings: Settings): Promise<void> {
  ensureChanged(
    await supabase.from('settings').update({ data: settings, updated_at: new Date().toISOString() }).eq('id', 1).select('id')
  );
}

/** Admin: writes the bundled sample menu, promotions, tables and settings. Orders are never touched. */
export async function loadSampleDataRemote(sample: Catalog): Promise<void> {
  ensure((await supabase.from('categories').upsert(sample.categories.map(categoryToRow))).error);
  ensure((await supabase.from('menu_items').upsert(sample.menuItems.map(menuItemToRow))).error);
  ensure((await supabase.from('promotions').upsert(sample.promotions.map(promotionToRow))).error);
  ensure((await supabase.from('dining_tables').upsert(sample.tables.map(tableToRow))).error);
  await saveSettingsRemote(sample.settings);
}
