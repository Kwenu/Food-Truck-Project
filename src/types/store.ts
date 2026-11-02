import type { Category, MenuItem, Promotion } from './menu';
import type { Order } from './order';
import type { DiningTable } from './table';
import type { Settings } from './settings';

export interface StoreState {
  categories: Category[];
  menuItems: MenuItem[];
  promotions: Promotion[];
  tables: DiningTable[];
  orders: Order[];
  settings: Settings;
}