import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  Flame,
  Coffee,
  X,
  CreditCard,
  Banknote,
  FileText,
  Percent,
  Phone,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { useSoundStore } from '../stores/soundStore';
import { getMenuByCategoryApi, getFoodsApi, getCategoriesApi } from '../features/menu/api';
import { getTablesMapApi } from '../features/tables/api';
import { createOrderApi, getActiveOrdersApi, updateOrderStatusApi } from '../features/orders/api';
import { Food, Category, Table, Station, Order, OrderStatus } from '../types';
import { formatMoney, formatPhone, getOrderElapsedTime } from '../lib/format';

export function PosPage() {
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // States
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [selectedStation, setSelectedStation] = useState<Station | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActiveOrdersDrawer, setShowActiveOrdersDrawer] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [orderSuccessAlert, setOrderSuccessAlert] = useState<{ id: string; orderNumber: number } | null>(null);

  // Stores
  const {
    items,
    orderType,
    selectedTableId,
    selectedTableNumber,
    selectedHall,
    takeawayPhone,
    waiterName,
    paymentType,
    serviceFeePercent,
    notes,
    addItem,
    removeItem,
    updateQuantity,
    setOrderType,
    setTable,
    setTakeawayPhone,
    setWaiterName,
    setPaymentType,
    setServiceFeePercent,
    setNotes,
    clearCart,
    getSubtotal,
    getServiceFeeAmount,
    getTotal,
    getItemCount,
  } = useCartStore();

  const { playSuccessSound } = useSoundStore();

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [f, c, t, orders] = await Promise.all([
          getFoodsApi(),
          getCategoriesApi(),
          getTablesMapApi(),
          getActiveOrdersApi(),
        ]);
        setFoods(f);
        setCategories(c);
        setTables(t);
        setActiveOrders(orders);
      } catch (e) {
        console.error('Failed to load POS data', e);
      }
    }
    loadData();
  }, []);

  // Keyboard Shortcuts: Ctrl+K search, Enter submit, Esc clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showActiveOrdersDrawer) setShowActiveOrdersDrawer(false);
        else if (tableModalOpen) setTableModalOpen(false);
        else setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showActiveOrdersDrawer, tableModalOpen]);

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchCategory = selectedCategory === 'cat_all' || food.category_id === selectedCategory;
      const matchStation = selectedStation === 'all' || food.station === selectedStation;
      const matchSearch =
        searchQuery.trim() === '' ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchCategory && matchStation && matchSearch;
    });
  }, [foods, selectedCategory, selectedStation, searchQuery]);

  // Handle Order Submit
  const handleCreateOrder = async () => {
    if (items.length === 0 || isSubmitting) return;

    if (orderType === 'dine_in' && !selectedTableId) {
      setTableModalOpen(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const tableDesc =
        orderType === 'dine_in'
          ? `Stol #${selectedTableNumber} (${selectedHall})`
          : takeawayPhone.trim() || 'Olib ketish';

      const payload = {
        table: orderType === 'dine_in' ? selectedTableId : null,
        table_or_phone: tableDesc,
        order_type: orderType,
        waiter_name: waiterName,
        payment_type: paymentType,
        service_fee_percent: serviceFeePercent,
        items: items.map((i) => ({ food: i.food, quantity: i.quantity })),
        notes,
      };

      const newOrder = await createOrderApi(payload);

      // Trigger Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#FF5A1F', '#10B981', '#F59E0B'],
      });

      playSuccessSound();
      setOrderSuccessAlert({ id: newOrder.id, orderNumber: newOrder.order_number });
      clearCart();

      // Refresh tables & active orders
      const [updatedTables, updatedActive] = await Promise.all([getTablesMapApi(), getActiveOrdersApi()]);
      setTables(updatedTables);
      setActiveOrders(updatedActive);
    } catch (e) {
      console.error('Failed to create order', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change active order status
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatusApi(orderId, status);
      const [updatedActive, updatedTables] = await Promise.all([getActiveOrdersApi(), getTablesMapApi()]);
      setActiveOrders(updatedActive);
      setTables(updatedTables);
    } catch (e) {
      console.error(e);
    }
  };

  // Tables grouped by hall
  const halls = useMemo(() => {
    const map: Record<string, Table[]> = {};
    tables.forEach((t) => {
      if (!map[t.hall]) map[t.hall] = [];
      map[t.hall].push(t);
    });
    return map;
  }, [tables]);

  return (
    <div className="h-full flex flex-col lg:flex-row overflow-hidden bg-[#FFF8F0] dark:bg-[#121212]">
      {/* LEFT SECTION (~65%): Catalog, Categories, Search, Food Grid */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-stone-200/80 dark:border-stone-800/80 overflow-hidden">
        {/* Top Control Bar */}
        <div className="p-3 sm:p-4 bg-white dark:bg-[#18181B] border-b border-stone-200/80 dark:border-stone-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search with Ctrl+K */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Taomlarni qidirish... (Ctrl+K)"
              className="w-full pl-10 pr-12 py-2 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5A1F] text-stone-900 dark:text-stone-100 placeholder:text-stone-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 text-stone-500">
                Ctrl+K
              </span>
            )}
          </div>

          {/* Right Header Buttons: Station filter chips + Active Orders Drawer trigger */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {/* Station Chips */}
            <div className="flex items-center p-1 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs">
              <button
                type="button"
                onClick={() => setSelectedStation('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  selectedStation === 'all'
                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                Hammasi
              </button>
              <button
                type="button"
                onClick={() => setSelectedStation('kitchen')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedStation === 'kitchen'
                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" /> Oshxona
              </button>
              <button
                type="button"
                onClick={() => setSelectedStation('mangal')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedStation === 'mangal'
                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                🥩 Mangal
              </button>
              <button
                type="button"
                onClick={() => setSelectedStation('bar')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
                  selectedStation === 'bar'
                    ? 'bg-[#FF5A1F] text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-blue-400" /> Bar
              </button>
            </div>

            {/* Active Orders Trigger */}
            <button
              type="button"
              onClick={() => setShowActiveOrdersDrawer(true)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:border-[#FF5A1F] flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5 text-[#FF5A1F]" />
              <span>Faol buyurtmalar</span>
              {activeOrders.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF5A1F] text-white text-[10px] flex items-center justify-center font-bold">
                  {activeOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Categories Bar (Horizontal Scrollable) */}
        <div className="px-3 sm:px-4 py-2.5 bg-stone-50 dark:bg-[#151518] border-b border-stone-200/80 dark:border-stone-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25 scale-102'
                  : 'bg-white dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/60 hover:border-[#FF5A1F]/40'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Foods Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
          {filteredFoods.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <Search className="w-10 h-10 mb-2 opacity-40" />
              <p className="font-semibold text-sm">Taomlar topilmadi</p>
              <p className="text-xs">Boshqa soʻz yoki toifani tanlab koʻring</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredFoods.map((food) => {
                const inCart = items.find((i) => i.food === food.id);
                return (
                  <div
                    key={food.id}
                    onClick={() => food.is_available && addItem(food)}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between select-none relative ${
                      food.is_available
                        ? 'bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800 hover:border-[#FF5A1F] hover:shadow-lg hover:-translate-y-0.5 cursor-pointer'
                        : 'bg-stone-100 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Food Image with Station Badge */}
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden bg-stone-100 dark:bg-stone-800">
                      <img
                        src={food.image_url}
                        alt={food.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {!food.is_available && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-[10px] uppercase tracking-wider">
                            Mavjud emas
                          </span>
                        </div>
                      )}
                      {inCart && (
                        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#FF5A1F] text-white font-black text-xs flex items-center justify-center shadow-lg ring-2 ring-white">
                          {inCart.quantity}
                        </div>
                      )}
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-900/80 backdrop-blur-md text-white">
                        {food.station === 'kitchen' ? '🔥 Oshxona' : food.station === 'mangal' ? '🥩 Mangal' : '🥤 Bar'}
                      </span>
                    </div>

                    {/* Food Content */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-heading font-bold text-sm text-stone-900 dark:text-white line-clamp-1 mb-1">
                          {food.name}
                        </h4>
                        {food.description && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400 line-clamp-1 mb-2">
                            {food.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
                        <span className="font-heading font-extrabold text-sm text-[#FF5A1F] tabular-nums">
                          {formatMoney(food.price)}
                        </span>
                        {food.is_available && (
                          <button
                            type="button"
                            aria-label={`${food.name} qoʻshish`}
                            className="w-6 h-6 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#FF5A1F] hover:bg-[#FF5A1F] hover:text-white flex items-center justify-center transition-colors shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION (~35%): Cart Panel */}
      <div className="w-full lg:w-96 xl:w-[420px] bg-white dark:bg-[#18181B] flex flex-col shrink-0 border-t lg:border-t-0 shadow-lg z-10">
        {/* Cart Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between">
          <div>
            <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white flex items-center gap-2">
              Buyurtma
              {getItemCount() > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] font-bold">
                  {getItemCount()} dona
                </span>
              )}
            </h3>
            <p className="text-[11px] text-stone-400">Ofitsiant: {waiterName}</p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="text-stone-400 hover:text-red-500 text-xs flex items-center gap-1 transition-colors p-1"
              title="Savatchani tozalash"
            >
              <Trash2 className="w-3.5 h-3.5" /> Tozalash
            </button>
          )}
        </div>

        {/* Order Type Toggle (Zalda vs Olib ketish) */}
        <div className="p-3 bg-stone-50 dark:bg-stone-900/60 border-b border-stone-200/80 dark:border-stone-800/80 space-y-2.5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-200/70 dark:bg-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setOrderType('dine_in')}
              className={`py-1.5 rounded-lg transition-all ${
                orderType === 'dine_in'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              🍽️ Zalda
            </button>
            <button
              type="button"
              onClick={() => setOrderType('takeaway')}
              className={`py-1.5 rounded-lg transition-all ${
                orderType === 'takeaway'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              🥡 Olib ketish
            </button>
          </div>

          {/* Dine-in Table Selector vs Takeaway Phone */}
          {orderType === 'dine_in' ? (
            <button
              type="button"
              onClick={() => setTableModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 flex items-center justify-between text-xs hover:border-[#FF5A1F] transition-colors"
            >
              <span className="text-stone-500">Tanlangan stol:</span>
              <span className="font-bold text-[#FF5A1F]">
                {selectedTableNumber ? `Stol #${selectedTableNumber} (${selectedHall})` : 'Stol tanlash ➔'}
              </span>
            </button>
          ) : (
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={takeawayPhone}
                onChange={(e) => setTakeawayPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs font-mono focus:outline-hidden focus:border-[#FF5A1F]"
              />
            </div>
          )}
        </div>

        {/* Cart Item Lines */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5A1F] flex items-center justify-center mb-3">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="font-semibold text-sm text-stone-700 dark:text-stone-300">Savatcha boʻsh</p>
              <p className="text-xs max-w-[200px] mt-1">Menyudan taomlarni tanlang yoki Ctrl+K bilan qidiring</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.food}
                className="p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/50 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-stone-900 dark:text-white truncate">{item.food_name}</p>
                  <p className="text-[11px] text-stone-400 tabular-nums">
                    {formatMoney(item.unit_price)} x {item.quantity}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.food, item.quantity - 1)}
                    className="w-6 h-6 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-red-500"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center font-bold text-xs tabular-nums">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.food, item.quantity + 1)}
                    className="w-6 h-6 rounded-md bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-600 dark:text-stone-300 hover:text-[#FF5A1F]"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <div className="text-right shrink-0 w-20">
                  <p className="font-bold text-xs text-stone-900 dark:text-white tabular-nums">
                    {formatMoney(item.line_total)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.food)}
                  className="text-stone-400 hover:text-red-500 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Notes Input */}
        {items.length > 0 && (
          <div className="px-3 py-1">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Oshxona uchun izoh (masalan: piyozsiz)..."
              className="w-full px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-xs focus:outline-hidden focus:border-[#FF5A1F]"
            />
          </div>
        )}

        {/* Calculation Summary & Payment */}
        <div className="p-4 border-t border-stone-200/80 dark:border-stone-800/80 bg-stone-50/70 dark:bg-stone-900/80 space-y-3">
          {/* Subtotal & Service fee */}
          <div className="space-y-1.5 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex justify-between">
              <span>Oraliq jami:</span>
              <span className="font-semibold text-stone-900 dark:text-white tabular-nums">
                {formatMoney(getSubtotal())}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span>Xizmat haqi:</span>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={serviceFeePercent}
                  onChange={(e) => setServiceFeePercent(parseInt(e.target.value) || 0)}
                  className="w-12 px-1.5 py-0.5 rounded border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-center font-bold text-xs"
                />
                <span>%</span>
              </div>
              <span className="font-semibold text-stone-900 dark:text-white tabular-nums">
                {formatMoney(getServiceFeeAmount())}
              </span>
            </div>

            <div className="flex justify-between text-base font-heading font-black text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-800">
              <span>Umumiy jami:</span>
              <span className="text-[#FF5A1F] text-lg tabular-nums">{formatMoney(getTotal())}</span>
            </div>
          </div>

          {/* Payment Type Segmented Control */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-stone-200/80 dark:bg-stone-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setPaymentType('cash')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentType === 'cash'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <Banknote className="w-3.5 h-3.5 text-emerald-500" /> Naqd
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('card')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentType === 'card'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-blue-500" /> Karta
            </button>
            <button
              type="button"
              onClick={() => setPaymentType('debt')}
              className={`py-2 rounded-lg flex items-center justify-center gap-1 transition-all ${
                paymentType === 'debt'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" /> Nasiya
            </button>
          </div>

          {/* Big Primary Submit Button */}
          <button
            type="button"
            disabled={items.length === 0 || isSubmitting}
            onClick={handleCreateOrder}
            className="w-full py-3.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] disabled:opacity-40 text-white font-bold text-sm shadow-xl shadow-[#FF5A1F]/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4" /> Buyurtma berish (Enter)
              </>
            )}
          </button>
        </div>
      </div>

      {/* MODAL: Visual Table Selector */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Stol tanlash</h3>
                <p className="text-xs text-stone-400">Buyurtma biriktiriladigan stolni bosing</p>
              </div>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-6">
              {Object.entries(halls).map(([hallName, hallTables]) => (
                <div key={hallName}>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-heading font-bold text-sm text-stone-800 dark:text-stone-200">{hallName}</h4>
                    <span className="text-xs text-stone-400">
                      {hallTables.filter((t) => !t.is_occupied).length} ta boʻsh stol
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {hallTables.map((tbl) => {
                      const isCurrent = selectedTableId === tbl.id;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => {
                            setTable(tbl.id, tbl.number, tbl.hall);
                            setTableModalOpen(false);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-orange-50 dark:bg-orange-950/60 border-[#FF5A1F] ring-2 ring-[#FF5A1F]'
                              : tbl.is_occupied
                              ? 'bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/50 hover:border-red-400'
                              : 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-heading font-extrabold text-sm text-stone-900 dark:text-white">
                              #{tbl.number}
                            </span>
                            <span
                              className={`w-2 h-2 rounded-full ${
                                tbl.is_occupied ? 'bg-red-500' : 'bg-emerald-500'
                              }`}
                            />
                          </div>
                          <p className="text-[10px] text-stone-400">{tbl.seats} kishilik</p>
                          {tbl.is_occupied && tbl.current_total ? (
                            <p className="text-[10px] font-bold text-red-600 dark:text-red-400 mt-1 tabular-nums">
                              {formatMoney(tbl.current_total)}
                            </p>
                          ) : (
                            <p className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">Boʻsh</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: Faol buyurtmalar */}
      {showActiveOrdersDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-stone-900 h-full shadow-2xl flex flex-col border-l border-stone-200 dark:border-stone-800">
            <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Faol buyurtmalar</h3>
                <p className="text-xs text-stone-400">{activeOrders.length} ta faol buyurtma</p>
              </div>
              <button
                type="button"
                onClick={() => setShowActiveOrdersDrawer(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeOrders.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                  <Receipt className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm font-semibold">Faol buyurtmalar mavjud emas</p>
                </div>
              ) : (
                activeOrders.map((ord) => {
                  const elapsed = getOrderElapsedTime(ord.created_at);
                  return (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 space-y-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-black text-sm text-stone-900 dark:text-white">
                            #{ord.order_number}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">{ord.table_or_phone}</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            ord.status === 'cooking'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                              : ord.status === 'ready'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {ord.status_display}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="text-xs space-y-1 text-stone-600 dark:text-stone-300">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span>
                              {it.quantity}x {it.food_name}
                            </span>
                            <span className="tabular-nums font-medium">{formatMoney(it.line_total)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-700/60 text-xs">
                        <div className="flex items-center gap-1.5 text-stone-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="font-mono">{elapsed.text}</span>
                        </div>
                        <span className="font-heading font-bold text-sm text-[#FF5A1F] tabular-nums">
                          {formatMoney(ord.total_price)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(ord.id, 'delivered')}
                          className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Berildi
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Buyurtmani bekor qilishni tasdiqlaysizmi?")) {
                              handleUpdateStatus(ord.id, 'canceled');
                            }
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-600 dark:text-red-400 font-bold text-xs transition-colors"
                        >
                          Bekor qilish
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/orders/${ord.id}/receipt`)}
                          className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:text-[#FF5A1F] transition-colors"
                          title="Chekni koʻrish"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOAST: Order Success Alert with Receipt button */}
      {orderSuccessAlert && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white p-4 rounded-2xl shadow-2xl border border-stone-700 flex items-center gap-4 animate-in slide-in-from-bottom duration-300">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-heading font-bold text-sm">Buyurtma #{orderSuccessAlert.orderNumber} qabul qilindi!</p>
            <p className="text-xs text-stone-400">Oshxonaga uzatildi</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(`/orders/${orderSuccessAlert.id}/receipt`)}
              className="px-3 py-1.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Receipt className="w-3.5 h-3.5" /> Chekni ochish
            </button>
            <button
              type="button"
              onClick={() => setOrderSuccessAlert(null)}
              className="text-stone-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
