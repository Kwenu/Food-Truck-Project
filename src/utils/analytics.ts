import {
  addDays,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks } from
'date-fns';
import type { Order } from '../types/order';
import { round2 } from './currency';

export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export function revenueOrders(orders: Order[]): Order[] {
  return orders.filter((o) => o.status !== 'rejected');
}

export function ordersOnDay(orders: Order[], day: Date): Order[] {
  return orders.filter((o) => isSameDay(new Date(o.createdAt), day));
}

export function sumSales(orders: Order[]): number {
  return round2(revenueOrders(orders).reduce((s, o) => s + o.totals.total, 0));
}

export function salesByHour(orders: Order[]): {hour: string;sales: number;orders: number;}[] {
  const hours = Array.from({ length: 13 }, (_, i) => i + 10);
  return hours.map((h) => {
    const inHour = revenueOrders(orders).filter((o) => new Date(o.createdAt).getHours() === h);
    const label = h === 12 ? '12p' : h > 12 ? `${h - 12}p` : `${h}a`;
    return { hour: label, sales: round2(inHour.reduce((s, o) => s + o.totals.total, 0)), orders: inHour.length };
  });
}

export interface PopularItem {
  itemId: string;
  name: string;
  image: string;
  quantity: number;
  revenue: number;
}

export function popularItems(orders: Order[], limit = 5): PopularItem[] {
  const map = new Map<string, PopularItem>();
  revenueOrders(orders).forEach((o) =>
  o.lines.forEach((l) => {
    const cur = map.get(l.itemId) ?? { itemId: l.itemId, name: l.name, image: l.image, quantity: 0, revenue: 0 };
    cur.quantity += l.quantity;
    cur.revenue = round2(cur.revenue + l.unitPrice * l.quantity);
    map.set(l.itemId, cur);
  })
  );
  return Array.from(map.values()).
  sort((a, b) => b.quantity - a.quantity).
  slice(0, limit);
}

export interface TypeSplit {
  takeaway: {count: number;sales: number;};
  dineIn: {count: number;sales: number;};
}

export function typeSplit(orders: Order[]): TypeSplit {
  const valid = revenueOrders(orders);
  const t = valid.filter((o) => o.type === 'takeaway');
  const d = valid.filter((o) => o.type === 'dine-in');
  return {
    takeaway: { count: t.length, sales: sumSales(t) },
    dineIn: { count: d.length, sales: sumSales(d) }
  };
}

export interface SalesBucket {
  key: string;
  label: string;
  start: number;
  end: number;
  takeaway: number;
  dineIn: number;
  total: number;
  orders: number;
}

export function salesBuckets(orders: Order[], period: ReportPeriod, now: Date): SalesBucket[] {
  const buckets: SalesBucket[] = [];
  const push = (start: Date, end: Date, label: string) =>
  buckets.push({ key: start.toISOString(), label, start: start.getTime(), end: end.getTime(), takeaway: 0, dineIn: 0, total: 0, orders: 0 });

  if (period === 'daily') {
    for (let i = 13; i >= 0; i--) {
      const s = startOfDay(subDays(now, i));
      push(s, addDays(s, 1), format(s, 'MMM d'));
    }
  } else if (period === 'weekly') {
    for (let i = 7; i >= 0; i--) {
      const s = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 });
      push(s, addWeeks(s, 1), `Wk ${format(s, 'MMM d')}`);
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const s = startOfMonth(subMonths(now, i));
      push(s, addMonths(s, 1), format(s, 'MMM yyyy'));
    }
  }

  revenueOrders(orders).forEach((o) => {
    const t = new Date(o.createdAt).getTime();
    const b = buckets.find((x) => t >= x.start && t < x.end);
    if (!b) return;
    if (o.type === 'takeaway') b.takeaway = round2(b.takeaway + o.totals.total);else
    b.dineIn = round2(b.dineIn + o.totals.total);
    b.total = round2(b.total + o.totals.total);
    b.orders += 1;
  });
  return buckets;
}

export function ordersInBuckets(orders: Order[], buckets: SalesBucket[]): Order[] {
  if (buckets.length === 0) return [];
  const start = buckets[0].start;
  const end = buckets[buckets.length - 1].end;
  return orders.filter((o) => {
    const t = new Date(o.createdAt).getTime();
    return t >= start && t < end;
  });
}