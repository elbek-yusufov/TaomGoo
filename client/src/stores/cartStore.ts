import { create } from 'zustand';
import { Food, OrderItem, PaymentType } from '../types';

interface CartState {
  items: OrderItem[];
  orderType: 'dine_in' | 'takeaway';
  selectedTableId: string | null;
  selectedTableNumber: number | null;
  selectedHall: string | null;
  takeawayPhone: string;
  waiterName: string;
  paymentType: PaymentType;
  serviceFeePercent: number;
  notes: string;

  // Actions
  addItem: (food: Food) => void;
  removeItem: (foodId: string) => void;
  updateQuantity: (foodId: string, quantity: number) => void;
  setOrderType: (type: 'dine_in' | 'takeaway') => void;
  setTable: (tableId: string | null, tableNumber: number | null, hall: string | null) => void;
  setTakeawayPhone: (phone: string) => void;
  setWaiterName: (name: string) => void;
  setPaymentType: (type: PaymentType) => void;
  setServiceFeePercent: (percent: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed totals
  getSubtotal: () => number;
  getServiceFeeAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

const STORAGE_KEY_CART = 'taomgo_pos_cart';

function loadStoredCart(): Partial<CartState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CART);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load cart from localStorage', e);
  }
  return {};
}

const stored = loadStoredCart();

export const useCartStore = create<CartState>((set, get) => {
  const save = (state: Partial<CartState>) => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CART,
        JSON.stringify({
          items: state.items,
          orderType: state.orderType,
          selectedTableId: state.selectedTableId,
          selectedTableNumber: state.selectedTableNumber,
          selectedHall: state.selectedHall,
          takeawayPhone: state.takeawayPhone,
          waiterName: state.waiterName,
          paymentType: state.paymentType,
          serviceFeePercent: state.serviceFeePercent,
          notes: state.notes,
        })
      );
    } catch (e) {
      console.error(e);
    }
  };

  return {
    items: stored.items || [],
    orderType: stored.orderType || 'dine_in',
    selectedTableId: stored.selectedTableId || 'tbl_2',
    selectedTableNumber: stored.selectedTableNumber || 2,
    selectedHall: stored.selectedHall || 'Asosiy zal',
    takeawayPhone: stored.takeawayPhone || '+998 ',
    waiterName: stored.waiterName || 'Rustam Aliyev',
    paymentType: stored.paymentType || 'cash',
    serviceFeePercent: stored.serviceFeePercent !== undefined ? stored.serviceFeePercent : 10,
    notes: stored.notes || '',

    addItem: (food: Food) => {
      if (!food.is_available) return;

      set((state) => {
        const existingIdx = state.items.findIndex((item) => item.food === food.id);
        let nextItems: OrderItem[];

        if (existingIdx >= 0) {
          nextItems = state.items.map((item, idx) => {
            if (idx === existingIdx) {
              const qty = item.quantity + 1;
              return { ...item, quantity: qty, line_total: qty * item.unit_price };
            }
            return item;
          });
        } else {
          nextItems = [
            ...state.items,
            {
              food: food.id,
              food_name: food.name,
              quantity: 1,
              unit_price: food.price,
              line_total: food.price,
              station: food.station,
            },
          ];
        }

        save({ ...state, items: nextItems });
        return { items: nextItems };
      });
    },

    removeItem: (foodId: string) => {
      set((state) => {
        const nextItems = state.items.filter((item) => item.food !== foodId);
        save({ ...state, items: nextItems });
        return { items: nextItems };
      });
    },

    updateQuantity: (foodId: string, quantity: number) => {
      set((state) => {
        let nextItems: OrderItem[];
        if (quantity <= 0) {
          nextItems = state.items.filter((item) => item.food !== foodId);
        } else {
          nextItems = state.items.map((item) => {
            if (item.food === foodId) {
              return { ...item, quantity, line_total: quantity * item.unit_price };
            }
            return item;
          });
        }
        save({ ...state, items: nextItems });
        return { items: nextItems };
      });
    },

    setOrderType: (type) => {
      set((state) => {
        // If switching to takeaway, service fee can be 0 or maintained
        const serviceFeePercent = type === 'takeaway' ? 0 : 10;
        const next = { ...state, orderType: type, serviceFeePercent };
        save(next);
        return next;
      });
    },

    setTable: (tableId, tableNumber, hall) => {
      set((state) => {
        const next = { ...state, selectedTableId: tableId, selectedTableNumber: tableNumber, selectedHall: hall };
        save(next);
        return next;
      });
    },

    setTakeawayPhone: (phone) => {
      set((state) => {
        const next = { ...state, takeawayPhone: phone };
        save(next);
        return next;
      });
    },

    setWaiterName: (name) => {
      set((state) => {
        const next = { ...state, waiterName: name };
        save(next);
        return next;
      });
    },

    setPaymentType: (type) => {
      set((state) => {
        const next = { ...state, paymentType: type };
        save(next);
        return next;
      });
    },

    setServiceFeePercent: (percent) => {
      set((state) => {
        const next = { ...state, serviceFeePercent: Math.max(0, percent) };
        save(next);
        return next;
      });
    },

    setNotes: (notes) => {
      set((state) => {
        const next = { ...state, notes };
        save(next);
        return next;
      });
    },

    clearCart: () => {
      set((state) => {
        const next = { ...state, items: [], notes: '' };
        save(next);
        return next;
      });
    },

    getSubtotal: () => {
      return get().items.reduce((acc, item) => acc + item.line_total, 0);
    },

    getServiceFeeAmount: () => {
      const subtotal = get().getSubtotal();
      const percent = get().serviceFeePercent;
      return Math.round((subtotal * percent) / 100);
    },

    getTotal: () => {
      return get().getSubtotal() + get().getServiceFeeAmount();
    },

    getItemCount: () => {
      return get().items.reduce((acc, item) => acc + item.quantity, 0);
    },
  };
});
