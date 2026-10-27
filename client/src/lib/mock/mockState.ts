import {
  MOCK_CATEGORIES,
  MOCK_FOODS,
  MOCK_TABLES,
  MOCK_ORDERS,
  MOCK_INGREDIENTS,
  MOCK_RECIPES,
  MOCK_STOCK_MOVEMENTS,
  MOCK_FINANCE_SUMMARY,
  MOCK_STAFF,
} from './data';
import {
  Category,
  Food,
  Table,
  Order,
  Ingredient,
  FoodRecipe,
  StockMovement,
  FinanceSummary,
  OrderStatus,
  PaymentType,
} from '../../types';

// In-memory mutable arrays initialized with default mock data
class MockDatabase {
  categories: Category[] = [...MOCK_CATEGORIES];
  foods: Food[] = [...MOCK_FOODS];
  tables: Table[] = [...MOCK_TABLES];
  orders: Order[] = [...MOCK_ORDERS];
  ingredients: Ingredient[] = [...MOCK_INGREDIENTS];
  recipes: FoodRecipe[] = [...MOCK_RECIPES];
  stockMovements: StockMovement[] = [...MOCK_STOCK_MOVEMENTS];
  financeSummary: FinanceSummary = { ...MOCK_FINANCE_SUMMARY };
  staff = [...MOCK_STAFF];
  orderCounter = 106;

  // Listeners for real-time kitchen WebSocket simulation
  private listeners: ((event: any) => void)[] = [];

  subscribe(listener: (event: any) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  broadcast(event: any) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error(e);
      }
    });
  }

  addOrder(payload: {
    table?: string | null;
    table_or_phone: string;
    order_type: 'dine_in' | 'takeaway';
    waiter_name: string;
    payment_type: PaymentType;
    service_fee_percent: number;
    items: { food: string; quantity: number }[];
    notes?: string;
  }): Order {
    const orderNum = this.orderCounter++;
    const orderItems = payload.items.map((it) => {
      const foodItem = this.foods.find((f) => f.id === it.food);
      const unit_price = foodItem ? foodItem.price : 0;
      return {
        food: it.food,
        food_name: foodItem ? foodItem.name : 'Nomaʼlum taom',
        quantity: it.quantity,
        unit_price,
        line_total: unit_price * it.quantity,
        station: foodItem?.station || 'kitchen',
      };
    });

    const subtotal = orderItems.reduce((acc, it) => acc + it.line_total, 0);
    const service_fee_amount = Math.round((subtotal * (payload.service_fee_percent || 0)) / 100);
    const total_price = subtotal + service_fee_amount;

    // Find table details if dine_in
    let tableNum: number | null = null;
    let hall: string | undefined = undefined;
    if (payload.table) {
      const tbl = this.tables.find((t) => t.id === payload.table);
      if (tbl) {
        tableNum = tbl.number;
        hall = tbl.hall;
        tbl.is_occupied = true;
        tbl.current_total = total_price;
        tbl.occupied_since = new Date().toISOString();
      }
    }

    const newOrder: Order = {
      id: `ord_${orderNum}`,
      order_number: orderNum,
      table: payload.table || null,
      table_number: tableNum,
      hall,
      table_or_phone: payload.table_or_phone,
      order_type: payload.order_type,
      waiter_name: payload.waiter_name || 'Ofitsiant',
      status: 'new',
      status_display: 'Yangi',
      payment_type: payload.payment_type,
      service_fee_percent: payload.service_fee_percent,
      subtotal,
      service_fee_amount,
      total_price,
      items: orderItems,
      notes: payload.notes,
      created_at: new Date().toISOString(),
    };

    if (payload.table) {
      const tbl = this.tables.find((t) => t.id === payload.table);
      if (tbl) {
        tbl.active_order_id = newOrder.id;
      }
    }

    this.orders.unshift(newOrder);

    // Update finance metrics
    this.financeSummary.total_orders += 1;
    this.financeSummary.total_revenue += total_price;
    if (payload.payment_type === 'cash') this.financeSummary.revenue_by_payment.cash += total_price;
    if (payload.payment_type === 'card') this.financeSummary.revenue_by_payment.card += total_price;
    if (payload.payment_type === 'debt') this.financeSummary.revenue_by_payment.debt += total_price;

    // Broadcast new order event to kitchen
    this.broadcast({
      type: 'new_order',
      order: newOrder,
    });

    return newOrder;
  }

  updateOrderStatus(orderId: string, status: OrderStatus): Order {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Buyurtma topilmadi');

    const old_status = order.status;
    order.status = status;
    switch (status) {
      case 'new':
        order.status_display = 'Yangi';
        break;
      case 'cooking':
        order.status_display = 'Tayyorlanmoqda';
        break;
      case 'ready':
        order.status_display = 'Tayyor';
        break;
      case 'delivered':
        order.status_display = 'Berildi';
        if (order.table) {
          const tbl = this.tables.find((t) => t.id === order.table);
          if (tbl) {
            tbl.is_occupied = false;
            tbl.current_total = 0;
            tbl.active_order_id = undefined;
          }
        }
        break;
      case 'canceled':
        order.status_display = 'Bekor qilingan';
        this.financeSummary.total_canceled += 1;
        if (order.table) {
          const tbl = this.tables.find((t) => t.id === order.table);
          if (tbl) {
            tbl.is_occupied = false;
            tbl.current_total = 0;
            tbl.active_order_id = undefined;
          }
        }
        break;
    }

    this.broadcast({
      type: 'order_status_changed',
      order_id: orderId,
      old_status,
      new_status: status,
      order,
    });

    return order;
  }
}

export const mockDb = new MockDatabase();
