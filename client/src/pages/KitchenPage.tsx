import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChefHat,
  Clock,
  CheckCircle,
  Flame,
  Coffee,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Radio,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';
import { Order, OrderStatus, Station } from '../types';
import { getActiveOrdersApi, updateOrderStatusApi } from '../features/orders/api';
import { useKitchenSocket } from '../hooks/useKitchenSocket';
import { useSoundStore } from '../stores/soundStore';
import { getOrderElapsedTime, formatMoney } from '../lib/format';

export function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStation, setSelectedStation] = useState<Station | 'all'>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [ticker, setTicker] = useState(0); // Tick every second for live timers

  const { soundEnabled, toggleSound, playAlertSound } = useSoundStore();

  // Load initial active orders
  const refreshOrders = useCallback(async () => {
    try {
      const active = await getActiveOrdersApi();
      setOrders(active);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    refreshOrders();
  }, [refreshOrders]);

  // Live timer interval (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setTicker((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // WebSocket hook integration
  const { isConnected, newOrderAlert, clearNewOrderBadge } = useKitchenSocket({
    onNewOrder: (newOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === newOrder.id)) return prev;
        return [newOrder, ...prev];
      });
    },
    onOrderStatusChanged: (orderId, _oldStatus, newStatus, updatedOrder) => {
      setOrders((prev) => {
        if (newStatus === 'delivered' || newStatus === 'canceled') {
          return prev.filter((o) => o.id !== orderId);
        }
        return prev.map((o) => (o.id === orderId ? updatedOrder : o));
      });
    },
  });

  // Handle optimistic status transition
  const handleMoveStatus = async (orderId: string, currentStatus: OrderStatus) => {
    let nextStatus: OrderStatus = 'cooking';
    if (currentStatus === 'new') nextStatus = 'cooking';
    else if (currentStatus === 'cooking') nextStatus = 'ready';
    else if (currentStatus === 'ready') nextStatus = 'delivered';

    // Optimistic UI update
    setOrders((prev) =>
      nextStatus === 'delivered'
        ? prev.filter((o) => o.id !== orderId)
        : prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    try {
      await updateOrderStatusApi(orderId, nextStatus);
    } catch (e) {
      console.error(e);
      refreshOrders(); // Rollback on error
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Filter orders by station if items match station
  const filteredOrders = useMemo(() => {
    if (selectedStation === 'all') return orders;
    return orders.filter((o) =>
      o.items.some((it) => it.station === selectedStation || !it.station)
    );
  }, [orders, selectedStation]);

  // Kanban Columns: Yangi, Tayyorlanmoqda, Tayyor
  const columns: { key: OrderStatus; label: string; color: string; count: number }[] = [
    {
      key: 'new',
      label: 'Yangi',
      color: 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400',
      count: filteredOrders.filter((o) => o.status === 'new').length,
    },
    {
      key: 'cooking',
      label: 'Tayyorlanmoqda',
      color: 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400',
      count: filteredOrders.filter((o) => o.status === 'cooking').length,
    },
    {
      key: 'ready',
      label: 'Tayyor',
      color: 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400',
      count: filteredOrders.filter((o) => o.status === 'ready').length,
    },
  ];

  return (
    <div
      className={`h-full flex flex-col bg-[#141414] text-stone-100 overflow-hidden ${
        isFullscreen ? 'p-6 text-lg' : 'p-3 sm:p-5'
      }`}
    >
      {/* Aria-live announcement for screen readers & new orders */}
      <div aria-live="polite" className="sr-only">
        {newOrderAlert}
      </div>

      {/* Kitchen Header Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-stone-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FF5A1F] flex items-center justify-center text-white shadow-lg shadow-[#FF5A1F]/30">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-heading font-black text-xl sm:text-2xl tracking-tight text-white flex items-center gap-2">
              Oshxona KDS
              {/* WebSocket Indicator */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  isConnected
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                    : 'bg-red-950/80 text-red-400 border border-red-800'
                }`}
                title={isConnected ? 'WebSocket ulangan' : 'WebSocket uzilgan'}
              >
                <Radio className={`w-3 h-3 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
                {isConnected ? 'Ulangan' : 'Uzilgan'}
              </span>
            </h1>
            <p className="text-xs text-stone-400">Jonli buyurtmalar oqimi va tayyorlash jarayoni</p>
          </div>
        </div>

        {/* Station Filters & Quick Settings */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Station Selector */}
          <div className="flex items-center p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSelectedStation('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                selectedStation === 'all' ? 'bg-[#FF5A1F] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              Barchasi ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedStation('kitchen')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedStation === 'kitchen' ? 'bg-[#FF5A1F] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" /> Oshxona
            </button>
            <button
              type="button"
              onClick={() => setSelectedStation('mangal')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedStation === 'mangal' ? 'bg-[#FF5A1F] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              🥩 Mangal
            </button>
            <button
              type="button"
              onClick={() => setSelectedStation('bar')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                selectedStation === 'bar' ? 'bg-[#FF5A1F] text-white' : 'text-stone-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-blue-400" /> Bar
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label="Ovozli signallar"
            className={`p-2 rounded-xl border border-stone-800 text-xs font-semibold flex items-center gap-1.5 ${
              soundEnabled ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800' : 'bg-stone-900 text-stone-400'
            }`}
            title={soundEnabled ? "Ovoz yoqilgan" : "Ovoz o'chirilgan"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label="To'liq ekran"
            className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white transition-colors"
            title="To'liq ekranga o'tish"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* New Order Banner Notice if newly arrived */}
      {newOrderAlert && (
        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-[#FF5A1F] to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-between shadow-xl animate-in fade-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 fill-white animate-spin" />
            <span>{newOrderAlert}</span>
          </div>
          <button
            type="button"
            onClick={clearNewOrderBadge}
            className="text-white/80 hover:text-white text-xs underline"
          >
            Yopish
          </button>
        </div>
      )}

      {/* KANBAN BOARD: 3 Columns */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 overflow-hidden">
        {columns.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.status === col.key);

          return (
            <div
              key={col.key}
              className="flex flex-col bg-stone-900/90 rounded-2xl border border-stone-800 overflow-hidden shadow-md"
            >
              {/* Column Header */}
              <div
                className={`p-3.5 border-b border-stone-800 flex items-center justify-between font-heading font-black text-sm ${col.color}`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-current"></span>
                  <span>{col.label}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-stone-900/60 font-mono text-xs font-bold">
                  {col.count}
                </span>
              </div>

              {/* Order Cards List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-3">
                {colOrders.length === 0 ? (
                  <div className="h-40 flex flex-col items-center justify-center text-center text-stone-600 text-xs">
                    <p>Hozircha buyurtma yoʻq</p>
                  </div>
                ) : (
                  colOrders.map((order) => {
                    const elapsed = getOrderElapsedTime(order.created_at);

                    return (
                      <div
                        key={order.id}
                        className={`p-4 rounded-2xl border bg-stone-950 transition-all shadow-md relative overflow-hidden ${
                          elapsed.isDanger
                            ? 'border-red-500/80 ring-2 ring-red-500/30'
                            : elapsed.isWarning
                            ? 'border-amber-500/70'
                            : 'border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        {/* Header: Order Number, Table, Elapsed Timer */}
                        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-stone-800/80">
                          <div>
                            <span className="font-heading font-black text-lg text-white">
                              #{order.order_number}
                            </span>
                            <p className="text-xs font-medium text-stone-400">{order.table_or_phone}</p>
                          </div>

                          {/* Elapsed Timer with Warning Colors */}
                          <div
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold ${
                              elapsed.isDanger
                                ? 'bg-red-950/80 text-red-400 border border-red-800'
                                : elapsed.isWarning
                                ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                                : 'bg-stone-900 text-stone-300 border border-stone-800'
                            }`}
                          >
                            <Clock className={`w-3.5 h-3.5 ${elapsed.isDanger ? 'animate-pulse text-red-400' : ''}`} />
                            <span>{elapsed.text}</span>
                            {elapsed.isDanger && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-4">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-stone-800 text-[#FF5A1F] font-bold text-xs flex items-center justify-center shrink-0">
                                  {it.quantity}x
                                </span>
                                <span className="font-semibold text-stone-200">{it.food_name}</span>
                              </div>
                              {it.station && (
                                <span className="text-[10px] text-stone-500 shrink-0">
                                  {it.station === 'kitchen' ? '🔥' : it.station === 'mangal' ? '🥩' : '🥤'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Notes if any */}
                        {order.notes && (
                          <div className="mb-3 p-2 rounded-xl bg-amber-950/30 border border-amber-900/50 text-[11px] text-amber-300 font-medium">
                            📝 {order.notes}
                          </div>
                        )}

                        {/* Action Advance Button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => handleMoveStatus(order.id, order.status)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                              order.status === 'new'
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
                                : order.status === 'cooking'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                                : 'bg-[#FF5A1F] hover:bg-[#E4480E] text-white shadow-[#FF5A1F]/30'
                            }`}
                          >
                            {order.status === 'new' ? (
                              <>
                                <Flame className="w-4 h-4" /> Tayyorlashga olish
                              </>
                            ) : order.status === 'cooking' ? (
                              <>
                                <CheckCircle className="w-4 h-4" /> Tayyor boʻldi
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4" /> Ofitsiantga topshirildi
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
