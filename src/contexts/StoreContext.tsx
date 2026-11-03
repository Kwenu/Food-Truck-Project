import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { Category, MenuItem, Promotion } from '../types/menu';
import type { Order, OrderStatus, PaymentStatus } from '../types/order';
import type { Settings } from '../types/settings';
import type { StoreState } from '../types/store';
import type { DiningTable, TableStatus } from '../types/table';
import { categories as sampleCategories } from '../data/categories';
import { menuItems as sampleMenuItems } from '../data/menuItems';
import { promotions as samplePromotions } from '../data/promotions';
import { tables as sampleTables } from '../data/tables';
import { defaultSettings } from '../data/settings';
import { supabase } from '../lib/supabase';
import * as db from '../lib/db';
import {
  categoryFromRow,
  menuItemFromRow,
  orderFromRow,
  promotionFromRow,
  settingsFromRow,
  tableFromRow,
  type CategoryRow,
  type MenuItemRow,
  type OrderRow,
  type PromotionRow,
  type SettingsRow,
  type TableRow } from
'../lib/mappers';
import { createId } from '../utils/id';
import { useStaffAuth } from './StaffAuthContext';

export type { PlaceOrderInput } from '../lib/db';
export type ConnectionState = 'connecting' | 'live' | 'offline';

/**
 * The shared store. Data lives in Supabase:
 *  - Customers read the menu/settings (public) and place orders through the
 *    server-side place_order() function. They never read other people's orders.
 *  - Signed-in staff also load all orders and receive new ones live (Realtime).
 * Pages use the same hook as before; admin actions update the screen instantly
 * and save to the database in the background (with an error toast if it fails).
 */
export interface StoreContextValue extends StoreState {
  /** menu + settings loaded for the first time */
  ready: boolean;
  /** staff only: orders loaded (false for customers) */
  ordersReady: boolean;
  loadError: string | null;
  connection: ConnectionState;
  /** orders currently in the kitchen (used for the wait-time estimate) */
  queueCount: number;
  retry: () => void;

  placeOrder: (input: db.PlaceOrderInput) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  rejectOrder: (orderId: string, reason: string) => void;
  setPaymentStatus: (orderId: string, status: PaymentStatus) => void;

