import { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  AlertTriangle,
  Flame,
  Coffee,
  Percent,
  Sparkles,
} from 'lucide-react';
import { Food, Category, Station } from '../types';
import {
  getFoodsApi,
  getCategoriesApi,
  createFoodApi,
  updateFoodApi,
  deleteFoodApi,
  createCategoryApi,
  deleteCategoryApi,
} from '../features/menu/api';
import { formatMoney } from '../lib/format';

export function MenuPage() {
  const [foods, setFoods] = useState<Food[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState('');

  // Food modal state
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('cat_osh');
  const [formPrice, setFormPrice] = useState(40000);
  const [formCostPrice, setFormCostPrice] = useState(19000);
  const [formStation, setFormStation] = useState<Station>('kitchen');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formDescription, setFormDescription] = useState('');

  // Category modal
  const [newCatName, setNewCatName] = useState('');
  const [catModalOpen, setCatModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [f, c] = await Promise.all([getFoodsApi(), getCategoriesApi()]);
      setFoods(f);
      setCategories(c);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered foods
  const filteredFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchCat = selectedCategory === 'cat_all' || food.category_id === selectedCategory;
      const matchSearch =
        searchQuery === '' ||
        food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (food.description && food.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [foods, selectedCategory, searchQuery]);

  const openCreateModal = () => {
    setEditingFood(null);
    setFormName('');
    setFormCategory(categories[1]?.id || 'cat_osh');
    setFormPrice(35000);
    setFormCostPrice(16000);
    setFormStation('kitchen');
    setFormImageUrl('https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?w=600&auto=format&fit=crop&q=80');
    setFormAvailable(true);
    setFormDescription('');
    setFoodModalOpen(true);
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);
    setFormName(food.name);
    setFormCategory(food.category_id);
    setFormPrice(food.price);
    setFormCostPrice(food.cost_price || Math.round(food.price * 0.45));
    setFormStation(food.station);
    setFormImageUrl(food.image_url);
    setFormAvailable(food.is_available);
    setFormDescription(food.description || '');
    setFoodModalOpen(true);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    const catObj = categories.find((c) => c.id === formCategory);

    const payload = {
      name: formName,
      category_id: formCategory,
      category_name: catObj?.name || 'Milliy taom',
      price: Number(formPrice),
      cost_price: Number(formCostPrice),
      station: formStation,
      image_url: formImageUrl,
      is_available: formAvailable,
      description: formDescription,
    };

    try {
      if (editingFood) {
        await updateFoodApi(editingFood.id, payload);
      } else {
        await createFoodApi(payload);
      }
      await loadData();
      setFoodModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFood = async (id: string, name: string) => {
    if (window.confirm(`"${name}" taomini oʻchirishni tasdiqlaysizmi?`)) {
      try {
        await deleteFoodApi(id);
        await loadData();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleToggleAvailability = async (food: Food) => {
    try {
      await updateFoodApi(food.id, { is_available: !food.is_available });
      await loadData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await createCategoryApi(newCatName.trim());
      await loadData();
      setNewCatName('');
      setCatModalOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  // Profit Margin helper: green > 40%, yellow 20-40%, red < 20%
  const getMarginBadge = (sellingPrice: number, costPrice?: number) => {
    const cost = costPrice || Math.round(sellingPrice * 0.5);
    const profit = sellingPrice - cost;
    const margin = Math.round((profit / sellingPrice) * 100);

    let color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
    if (margin < 20) {
      color = 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300';
    } else if (margin <= 40) {
      color = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    }

    return {
      margin,
      profit,
      color,
    };
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto bg-[#FFF8F0] dark:bg-[#121212]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-stone-900 dark:text-white flex items-center gap-2">
            Menyu boshqaruvi
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#FF5A1F] font-bold">
              {foods.length} ta taom
            </span>
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Kategoriyalar, narxlar, tannarx va rentabellik marjasi nazorati
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCatModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-xs font-bold text-stone-700 dark:text-stone-300 hover:border-[#FF5A1F] transition-colors shadow-xs"
          >
            + Kategoriya
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="px-5 py-2.5 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs shadow-lg shadow-[#FF5A1F]/30 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Yangi taom
          </button>
        </div>
      </div>

      {/* Categories Bar & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md'
                  : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:border-stone-400'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Taomni qidirish..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs text-stone-900 dark:text-stone-100 focus:outline-hidden focus:border-[#FF5A1F]"
          />
        </div>
      </div>

      {/* Foods Table / Grid */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/80 dark:border-stone-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200/80 dark:border-stone-800 text-stone-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Taom</th>
                <th className="py-3 px-4">Kategoriya</th>
                <th className="py-3 px-4">Stansiya</th>
                <th className="py-3 px-4">Sotish narxi</th>
                <th className="py-3 px-4">Tannarx</th>
                <th className="py-3 px-4">Sof foyda / Marja</th>
                <th className="py-3 px-4">Mavjudlik</th>
                <th className="py-3 px-4 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/60">
              {filteredFoods.map((food) => {
                const badge = getMarginBadge(food.price, food.cost_price);

                return (
                  <tr key={food.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                    {/* Food Info with Image */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={food.image_url}
                          alt={food.name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-800 shrink-0"
                        />
                        <div>
                          <p className="font-heading font-bold text-sm text-stone-900 dark:text-white">{food.name}</p>
                          {food.description && (
                            <p className="text-[11px] text-stone-400 line-clamp-1 max-w-xs">{food.description}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-stone-600 dark:text-stone-300 font-medium">
                      {food.category_name || 'Milliy taom'}
                    </td>

                    {/* Station */}
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold text-stone-700 dark:text-stone-300">
                        {food.station === 'kitchen' ? '🔥 Oshxona' : food.station === 'mangal' ? '🥩 Mangal' : '🥤 Bar'}
                      </span>
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 font-heading font-extrabold text-stone-900 dark:text-white tabular-nums text-sm">
                      {formatMoney(food.price)}
                    </td>

                    {/* Cost Price */}
                    <td className="py-3 px-4 font-mono text-stone-500 tabular-nums">
                      {formatMoney(food.cost_price || food.price * 0.45)}
                    </td>

                    {/* Margin Badge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] tabular-nums ${badge.color}`}>
                          +{badge.margin}%
                        </span>
                        <span className="font-mono text-[11px] text-stone-400 tabular-nums">
                          ({formatMoney(badge.profit)})
                        </span>
                      </div>
                    </td>

                    {/* Availability Switch */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleAvailability(food)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          food.is_available ? 'bg-emerald-500' : 'bg-stone-300 dark:bg-stone-700'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                            food.is_available ? 'right-1' : 'left-1'
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(food)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFood(food.id, food.name)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Oʻchirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Create/Edit Food Dialog */}
      {foodModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveFood}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-xl w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">
                {editingFood ? "Taomni tahrirlash" : "Yangi taom qoʻshish"}
              </h3>
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Taom nomi
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Kategoriya
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                >
                  {categories
                    .filter((c) => c.id !== 'cat_all')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Sotish narxi (soʻm)
                </label>
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tannarx (soʻm)
                </label>
                <input
                  type="number"
                  value={formCostPrice}
                  onChange={(e) => setFormCostPrice(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Tayyorlash stansiyasi
                </label>
                <select
                  value={formStation}
                  onChange={(e) => setFormStation(e.target.value as Station)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                >
                  <option value="kitchen">🔥 Issiq oshxona</option>
                  <option value="mangal">🥩 Mangal / Kabob</option>
                  <option value="bar">🥤 Bar / Ichimliklar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Mavjudlik holati
                </label>
                <label className="flex items-center gap-2 pt-2 cursor-pointer text-xs font-semibold">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded border-stone-300 text-[#FF5A1F] focus:ring-[#FF5A1F]"
                  />
                  <span>Hozir sotuvda bor</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Rasm havolasi (URL)
              </label>
              <input
                type="url"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs font-mono"
              />
              {formImageUrl && (
                <div className="mt-2 flex items-center gap-3 p-2 rounded-xl bg-stone-100 dark:bg-stone-800">
                  <img src={formImageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-[11px] text-stone-500">Rasm koʻrinishi</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Tavsif / Tarkibi
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={2}
                placeholder="Taom tarkibi va masalliqlar haqida qisqacha..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-xs"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-stone-100 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setFoodModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-500 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs shadow-md"
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: New Category */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white dark:bg-stone-900 rounded-3xl max-w-sm w-full p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3">
              <h3 className="font-heading font-black text-lg text-stone-900 dark:text-white">Yangi kategoriya</h3>
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Kategoriya nomi
              </label>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Masalan: Desertlar"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800 text-sm"
                required
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-stone-500 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#FF5A1F] hover:bg-[#E4480E] text-white font-bold text-xs"
              >
                Qoʻshish
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
