'use client';

import { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  X,
  Search,
  Filter,
  ArrowUpDown,
  Check,
  Store,
  TrendingUp,
} from 'lucide-react';
import { api, Ingredient } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import SupplierSearchModal from '@/components/SupplierSearchModal';
import HistoricalPriceChart from '@/components/HistoricalPriceChart';

const CATEGORIES = ['all', 'grains', 'pulses', 'vegetables', 'dairy', 'oils', 'spices', 'general'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces'];

export default function InventoryPage() {
  const { openSupplierSearch } = useUIStore();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedChartIngredient, setSelectedChartIngredient] = useState<string>('toor dal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showLowStockOnly, setShowLowStockOnly] = useState<boolean>(false);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

  // Form
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('vegetables');
  const [quantity, setQuantity] = useState<string>('0');
  const [unit, setUnit] = useState<string>('kg');
  const [reorderLevel, setReorderLevel] = useState<string>('0');
  const [costPerUnit, setCostPerUnit] = useState<string>('0');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const loadInventory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInventory({
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        low_stock: showLowStockOnly ? true : undefined,
      });
      setIngredients(res.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [selectedCategory, showLowStockOnly]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategory('vegetables');
    setQuantity('0');
    setUnit('kg');
    setReorderLevel('2');
    setCostPerUnit('40');
    setExpiryDate('');
    setShowModal(true);
  };

  const handleOpenEdit = (item: Ingredient) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category || 'general');
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setReorderLevel(item.reorder_level.toString());
    setCostPerUnit(item.cost_per_unit.toString());
    setExpiryDate(item.expiry_date || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qty = parseFloat(quantity);
    const reorder = parseFloat(reorderLevel);
    const cost = parseFloat(costPerUnit);

    if (isNaN(qty) || qty < 0) {
      setError('Quantity cannot be negative.');
      return;
    }
    if (isNaN(cost) || cost < 0) {
      setError('Cost per unit cannot be negative.');
      return;
    }

    try {
      const payload: Partial<Ingredient> = {
        name: name.trim().toLowerCase(),
        category,
        quantity: qty,
        unit,
        reorder_level: isNaN(reorder) ? 0 : reorder,
        cost_per_unit: cost,
        expiry_date: expiryDate ? expiryDate : null,
      };

      if (editingItem) {
        await api.updateIngredient(editingItem.id, payload);
      } else {
        await api.createIngredient(payload);
      }

      setShowModal(false);
      loadInventory();
    } catch (err: any) {
      setError(err.message || 'Error saving ingredient');
    }
  };

  const handleDelete = async (id: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}" from inventory?`)) return;
    try {
      await api.deleteIngredient(id);
      loadInventory();
    } catch (err: any) {
      setError(err.message || 'Error deleting ingredient');
    }
  };

  // Quick adjust stock
  const handleQuickAdjust = async (item: Ingredient, delta: number) => {
    const newQty = Math.max(0, parseFloat((item.quantity + delta).toFixed(3)));
    try {
      await api.updateIngredient(item.id, { quantity: newQty });
      setIngredients((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, quantity: newQty } : i))
      );
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    }
  };

  // Filtered by search query
  const filteredItems = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Inventory & Stock</h1>
          <p className="text-sm text-[#78716C]">
            Track raw ingredients, reorder thresholds, expiry dates, and unit costs
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => openSupplierSearch('')}
            className="px-3 py-2 text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-1.5 shadow-xs transition"
          >
            <Store className="w-4 h-4" />
            Find Suppliers &amp; Prices
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-forest px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Ingredient
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card-warm p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full capitalize text-xs font-medium transition ${
                selectedCategory === cat
                  ? 'bg-[#1B4332] text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Low Stock Toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-amber-800">
            <input
              type="checkbox"
              checked={showLowStockOnly}
              onChange={(e) => setShowLowStockOnly(e.target.checked)}
              className="rounded text-amber-600"
            />
            Low Stock Only
          </label>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 border border-[#E7E5E4] rounded-lg text-xs bg-white outline-none focus:border-[#1B4332] w-48"
            />
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="card-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] border-b border-[#E7E5E4] text-[#78716C] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Quantity on Hand</th>
                <th className="py-3 px-4 text-right">Reorder Level</th>
                <th className="py-3 px-4 text-right">Cost / Unit</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Quick Adjust</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {filteredItems.map((item) => {
                const isLow = item.is_low_stock || item.quantity <= item.reorder_level;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#FDFBF7] ${isLow ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="py-3 px-4 font-semibold text-[#1C1917] capitalize">
                      <div className="flex items-center gap-1.5">
                        {item.name}
                        {item.is_demo && <span className="badge-demo scale-90">Demo</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-stone-600">
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm">
                      <span className={isLow ? 'text-amber-700' : 'text-[#1B4332]'}>
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-500">
                      {item.reorder_level} {item.unit}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-700">
                      ₹{item.cost_per_unit}/{item.unit}
                    </td>
                    <td className="py-3 px-4">
                      {item.expiry_date ? (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            item.is_expiring
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'text-stone-600'
                          }`}
                        >
                          {item.is_expiring && <Clock className="w-3 h-3 text-rose-600" />}
                          {item.expiry_date}
                        </span>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleQuickAdjust(item, -1)}
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-bold text-[11px]"
                          title="Subtract 1"
                        >
                          -1
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, 1)}
                          className="px-1.5 py-0.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-bold text-[11px]"
                          title="Add 1"
                        >
                          +1
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(item, 5)}
                          className="px-1.5 py-0.5 bg-[#EBF8EE] hover:bg-[#D8F3DC] text-[#1B4332] rounded font-bold text-[11px]"
                          title="Add 5"
                        >
                          +5
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => openSupplierSearch(item.name)}
                        className="p-1 hover:text-emerald-700 text-stone-500 rounded transition"
                        title="Find Suppliers & Live Market Prices"
                      >
                        <Store className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => setSelectedChartIngredient(item.name)}
                        className={`p-1 rounded transition ${
                          selectedChartIngredient.toLowerCase() === item.name.toLowerCase()
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-stone-500 hover:text-indigo-700'
                        }`}
                        title="View Historical Price Chart (Tiger Data)"
                      >
                        <TrendingUp className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 hover:text-stone-900 text-stone-500 rounded"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        className="p-1 hover:text-red-700 text-stone-400 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 inline" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A8A29E]">
                    {loading ? 'Loading ingredients...' : 'No ingredients found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Ingredient Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <h3 className="font-bold text-base text-[#0F291E]">
                {editingItem ? 'Edit Ingredient' : 'Add New Ingredient'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Ingredient Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Toor Dal, Mustard Oil, Potato"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none capitalize text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none capitalize"
                  >
                    {CATEGORIES.filter((c) => c !== 'all').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Unit of Measure</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-2 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Reorder Level</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-2 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Cost / Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-2 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-forest px-5 py-2 font-semibold">
                  {editingItem ? 'Save Changes' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Historical Price Analytics Section (Tiger Data) */}
      <div className="mt-8">
        <HistoricalPriceChart ingredientName={selectedChartIngredient} />
      </div>

      {/* Global Supplier Search & Price Comparison Modal */}
      <SupplierSearchModal />
    </div>
  );
}