  upsertMenuItem: (item: MenuItem) => void;
  patchMenuItem: (id: string, patch: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  addCategory: (name: string) => Category;
  renameCategory: (id: string, name: string) => void;
  deleteCategory: (id: string) => void;
  moveCategory: (id: string, direction: -1 | 1) => void;
  upsertPromotion: (promo: Promotion) => void;
  deletePromotion: (id: string) => void;
  addTable: (seats: number) => void;
  removeTable: (id: string) => void;
  setTableStatus: (id: string, status: TableStatus) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  loadSampleData: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const emptyState: StoreState = {
  categories: [],
  menuItems: [],
  promotions: [],
  tables: [],
  orders: [],
  settings: defaultSettings
};

/** How far back staff orders are loaded (covers the 6-month report). */
const HISTORY_DAYS = 200;
/** Customers refresh the menu this often (and when they return to the tab). */
const CUSTOMER_REFRESH_MS = 60_000;
const daysAgoIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

function upsertById<T extends {id: string;}>(list: T[], item: T): T[] {
  const i = list.findIndex((x) => x.id === item.id);
  if (i === -1) return [...list, item];
  const next = list.slice();
  next[i] = item;
  return next;
}

function mergeOrders(existing: Order[], incoming: Order[]): Order[] {
  const map = new Map(existing.map((o) => [o.id, o]));
  incoming.forEach((o) => map.set(o.id, o));
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const errorText = (e: unknown) => e instanceof Error ? e.message : 'Something went wrong.';

interface RealtimeChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, unknown>;
  old: Record<string, unknown>;
}

export function StoreProvider({ children }: {children: React.ReactNode;}) {
  const { user, loading: authLoading } = useStaffAuth();
  const isStaff = !!user;

  const [state, setState] = useState<StoreState>(emptyState);
  const [ready, setReady] = useState(false);
  const [ordersReady, setOrdersReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [connection, setConnection] = useState<ConnectionState>('connecting');
  const [customerQueue, setCustomerQueue] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const stateRef = useRef(state);
  stateRef.current = state;
  const isStaffRef = useRef(isStaff);
  isStaffRef.current = isStaff;

  /* ------------------------------ loading ------------------------------ */

  /** Full load: menu + settings, and (staff) the order history or (customers) the queue size. */
  const loadAll = useCallback(async () => {
    const catalog = await db.fetchCatalog();
    if (isStaffRef.current) {
      const orders = await db.fetchOrdersSince(daysAgoIso(HISTORY_DAYS));
      setState({ ...catalog, orders });
      setOrdersReady(true);
    } else {
      const queue = await db.fetchQueueCount().catch(() => 0);
      setState({ ...catalog, orders: [] });
      setCustomerQueue(queue);
      setOrdersReady(false);
    }
    setReady(true);
    setLoadError(null);
  }, []);

  /** Light refresh after a reconnect / tab wake-up: menu + recent and still-active orders. */
  const refreshLive = useCallback(async () => {
    const catalog = await db.fetchCatalog();
    if (isStaffRef.current) {
      const [recent, active] = await Promise.all([db.fetchOrdersSince(daysAgoIso(3)), db.fetchActiveOrders()]);
      setState((s) => ({ ...catalog, orders: mergeOrders(s.orders, [...recent, ...active]) }));
    } else {
      const queue = await db.fetchQueueCount().catch(() => 0);
      setState((s) => ({ ...s, ...catalog }));
      setCustomerQueue(queue);
    }
  }, []);

  // First load (waits until we know whether a staff member is signed in), and again on sign-in/out
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    loadAll().catch((e) => {
      if (!cancelled) setLoadError(errorText(e));
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, isStaff, reloadKey, loadAll]);

  // Customers: keep the menu fresh (sold-out items, open/closed) without a live connection
  useEffect(() => {
    if (isStaff || authLoading) return;
    const tick = () => {
      if (document.visibilityState === 'visible') refreshLive().catch(() => undefined);
    };
    const id = window.setInterval(tick, CUSTOMER_REFRESH_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [isStaff, authLoading, refreshLive]);

  // Staff: live updates — new orders appear on the kitchen screen the moment they are placed
  useEffect(() => {
    if (!isStaff) {
      setConnection('live');
      return;
    }
    setConnection('connecting');
    let hasConnected = false;

    const channel = supabase.
    channel('live-store').
    on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (p) => {
      const c = p as unknown as RealtimeChange;
      if (c.eventType === 'DELETE') {
        const id = c.old.id as string;
        setState((s) => ({ ...s, orders: s.orders.filter((o) => o.id !== id) }));
      } else {
        const order = orderFromRow(c.new as unknown as OrderRow);
        setState((s) => ({ ...s, orders: mergeOrders(s.orders, [order]) }));
      }
    }).
    on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, (p) => {
      const c = p as unknown as RealtimeChange;
      if (c.eventType === 'DELETE') {
        const id = c.old.id as string;
        setState((s) => ({ ...s, menuItems: s.menuItems.filter((m) => m.id !== id) }));
      } else {
        const item = menuItemFromRow(c.new as unknown as MenuItemRow);
        setState((s) => ({ ...s, menuItems: upsertById(s.menuItems, item) }));
      }
    }).
    on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (p) => {
      const c = p as unknown as RealtimeChange;
      if (c.eventType === 'DELETE') {
        const id = c.old.id as string;
        setState((s) => ({ ...s, categories: s.categories.filter((x) => x.id !== id) }));
      } else {
        const cat = categoryFromRow(c.new as unknown as CategoryRow);
        setState((s) => ({ ...s, categories: upsertById(s.categories, cat) }));
      }
    }).
    on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, (p) => {
      const c = p as unknown as RealtimeChange;
      if (c.eventType === 'DELETE') {
        const id = c.old.id as string;
        setState((s) => ({ ...s, promotions: s.promotions.filter((x) => x.id !== id) }));
      } else {
        const promo = promotionFromRow(c.new as unknown as PromotionRow);
        setState((s) => ({ ...s, promotions: upsertById(s.promotions, promo) }));
      }
    }).
    on('postgres_changes', { event: '*', schema: 'public', table: 'dining_tables' }, (p) => {
      const c = p as unknown as RealtimeChange;
      if (c.eventType === 'DELETE') {
        const id = c.old.id as string;
        setState((s) => ({ ...s, tables: s.tables.filter((x) => x.id !== id) }));
      } else {
        const table = tableFromRow(c.new as unknown as TableRow);
        setState((s) => ({ ...s, tables: upsertById(s.tables, table).sort((a, b) => a.number - b.number) }));
      }
    }).
    on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'settings' }, (p) => {
      const c = p as unknown as RealtimeChange;
      setState((s) => ({ ...s, settings: settingsFromRow(c.new as unknown as SettingsRow) }));
    }).
    subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setConnection('live');
        // After a dropped connection, catch up on anything missed
        if (hasConnected) refreshLive().catch(() => undefined);
        hasConnected = true;
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setConnection('offline');
      }
    });

    // Tablets that go to sleep: refresh as soon as the screen is awake again
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshLive().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [isStaff, refreshLive]);

  /* ------------------------------ helpers ------------------------------ */

  /** Runs a background save; on failure shows a message and reloads the true data. */
  const save = useCallback((job: () => Promise<void>, failMessage: string) => {
    job().catch((e) => {
      toast.error(`${failMessage} ${errorText(e)}`);
      refreshLive().catch(() => undefined);
    });
  }, [refreshLive]);

  /* ------------------------------ orders ------------------------------ */

  const placeOrder = useCallback(async (input: db.PlaceOrderInput): Promise<Order> => {
    const order = await db.placeOrderRemote(input);
    setCustomerQueue((n) => n + 1);
    return order;
  }, []);

  const patchOrderLocal = useCallback((orderId: string, fn: (o: Order) => Order) => {
    setState((s) => ({ ...s, orders: s.orders.map((o) => o.id === orderId ? fn(o) : o) }));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    patchOrderLocal(orderId, (o) => ({ ...o, status, history: [...o.history, { status, at: new Date().toISOString() }] }));
    save(() => db.updateOrderRemote(orderId, { status }), 'Could not update the order.');
  }, [patchOrderLocal, save]);

  const rejectOrder = useCallback((orderId: string, reason: string) => {
    patchOrderLocal(orderId, (o) => ({
      ...o,
      status: 'rejected',
      rejectReason: reason,
      history: [...o.history, { status: 'rejected', at: new Date().toISOString() }],
      payment: o.payment.status === 'paid' ? { ...o.payment, status: 'refunded' } : o.payment
    }));
    save(() => db.updateOrderRemote(orderId, { status: 'rejected', rejectReason: reason }), 'Could not reject the order.');
  }, [patchOrderLocal, save]);

  const setPaymentStatus = useCallback((orderId: string, status: PaymentStatus) => {
    patchOrderLocal(orderId, (o) => ({ ...o, payment: { ...o.payment, status } }));
    save(() => db.updateOrderRemote(orderId, { paymentStatus: status }), 'Could not update the payment.');
  }, [patchOrderLocal, save]);

  /* ------------------------------ menu ------------------------------ */

  const upsertMenuItem = useCallback((item: MenuItem) => {
    setState((s) => ({ ...s, menuItems: upsertById(s.menuItems, item) }));
    save(() => db.upsertMenuItemRemote(item), 'Could not save the item.');
  }, [save]);

  const patchMenuItem = useCallback((id: string, patch: Partial<MenuItem>) => {
    setState((s) => ({ ...s, menuItems: s.menuItems.map((m) => m.id === id ? { ...m, ...patch } : m) }));
    save(() => db.patchMenuItemRemote(id, patch), 'Could not update the item.');
  }, [save]);

  const deleteMenuItem = useCallback((id: string) => {
    setState((s) => ({ ...s, menuItems: s.menuItems.filter((m) => m.id !== id) }));
    save(() => db.deleteMenuItemRemote(id), 'Could not delete the item.');
  }, [save]);

  const addCategory = useCallback((name: string): Category => {
    const cat: Category = {
      id: createId('cat'),
      name,
      sortOrder: Math.max(0, ...stateRef.current.categories.map((c) => c.sortOrder)) + 1
    };
    setState((s) => ({ ...s, categories: [...s.categories, cat] }));
    save(() => db.upsertCategoriesRemote([cat]), 'Could not add the category.');
    return cat;
  }, [save]);

  const renameCategory = useCallback((id: string, name: string) => {
    const existing = stateRef.current.categories.find((c) => c.id === id);
    if (!existing) return;
    setState((s) => ({ ...s, categories: s.categories.map((c) => c.id === id ? { ...c, name } : c) }));
    save(() => db.upsertCategoriesRemote([{ ...existing, name }]), 'Could not rename the category.');
  }, [save]);

  const deleteCategory = useCallback((id: string) => {
    setState((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
    save(() => db.deleteCategoryRemote(id), 'Could not delete the category.');
  }, [save]);

  const moveCategory = useCallback((id: string, direction: -1 | 1) => {
    const sorted = [...stateRef.current.categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === id);
    const swap = idx + direction;
    if (idx < 0 || swap < 0 || swap >= sorted.length) return;
    [sorted[idx], sorted[swap]] = [sorted[swap], sorted[idx]];
    const reordered = sorted.map((c, i) => ({ ...c, sortOrder: i }));
    setState((s) => ({ ...s, categories: reordered }));
    save(() => db.upsertCategoriesRemote(reordered), 'Could not reorder the categories.');
  }, [save]);

  const upsertPromotion = useCallback((promo: Promotion) => {
    setState((s) => ({ ...s, promotions: upsertById(s.promotions, promo) }));
    save(() => db.upsertPromotionRemote(promo), 'Could not save the promotion.');
  }, [save]);

  const deletePromotion = useCallback((id: string) => {
    setState((s) => ({ ...s, promotions: s.promotions.filter((p) => p.id !== id) }));
    save(() => db.deletePromotionRemote(id), 'Could not delete the promotion.');
  }, [save]);

  /* ------------------------------ tables ------------------------------ */

  const addTable = useCallback((seats: number) => {
    const number = Math.max(0, ...stateRef.current.tables.map((t) => t.number)) + 1;
    const table: DiningTable = {
      id: createId('table'),
      number,
      seats,
      code: `tbl-${String(number).padStart(2, '0')}`,
      status: 'available'
    };
    setState((s) => ({ ...s, tables: [...s.tables, table] }));
    save(() => db.insertTableRemote(table), 'Could not add the table.');
  }, [save]);

  const removeTable = useCallback((id: string) => {
    setState((s) => ({ ...s, tables: s.tables.filter((t) => t.id !== id) }));
    save(() => db.deleteTableRemote(id), 'Could not remove the table.');
  }, [save]);

  const setTableStatus = useCallback((id: string, status: TableStatus) => {
    setState((s) => ({ ...s, tables: s.tables.map((t) => t.id === id ? { ...t, status } : t) }));
    save(() => db.setTableStatusRemote(id, status), 'Could not update the table.');
  }, [save]);

  /* ------------------------------ settings ------------------------------ */

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    const merged = { ...stateRef.current.settings, ...patch };
    setState((s) => ({ ...s, settings: merged }));
    const onlyOpenToggle = Object.keys(patch).every((k) => k === 'isOpen');
    save(
      () => onlyOpenToggle && patch.isOpen !== undefined ? db.setTruckOpenRemote(patch.isOpen) : db.saveSettingsRemote(merged),
      'Could not save the settings.'
    );
  }, [save]);

  const loadSampleData = useCallback(async () => {
    await db.loadSampleDataRemote({
      settings: stateRef.current.settings,
      categories: sampleCategories,
      menuItems: sampleMenuItems,
      promotions: samplePromotions,
      tables: sampleTables.map((t) => ({ ...t, status: 'available' as TableStatus }))
    });
    await refreshLive();
  }, [refreshLive]);

  const retry = useCallback(() => {
    setLoadError(null);
    setReloadKey((k) => k + 1);
  }, []);

  /* ------------------------------ value ------------------------------ */

  const queueCount = useMemo(
    () => isStaff ?
    state.orders.filter((o) => o.status === 'received' || o.status === 'confirmed' || o.status === 'preparing').length :
    customerQueue,
    [isStaff, state.orders, customerQueue]
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      ...state,
      ready,
      ordersReady: isStaff && ordersReady,
      loadError,
      connection,
      queueCount,
      retry,
      placeOrder,
      updateOrderStatus,
      rejectOrder,
      setPaymentStatus,
      upsertMenuItem,
      patchMenuItem,
      deleteMenuItem,
      addCategory,
      renameCategory,
      deleteCategory,
      moveCategory,
      upsertPromotion,
      deletePromotion,
      addTable,
      removeTable,
      setTableStatus,
      updateSettings,
      loadSampleData
    }),
    [
    state,
    ready,
    isStaff,
    ordersReady,
    loadError,
    connection,
    queueCount,
    retry,
    placeOrder,
    updateOrderStatus,
    rejectOrder,
    setPaymentStatus,
    upsertMenuItem,
    patchMenuItem,
    deleteMenuItem,
    addCategory,
    renameCategory,
    deleteCategory,
    moveCategory,
    upsertPromotion,
    deletePromotion,
    addTable,
    removeTable,
    setTableStatus,
    updateSettings,
    loadSampleData]

  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
