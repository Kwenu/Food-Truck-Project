export interface Category {
  id: string;
  name: string;
  sortOrder: number;
}

export type MenuTag = 'popular' | 'chef';

export interface AddOn {
  id: string;
  label: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
  veg: boolean;
  tags: MenuTag[];
  /** Visible on the customer menu */
  enabled: boolean;
  soldOut: boolean;
  prepMinutes: number;
  addOns: AddOn[];
}

export type PromotionType = 'percent' | 'flat';

export interface Promotion {
  id: string;
  code: string;
  title: string;
  description: string;
  type: PromotionType;
  value: number;
  minSubtotal: number;
  active: boolean;
}