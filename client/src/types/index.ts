export type Role = 'admin' | 'cashier' | 'chef';

export interface Tenant {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  currency?: string;
}

export interface UserProfile {
  user_id: string;
  username: string;
  full_name: string;
  role: Role;
  tenant: Tenant;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export type Station = 'kitchen' | 'mangal' | 'bar';

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
}

export interface Food {
  id: string;
  name: string;
  category_id: string;
  category_name?: string;
  price: number;
  cost_price?: number;
  is_available: boolean;
  image_url: string;
  station: Station;
  description?: string;
}

export interface Table {
  id: string;
  number: number;
  hall: string; // e.g. "Asosiy zal", "2-qavat", "Kabina"
  seats: number;
  is_occupied: boolean;
  current_total?: number;
  active_order_id?: string;
  occupied_since?: string;
  x?: number;
  y?: number;
}

export type OrderStatus = 'new' | 'cooking' | 'ready' | 'delivered' | 'canceled';

export type PaymentType = 'cash' | 'card' | 'debt';

export interface OrderItem {
  id?: string;
  food: string; // food id
  food_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  station?: Station;
}

export interface Order {
  id: string;
  order_number: number;
  table?: string | null;
  table_number?: number | null;
  hall?: string;
  table_or_phone: string;
  order_type: 'dine_in' | 'takeaway';
  waiter_name: string;
  status: OrderStatus;
  status_display: string;
  payment_type: PaymentType;
  service_fee_percent: number;
  subtotal: number;
  service_fee_amount: number;
  total_price: number;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export type UnitType = 'kg' | 'gramm' | 'dona' | 'litr';

export interface Ingredient {
  id: string;
  name: string;
  unit: UnitType;
  stock_quantity: number;
  min_limit: number;
  cost_per_unit: number;
  last_updated?: string;
}

export interface RecipeLine {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: UnitType;
  quantity_per_portion: number;
  cost: number;
}

export interface FoodRecipe {
  food_id: string;
  food_name: string;
  selling_price: number;
  lines: RecipeLine[];
  total_cost: number;
}

export type MovementType = 'kirim' | 'sotuv' | 'isrof' | 'tuzatish';

export interface StockMovement {
  id: string;
  ingredient_id: string;
  ingredient_name: string;
  movement_type: MovementType;
  quantity: number;
  unit: UnitType;
  operator_name: string;
  notes?: string;
  created_at: string;
}

export interface TopSellingItem {
  food__name: string;
  total_qty: number;
  total_amount: number;
}

export interface WaiterStat {
  name: string;
  orders_count: number;
  total_revenue: number;
  service_fee: number;
}

export interface FinanceSummary {
  date: string;
  total_orders: number;
  total_revenue: number;
  total_canceled: number;
  net_profit: number;
  low_stock_count: number;
  revenue_by_payment: {
    cash: number;
    card: number;
    debt: number;
  };
  revenue_by_hour: {
    hour: string;
    amount: number;
  }[];
  top_selling_items: TopSellingItem[];
  waiters: WaiterStat[];
  ai_summary?: string;
}

export interface ShiftInfo {
  isOpen: boolean;
  openedAt?: string;
  openedBy?: string;
  cashInDrawer: number;
  initialCash: number;
}
