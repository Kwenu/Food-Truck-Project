import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { MenuItem } from '../types/menu';
import type { OrderLine, OrderType } from '../types/order';
import { createId } from '../utils/id';
import { claimTableRemote, releaseTableRemote } from '../lib/db';

/** The current customer's in-progress order on this device. */
const STORAGE_KEY = 'ember-wheel:cart:v1';

interface CartState {
  orderType: OrderType | null;
  tableNumber: number | null;
  lines: OrderLine[];
  note: string;
  promoCode: string | null;
  myOrders: string[];
  /** Anonymous id of this device, used to hold a table so nobody else can take it. */
  tableToken: string;
}

interface CartContextValue extends CartState {
  itemCount: number;
  startOrder: (type: OrderType, tableNumber?: number | null) => void;
  /** Reserves the table for this device on the server and starts a dine-in order. Throws if the table is occupied. */
  claimTable: (tableNumber: number) => Promise<void>;
  /** Keeps the current table reserved (called while the customer is still browsing). Throws if it was lost. */
  renewTable: () => Promise<void>;
  /** Lets go of the table (switching to takeaway / order finished) */
  leaveTable: () => void;
  addLine: (item: MenuItem, quantity: number, addOnIds: string[], note: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  setLineNote: (lineId: string, note: string) => void;
  setNote: (note: string) => void;
  setPromoCode: (code: string | null) => void;
  clearCart: () => void;
  rememberOrder: (orderNumber: string) => void;
}

/** Random, hard-to-guess id for this device (stored only in this browser). */
function newDeviceToken(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    // fall through
  }
  return `${createId('dev')}${createId('tok')}${createId('key')}`;
}

const emptyCart: CartState = { orderType: null, tableNumber: null, lines: [], note: '', promoCode: null, myOrders: [], tableToken: '' };

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptyCart, ...(JSON.parse(raw) as CartState) } : emptyCart;
  } catch {
    return emptyCart;
  }
}

export function CartProvider({ children }: {children: React.ReactNode;}) {
  const [cart, setCart] = useState<CartState>(() => {
    const loaded = loadCart();
    return loaded.tableToken ? loaded : { ...loaded, tableToken: newDeviceToken() };
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {

      // ignore
    }}, [cart]);

  const startOrder = useCallback((type: OrderType, tableNumber: number | null = null) => {
    setCart((c) => ({ ...c, orderType: type, tableNumber: type === 'dine-in' ? tableNumber : null }));
  }, []);

  const claimTable = useCallback(async (tableNumber: number) => {
    await claimTableRemote(tableNumber, cart.tableToken);
    setCart((c) => ({ ...c, orderType: 'dine-in', tableNumber }));
  }, [cart.tableToken]);

  const renewTable = useCallback(async () => {
    if (cart.orderType !== 'dine-in' || !cart.tableNumber) return;
    await claimTableRemote(cart.tableNumber, cart.tableToken);
  }, [cart.orderType, cart.tableNumber, cart.tableToken]);

  const leaveTable = useCallback(() => {
    releaseTableRemote(cart.tableToken).catch(() => undefined);
    setCart((c) => ({ ...c, orderType: c.orderType === 'dine-in' ? null : c.orderType, tableNumber: null }));
  }, [cart.tableToken]);

  const addLine = useCallback((item: MenuItem, quantity: number, addOnIds: string[], note: string) => {
    const chosen = item.addOns.filter((a) => addOnIds.includes(a.id));
    const unitPrice = item.price + chosen.reduce((s, a) => s + a.price, 0);
    const labels = chosen.map((a) => a.label);
    setCart((c) => {
      const match = c.lines.find(
        (l) => l.itemId === item.id && l.note === note.trim() && l.addOns.join('|') === labels.join('|')
      );
      if (match) {
        return { ...c, lines: c.lines.map((l) => l === match ? { ...l, quantity: l.quantity + quantity } : l) };
      }
      const line: OrderLine = {
        lineId: createId('line'),
        itemId: item.id,
        name: item.name,
        image: item.image,
        veg: item.veg,
        unitPrice,
        quantity,
        addOns: labels,
        note: note.trim()
      };
      return { ...c, lines: [...c.lines, line] };
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    setCart((c) => ({
      ...c,
      lines: quantity <= 0 ? c.lines.filter((l) => l.lineId !== lineId) : c.lines.map((l) => l.lineId === lineId ? { ...l, quantity } : l)
    }));
  }, []);

  const removeLine = useCallback((lineId: string) => {
    setCart((c) => ({ ...c, lines: c.lines.filter((l) => l.lineId !== lineId) }));
  }, []);

  const setLineNote = useCallback((lineId: string, note: string) => {
    setCart((c) => ({ ...c, lines: c.lines.map((l) => l.lineId === lineId ? { ...l, note } : l) }));
  }, []);

  const setNote = useCallback((note: string) => setCart((c) => ({ ...c, note })), []);
  const setPromoCode = useCallback((promoCode: string | null) => setCart((c) => ({ ...c, promoCode })), []);
  const clearCart = useCallback(() => setCart((c) => ({ ...c, lines: [], note: '', promoCode: null })), []);
  const rememberOrder = useCallback(
    (orderNumber: string) => setCart((c) => ({ ...c, myOrders: [orderNumber, ...c.myOrders.filter((n) => n !== orderNumber)].slice(0, 5) })),
    []
  );

  const value = useMemo<CartContextValue>(
    () => ({
      ...cart,
      itemCount: cart.lines.reduce((s, l) => s + l.quantity, 0),
      startOrder,
      claimTable,
      renewTable,
      leaveTable,
      addLine,
      updateQuantity,
      removeLine,
      setLineNote,
      setNote,
      setPromoCode,
      clearCart,
      rememberOrder
    }),
    [cart, startOrder, claimTable, renewTable, leaveTable, addLine, updateQuantity, removeLine, setLineNote, setNote, setPromoCode, clearCart, rememberOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}