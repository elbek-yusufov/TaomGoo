import { useState, useEffect, useMemo } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  Search,
  BookOpen,
  History,
  FilePlus,
  CheckCircle,
  X,
  RefreshCw,
  Scale,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Ingredient, FoodRecipe, StockMovement, UnitType, Food } from '../types';
import {
  getIngredientsApi,
  getLowStockIngredientsApi,
  stockInIngredientApi,
  createIngredientApi,
  updateIngredientApi,
  getRecipesApi,
  saveRecipeApi,
  getStockMovementsApi,
} from '../features/inventory/api';
import { getFoodsApi } from '../features/menu/api';
import { formatMoney, formatDateTime } from '../lib/format';

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'recipes' | 'history'>('ingredients');

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [lowStock, setLowStock] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<FoodRecipe[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [stockInModalOpen, setStockInModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);
  const [stockInQty, setStockInQty] = useState(10);
  const [stockInNotes, setStockInNotes] = useState('');

  const [newIngModalOpen, setNewIngModalOpen] = useState(false);
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<UnitType>('kg');
  const [newIngQty, setNewIngQty] = useState(20);
  const [newIngMin, setNewIngMin] = useState(15);
  const [newIngCost, setNewIngCost] = useState(50000);

  // Active Recipe selection
  const [selectedRecipeFoodId, setSelectedRecipeFoodId] = useState<string>('food_1');

  const loadAll = async () => {
    try {
      const [ings, low, recs, mvts, fds] = await Promise.all([
        getIngredientsApi(),
        getLowStockIngredientsApi(),
        getRecipesApi(),
        getStockMovementsApi(),
        getFoodsApi(),
      ]);
      setIngredients(ings);
      setLowStock(low);
      setRecipes(recs);
      setMovements(mvts);
      setFoods(fds);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || stockInQty <= 0) return;

    try {
      await stockInIngredientApi(selectedIngredient.id, Number(stockInQty), stockInNotes);
      await loadAll();
      setStockInModalOpen(false);
      setStockInQty(10);
      setStockInNotes('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIngredientApi({
        name: newIngName,
        unit: newIngUnit,
        stock_quantity: Number(newIngQty),
        min_limit: Number(newIngMin),
        cost_per_unit: Number(newIngCost),
      });
      await loadAll();
      setNewIngModalOpen(false);
      setNewIngName('');
    } catch (e) {
      console.error(e);
    }
  };

  // Filtered ingredients
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((i) =>
      searchQuery === '' ? true : i.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [ingredients, searchQuery]);

  // Selected Recipe details
  const activeRecipe = useMemo(() => {
    return recipes.find((r) => r.food_id === selectedRecipeFoodId);
  }, [recipes, selectedRecipeFoodId]);

  const activeFood = useMemo(() => {
    return foods.find((f) => f.id === selectedRecipeFoodId);
  }, [foods, selectedRecipeFoodId]);

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 dark:text-white flex items-center gap-2">
            Ombor va Texnologik Xaritalar
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Xomashyo qoldiqlari, kirim/chiqim va taomlar porsiyaviy kalkulyatsiyasi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setNewIngModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs font-bold text-stone-800 dark:text-stone-200 hover:border-[#FF5A1F] transition-colors shadow-xs"
          >
            + Masalliq qoʻshish
          </button>
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {lowStock.length > 0 && (
        <div className="mb-6 p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-900/60 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="font-heading font-bold text-sm text-amber-900 dark:text-amber-200">
                Diqqat! {lowStock.length} ta xomashyo minimal meʼyordan kam qolgan:
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {lowStock.map((item) => (
                  <span
                    key={item.id}
                    className="px-2.5 py-0.5 rounded-md bg-white dark:bg-stone-900 text-red-600 dark:text-red-400 font-bold text-xs border border-amber-200 dark:border-amber-800"
                  >
                    {item.name}: {item.stock_quantity} {item.unit} (min: {item.min_limit})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedIngredient(lowStock[0]);
              setStockInModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-xs cursor-pointer"
          >
            Kirim qilish ➔
          </button>
        </div>
      )}

      {/* Tabs Switcher: Masalliqlar, Retseptlar, Harakatlar tarixi */}
      <div className="flex items-center gap-2 mb-6 border-b border-stone-200/80 dark:border-stone-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'ingredients'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <Boxes className="w-4 h-4" /> Masalliqlar va qoldiq
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('recipes')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'recipes'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Retseptlar (Kalkulyatsiya)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
          }`}
        >
          <History className="w-4 h-4" /> Harakatlar tarixi
        </button>
      </div>

      {/* TAB 1: Masalliqlar jadvali */}
      {activeTab === 'ingredients' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Masalliq nomi boʻyicha qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs focus:outline-hidden focus:border-[#FF5A1F]"
              />
            </div>
            <span className="text-xs text-stone-400">{filteredIngredients.length} ta pozitsiya</span>
          </div>

          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Xomashyo nomi</th>
                    <th className="py-3 px-4">Oʻlchov birligi</th>
                    <th className="py-3 px-4">Hozirgi qoldiq</th>
                    <th className="py-3 px-4">Minimal chegara</th>
                    <th className="py-3 px-4">Birlik narxi</th>
                    <th className="py-3 px-4">Holat</th>
                    <th className="py-3 px-4 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                  {filteredIngredients.map((ing) => {
                    const isLow = ing.stock_quantity <= ing.min_limit;
                    const percent = Math.min(100, Math.round((ing.stock_quantity / (ing.min_limit * 2)) * 100));

                    return (
                      <tr key={ing.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-stone-900 dark:text-white">{ing.name}</td>
                        <td className="py-3 px-4 text-stone-500 font-medium">{ing.unit}</td>

                        {/* Stock with progress indicator */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <span className="font-heading font-extrabold text-sm tabular-nums">
                              {ing.stock_quantity} {ing.unit}
                            </span>
                            <div className="w-16 h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden hidden sm:block">
                              <div
                                className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-stone-500 tabular-nums">
                          {ing.min_limit} {ing.unit}
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-stone-800 dark:text-stone-200 tabular-nums">
                          {formatMoney(ing.cost_per_unit)}
                        </td>

                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isLow
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {isLow ? '⚠️ Kam qoldi' : 'Yetarli'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedIngredient(ing);
                              setStockInModalOpen(true);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-[#FF5A1F] text-[#FF5A1F] hover:text-white font-bold text-xs transition-colors"
                          >
                            Kirim qilish
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Retseptlar va porsiyaviy kalkulyatsiya */}
      {activeTab === 'recipes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Foods list selector */}
          <div className="lg:col-span-4 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-4 space-y-2">
            <h3 className="font-heading font-black text-base text-stone-900 dark:text-white mb-3">
              Taomni tanlang
            </h3>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {foods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => setSelectedRecipeFoodId(food.id)}
                  className={`w-full p-2.5 rounded-2xl flex items-center justify-between text-left transition-all ${
                    selectedRecipeFoodId === food.id
                      ? 'bg-[#FF5A1F] text-white shadow-md shadow-[#FF5A1F]/25 font-bold'
                      : 'bg-stone-50/70 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                  }`}
                >
                  <span className="text-xs truncate">{food.name}</span>
                  <span className="text-[11px] font-mono tabular-nums">{formatMoney(food.price)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipe details and live profit calculation */}
          <div className="lg:col-span-8 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 p-6 space-y-6">
            {activeRecipe ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
                  <div>
                    <h3 className="font-heading font-black text-xl text-stone-900 dark:text-white">
                      {activeRecipe.food_name}
                    </h3>
                    <p className="text-xs text-stone-400">1 porsiya uchun sarflanadigan xomashyo normasi</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-stone-400">Sotish narxi</p>
                      <p className="font-heading font-black text-lg text-stone-900 dark:text-white">
                        {formatMoney(activeRecipe.selling_price)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-stone-400">Tannarx</p>
                      <p className="font-heading font-black text-lg text-[#FF5A1F]">
                        {formatMoney(activeRecipe.total_cost)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recipe ingredients lines table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-50 dark:bg-stone-800/60 text-stone-500 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Masalliq</th>
                        <th className="py-2.5 px-3">1 porsiyaga miqdor</th>
                        <th className="py-2.5 px-3">Oʻlchov</th>
                        <th className="py-2.5 px-3 text-right">Xarajat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                      {activeRecipe.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2.5 px-3 font-semibold text-stone-800 dark:text-stone-200">
                            {line.ingredient_name}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#FF5A1F]">
                            {line.quantity_per_portion}
                          </td>
                          <td className="py-2.5 px-3 text-stone-400">{line.unit}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-stone-900 dark:text-white text-right tabular-nums">
                            {formatMoney(line.cost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Profit Margin KPI Box */}
                <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200/60 dark:border-stone-700/60 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">Tannarx ulushi</p>
                    <p className="font-heading font-black text-xl text-stone-900 dark:text-white">
                      {Math.round((activeRecipe.total_cost / activeRecipe.selling_price) * 100)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">1 porsiyadan sof foyda</p>
                    <p className="font-heading font-black text-xl text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatMoney(activeRecipe.selling_price - activeRecipe.total_cost)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-stone-400">Marja</p>
                    <p className="font-heading font-black text-xl text-emerald-500">
                      +
                      {Math.round(
                        ((activeRecipe.selling_price - activeRecipe.total_cost) / activeRecipe.selling_price) * 100
                      )}
                      %
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400">
                <BookOpen className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-sm font-semibold">Ushbu taom uchun retsept hali kiritilmagan</p>
                <p className="text-xs mt-1">Chap tomondagi roʻyxatdan "Toshkent toʻy oshi" yoki boshqa taomni tanlang</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Harakatlar tarixi */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Sana va vaqt</th>
                  <th className="py-3 px-4">Masalliq</th>
                  <th className="py-3 px-4">Operatsiya turi</th>
                  <th className="py-3 px-4">Miqdori</th>
                  <th className="py-3 px-4">Masʼul shaxs</th>
                  <th className="py-3 px-4">Izoh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                    <td className="py-3 px-4 font-mono text-stone-400">{formatDateTime(m.created_at)}</td>
                    <td className="py-3 px-4 font-bold text-stone-900 dark:text-white">{m.ingredient_name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                          m.movement_type === 'kirim'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : m.movement_type === 'sotuv'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : m.movement_type === 'isrof'
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {m.movement_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-heading font-extrabold text-sm tabular-nums">
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-stone-600 dark:text-stone-300">{m.operator_name}</td>
                    <td className="py-3 px-4 text-stone-400">{m.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Stock In (Kirim qilish) */}
      {stockInModalOpen && selectedIngredient && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStockInSubmit}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Omborga kirim</h3>
                <p className="text-xs text-stone-400">{selectedIngredient.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setStockInModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Kirim miqdori ({selectedIngredient.unit})
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                value={stockInQty}
                onChange={(e) => setStockInQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-base font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Kirim hujjati / Izoh
              </label>
              <input
                type="text"
                value={stockInNotes}
                onChange={(e) => setStockInNotes(e.target.value)}
                placeholder="Bozordan qabul qilindi..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStockInModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-500 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                Kirimni tasdiqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: New Ingredient */}
      {newIngModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateIngredient}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Yangi xomashyo</h3>
              <button
                type="button"
                onClick={() => setNewIngModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Nomi</label>
              <input
                type="text"
                value={newIngName}
                onChange={(e) => setNewIngName(e.target.value)}
                placeholder="Masalan: Qizil qalampir"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Birlik</label>
                <select
                  value={newIngUnit}
                  onChange={(e) => setNewIngUnit(e.target.value as UnitType)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                >
                  <option value="kg">kg</option>
                  <option value="gramm">gramm</option>
                  <option value="dona">dona</option>
                  <option value="litr">litr</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Birlik narxi</label>
                <input
                  type="number"
                  value={newIngCost}
                  onChange={(e) => setNewIngCost(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Boshlangʻich miqdor</label>
                <input
                  type="number"
                  value={newIngQty}
                  onChange={(e) => setNewIngQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Minimal chegara</label>
                <input
                  type="number"
                  value={newIngMin}
                  onChange={(e) => setNewIngMin(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewIngModalOpen(false)}
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
