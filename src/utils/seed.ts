import { addMinutes, startOfDay, subDays, subMinutes } from 'date-fns';
import { categories } from '../data/categories';
import { menuItems } from '../data/menuItems';
import { promotions } from '../data/promotions';
import { tables } from '../data/tables';
import { customerNames, defaultSettings } from '../data/settings';
import type { MenuItem } from '../types/menu';
import type { Order, OrderLine, OrderStatus, OrderType, PaymentMethod } from '../types/order';
import type { StoreState } from '../types/store';
import { computeTotals } from './pricing';
import { TRACK_STAGES } from './orderStatus';

type DraftOrder = Omit<Order, 'id' | 'number'>;

interface DraftOptions {
  type?: OrderType;
  tableNumber?: number;
  note?: string;
  method?: PaymentMethod;
  prep?: number;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = a + 0x6d2b79f5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const BUSY_HOURS = [11, 12, 12, 12, 13, 13, 14, 15, 17, 18, 18, 19, 19, 19, 20, 21];

/** Builds a realistic demo dataset: ~60 days of history plus a live kitchen queue. */
export function createSeedState(now: Date = new Date()): StoreState {
  const rand = mulberry32(20261031);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const orderable = menuItems.filter((i) => i.enabled && !i.soldOut);
  const drafts: DraftOrder[] = [];

  const makeLines = (): OrderLine[] => {
    const count = 1 + Math.floor(rand() * 3);
    const chosen = new Set<MenuItem>();
    while (chosen.size < count) chosen.add(pick(orderable));
    return Array.from(chosen).map((item, i) => ({
      lineId: `seed-line-${drafts.length}-${i}`,
      itemId: item.id,
      name: item.name,
      image: item.image,
      veg: item.veg,
      unitPrice: item.price,
      quantity: rand() < 0.8 ? 1 : 2,
      addOns: [],
      note: ''
    }));
  };

  const make = (createdAt: Date, status: OrderStatus, opts: DraftOptions = {}): DraftOrder => {
    const type: OrderType = opts.type ?? (rand() < 0.58 ? 'takeaway' : 'dine-in');
    const lines = makeLines();
    const promo = rand() < 0.12 ? promotions[0] : null;
    const totals = computeTotals(lines, type, defaultSettings, promo);
    const r = rand();
    const method: PaymentMethod = opts.method ?? (r < 0.3 ? 'cash' : r < 0.75 ? 'card' : 'online');
    const prep = opts.prep ?? 10 + Math.floor(rand() * 8);
    const flow: OrderStatus[] =
    status === 'rejected' ? ['received', 'rejected'] : TRACK_STAGES.slice(0, TRACK_STAGES.indexOf(status) + 1);
    const offsets: Record<OrderStatus, number> = {
      received: 0,
      confirmed: 1,
      preparing: 3,
      ready: prep,
      completed: prep + 5,
      rejected: 2
    };
    const name = pick(customerNames);
    const paid = method !== 'cash' || status === 'completed';
    return {
      type,
      tableNumber: type === 'dine-in' ? opts.tableNumber ?? 1 + Math.floor(rand() * 8) : null,
      customer: {
        name: type === 'takeaway' || rand() < 0.5 ? name : '',
        phone: type === 'takeaway' ? `555${String(Math.floor(rand() * 9_000_000) + 1_000_000)}` : ''
      },
      pickup: type === 'takeaway' ? { mode: 'asap', at: null } : null,
      lines,
      note: opts.note ?? '',
      promoCode: promo && totals.discount > 0 ? promo.code : null,
      totals,
      payment: {
        method,
        status: status === 'rejected' ? method === 'cash' ? 'pending' : 'refunded' : paid ? 'paid' : 'pending',
        reference: method === 'cash' ? null : `seed_${Math.floor(rand() * 1e9).toString(36)}`
      },
      status,
      history: flow.map((s) => ({ status: s, at: addMinutes(createdAt, offsets[s]).toISOString() })),
      createdAt: createdAt.toISOString(),
      prepMinutes: prep,
      estimatedReadyAt: addMinutes(createdAt, prep).toISOString(),
      rejectReason: status === 'rejected' ? 'Item ran out' : undefined
    };
  };

  // History: previous 60 days
  for (let d = 60; d >= 1; d--) {
    const day = subDays(startOfDay(now), d);
    const weekend = [0, 5, 6].includes(day.getDay());
    const count = 7 + Math.floor(rand() * 6) + (weekend ? 5 : 0);
    for (let i = 0; i < count; i++) {
      const created = new Date(day);
      created.setHours(pick(BUSY_HOURS), Math.floor(rand() * 60));
      drafts.push(make(created, rand() < 0.03 ? 'rejected' : 'completed'));
    }
  }

  // Today: already completed orders
  for (let k = 0; k < 10; k++) {
    drafts.push(make(subMinutes(now, 40 + k * 24), 'completed'));
  }

  // Today: live kitchen queue
  drafts.push(make(subMinutes(now, 21), 'preparing', { type: 'takeaway', prep: 14, note: 'Sauce on the side' }));
  drafts.push(make(subMinutes(now, 13), 'ready', { type: 'takeaway', prep: 12 }));
  drafts.push(make(subMinutes(now, 8), 'preparing', { type: 'dine-in', tableNumber: 7, prep: 15 }));
  drafts.push(make(subMinutes(now, 4), 'confirmed', { type: 'takeaway', prep: 12 }));
  drafts.push(
    make(subMinutes(now, 2), 'received', { type: 'dine-in', tableNumber: 3, prep: 14, note: 'No onions on the burger please', method: 'cash' })
  );
  drafts.push(make(subMinutes(now, 1), 'received', { type: 'takeaway', prep: 12, method: 'online' }));

  const orders: Order[] = drafts.
  sort((a, b) => a.createdAt.localeCompare(b.createdAt)).
  map((d, i) => ({ ...d, id: `ord_seed_${i}`, number: `EW-${1001 + i}` })).
  reverse();

  return {
    categories: [...categories],
    menuItems: menuItems.map((m) => ({ ...m })),
    promotions: promotions.map((p) => ({ ...p })),
    tables: tables.map((t) => ({ ...t, status: t.number === 3 || t.number === 7 ? 'occupied' : 'available' })),
    orders,
    settings: { ...defaultSettings }
  };
}