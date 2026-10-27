import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Plus,
  Clock,
  Receipt,
  CheckCircle,
  XCircle,
  Boxes,
  Eye,
  Box,
  X,
  Edit2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { Table, Order } from '../types';
import { getTablesMapApi, createTableApi, updateTableApi, deleteTableApi } from '../features/tables/api';
import { getOrderByIdApi, updateOrderStatusApi } from '../features/orders/api';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { formatMoney, getOrderElapsedTime } from '../lib/format';
import { Tables3DPlan } from '../components/three/Tables3DPlan';

export function TablesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setTable, setOrderType } = useCartStore();

  const [tables, setTables] = useState<Table[]>([]);
  const [selectedHall, setSelectedHall] = useState<string>('Barchasi');
  const [is3DView, setIs3DView] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Admin add table modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newTableNumber, setNewTableNumber] = useState(19);
  const [newTableHall, setNewTableHall] = useState('Asosiy zal');
  const [newTableSeats, setNewTableSeats] = useState(4);

  const loadTables = async () => {
    try {
      const data = await getTablesMapApi();
      setTables(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // When clicking a table
  const handleTableClick = async (table: Table) => {
    setSelectedTable(table);

    if (table.is_occupied && table.active_order_id) {
      setLoadingOrder(true);
      try {
        const order = await getOrderByIdApi(table.active_order_id);
        setActiveOrder(order);
      } catch (e) {
        console.error(e);
        setActiveOrder(null);
      } finally {
        setLoadingOrder(false);
      }
    } else {
      setActiveOrder(null);
    }
  };

  // If table is free, quick start order in POS
  const handleOpenPosForTable = (table: Table) => {
    setOrderType('dine_in');
    setTable(table.id, table.number, table.hall);
    navigate('/pos');
  };

  // Handle Mark Delivered or Cancel from side sheet
  const handleStatusChange = async (orderId: string, status: 'delivered' | 'canceled') => {
    try {
      await updateOrderStatusApi(orderId, status);
      await loadTables();
      setSelectedTable(null);
      setActiveOrder(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Add Table (Admin)
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTableApi({
        number: newTableNumber,
        hall: newTableHall,
        seats: newTableSeats,
      });
      await loadTables();
      setAddModalOpen(false);
      setNewTableNumber(newTableNumber + 1);
    } catch (e) {
      console.error(e);
    }
  };

  // Stats calculation
  const totalTables = tables.length;
  const occupiedCount = tables.filter((t) => t.is_occupied).length;
  const freeCount = totalTables - occupiedCount;

  // Halls list
  const halls = useMemo(() => {
    const list = Array.from(new Set(tables.map((t) => t.hall)));
    return ['Barchasi', ...list];
  }, [tables]);

  // Filtered tables
  const filteredTables = useMemo(() => {
    if (selectedHall === 'Barchasi') return tables;
    return tables.filter((t) => t.hall === selectedHall);
  }, [tables, selectedHall]);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212]">
      {/* Top Bar: Title, Counters, Hall Filter, 3D Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tight text-stone-900 dark:text-white flex items-center gap-2">
            Stollar xaritasi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] font-bold">
              {occupiedCount}/{totalTables} band
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Zallar boʻyicha real-time bandlik va buyurtmalar koʻrinishi
          </p>
        </div>

        {/* Counter cards */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-400">Boʻsh</p>
              <p className="font-heading font-black text-sm text-stone-900 dark:text-white">{freeCount}</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <div>
              <p className="text-[10px] uppercase font-bold text-stone-400">Band</p>
              <p className="font-heading font-black text-sm text-stone-900 dark:text-white">{occupiedCount}</p>
            </div>
          </div>

          {/* 3D Plan Toggle */}
          <button
            type="button"
            onClick={() => setIs3DView(!is3DView)}
            className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              is3DView
                ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/30'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 hover:border-[#FF5A1F]'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>{is3DView ? "2D ga qaytish" : "3D koʻrinish"}</span>
          </button>

          {/* Add Table button (Admin) */}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="px-4 py-2 rounded-2xl bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" /> Stol qoʻshish
            </button>
          )}
        </div>
      </div>

      {/* Hall Selector Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {halls.map((hall) => (
          <button
            key={hall}
            type="button"
            onClick={() => setSelectedHall(hall)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedHall === hall
                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400'
            }`}
          >
            {hall}
          </button>
        ))}
      </div>

      {/* VIEW: 3D Isometric View OR 2D Grid */}
      {is3DView ? (
        <div className="mb-6">
          <Tables3DPlan
            tables={filteredTables}
            onSelectTable={handleTableClick}
            selectedTableId={selectedTable?.id}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-8">
          {filteredTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;

            return (
              <div
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between shadow-xs select-none ${
                  isSelected
                    ? 'border-[#FF5A1F] ring-4 ring-[#FF5A1F]/20 scale-102 bg-white dark:bg-stone-900'
                    : table.is_occupied
                    ? 'bg-red-50/70 dark:bg-red-950/20 border-red-200 dark:border-red-900/60 hover:border-red-400 hover:shadow-md'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                {/* Table Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-heading font-black text-xl text-stone-900 dark:text-white">
                    #{table.number}
                  </span>
                  <span
                    className={`w-3 h-3 rounded-full shadow-xs ${
                      table.is_occupied ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                    }`}
                  />
                </div>

                {/* Seats and Hall */}
                <div className="text-xs text-stone-500 dark:text-stone-400 space-y-0.5 mb-4">
                  <p className="font-semibold text-stone-700 dark:text-stone-300">{table.hall}</p>
                  <p>{table.seats} kishilik joy</p>
                </div>

                {/* Total / Status Footer */}
                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  {table.is_occupied ? (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-red-500">Band</p>
                      <p className="font-heading font-extrabold text-xs text-stone-900 dark:text-white tabular-nums">
                        {formatMoney(table.current_total)}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] uppercase font-bold text-emerald-500">Boʻsh</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPosForTable(table);
                        }}
                        className="text-[11px] font-bold text-[#FF5A1F] hover:underline"
                      >
                        Ochish ➔
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SIDE SHEET: Selected Table Order Details */}
      {selectedTable && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-stone-900 shadow-2xl border-l border-stone-200 dark:border-stone-800 flex flex-col animate-in slide-in-from-right duration-300">
          <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-xl text-stone-900 dark:text-white">
                  Stol #{selectedTable.number}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedTable.is_occupied
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  }`}
                >
                  {selectedTable.is_occupied ? 'Band' : 'Boʻsh'}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {selectedTable.hall} • {selectedTable.seats} kishilik
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedTable(null)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {selectedTable.is_occupied ? (
              loadingOrder ? (
                <div className="h-40 flex items-center justify-center text-xs text-stone-400">
                  Buyurtma yuklanmoqda...
                </div>
              ) : activeOrder ? (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800 flex justify-between items-center">
                    <div>
                      <p className="font-heading font-black text-base text-stone-900 dark:text-white">
                        Buyurtma #{activeOrder.order_number}
                      </p>
                      <p className="text-xs text-stone-400">Ofitsiant: {activeOrder.waiter_name}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                      {activeOrder.status_display}
                    </span>
                  </div>

                  {/* Items List */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-stone-400 tracking-wider mb-2">Buyurtma tarkibi</h4>
                    <div className="space-y-2">
                      {activeOrder.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40 flex justify-between items-center text-xs"
                        >
                          <span className="font-semibold text-stone-800 dark:text-stone-200">
                            {it.quantity}x {it.food_name}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-stone-900 dark:text-white">
                            {formatMoney(it.line_total)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation summary */}
                  <div className="p-3.5 rounded-2xl bg-stone-100 dark:bg-stone-800 space-y-2 text-xs">
                    <div className="flex justify-between text-stone-500">
                      <span>Oraliq jami:</span>
                      <span className="tabular-nums font-semibold">{formatMoney(activeOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-stone-500">
                      <span>Xizmat haqi ({activeOrder.service_fee_percent}%):</span>
                      <span className="tabular-nums font-semibold">{formatMoney(activeOrder.service_fee_amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-heading font-black text-stone-900 dark:text-white pt-2 border-t border-stone-200 dark:border-stone-700">
                      <span>Jami hisob:</span>
                      <span className="text-[#FF5A1F] text-base tabular-nums">{formatMoney(activeOrder.total_price)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-stone-400 text-xs">Buyurtma ma'lumoti topilmadi</div>
              )
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
                <CheckCircle className="w-12 h-12 text-emerald-500 mb-3" />
                <h4 className="font-heading font-bold text-base text-stone-800 dark:text-stone-200">Stol boʻsh</h4>
                <p className="text-xs text-stone-500 mt-1 mb-6">Ushbu stolga yangi mehmonlarni oʻtkazish mumkin</p>
                <button
                  type="button"
                  onClick={() => handleOpenPosForTable(selectedTable)}
                  className="px-6 py-3 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs shadow-md shadow-[#FF5A1F]/25 transition-all cursor-pointer"
                >
                  Kassaga oʻtish va buyurtma ochish
                </button>
              </div>
            )}
          </div>

          {/* Action buttons footer for occupied table */}
          {selectedTable.is_occupied && activeOrder && (
            <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange(activeOrder.id, 'delivered')}
                  className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> Hisob yopildi (Berildi)
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/orders/${activeOrder.id}/receipt`)}
                  className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-[#FF5A1F] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Receipt className="w-4 h-4" /> Chek
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Buyurtmani bekor qilishni tasdiqlaysizmi?")) {
                    handleStatusChange(activeOrder.id, 'canceled');
                  }
                }}
                className="w-full py-2 text-stone-400 hover:text-red-500 text-xs font-semibold transition-colors cursor-pointer"
              >
                Buyurtmani bekor qilish
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Add Table (Admin) */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddTable}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Yangi stol qoʻshish</h3>
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Stol raqami</label>
              <input
                type="number"
                value={newTableNumber}
                onChange={(e) => setNewTableNumber(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Zal</label>
              <select
                value={newTableHall}
                onChange={(e) => setNewTableHall(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
              >
                <option value="Asosiy zal">Asosiy zal</option>
                <option value="2-qavat">2-qavat</option>
                <option value="Kabina">Kabina (VIP)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Joylar soni (kishi)</label>
              <input
                type="number"
                value={newTableSeats}
                onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-500 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
