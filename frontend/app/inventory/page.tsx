'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Boxes,
  Plus,
  AlertTriangle,
  Clock,
  Edit2,
  Trash2,
  X,
  Search,
  CheckCircle2,
  Store,
  TrendingUp,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  Package,
} from 'lucide-react';
import { api, Ingredient } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import SupplierSearchModal from '@/components/SupplierSearchModal';
import HistoricalPriceChart from '@/components/HistoricalPriceChart';

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'grains', label: 'Grains & Flours' },
  { id: 'pulses', label: 'Pulses & Dal' },
  { id: 'vegetables', label: 'Fresh Vegetables' },
  { id: 'dairy', label: 'Dairy & Ghee' },
  { id: 'oils', label: 'Oils & Spices' },
  { id: 'general', label: 'Pantry' },
];

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

  // Form State
  const [name, setName] = useState<string>('');
  const [category, setCategory] = useState<string>('vegetables');
  const [quantity, setQuantity] = useState<string>('0');
  const [unit, setUnit] = useState<string>('kg');
  const [reorderLevel, setReorderLevel] = useState<string>('2');
  const [costPerUnit, setCostPerUnit] = useState<string>('40');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const loadInventory = useCallback(async () => {
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
  }, [selectedCategory, showLowStockOnly]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

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

  const filteredItems = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = ingredients.filter((i) => i.is_low_stock).length;
  const expiringCount = ingredients.filter((i) => i.is_expiring).length;
  const totalValuation = ingredients.reduce((sum, i) => sum + i.quantity * i.cost_per_unit, 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
              Inventory &amp; Stock Ledger
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
              PANTRY OPS
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Pantry stock monitoring, reorder threshold alerts, and wholesale supplier price comparisons
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openSupplierSearch('')}
            className="btn-surface text-xs font-mono"
            title="Search wholesale prices via SerpAPI"
          >
            <Store className="w-3.5 h-3.5 text-secondary" />
            <span>Supplier Search (SerpAPI)</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="btn-primary text-xs shadow-[0_2px_0_0_#00210a]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Top Ledger Telemetry (4 Quick Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="desk-card p-4">
          <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Total Pantry Items
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            {ingredients.length}
          </div>
          <div className="font-mono text-[10px] text-on-surface-variant mt-1">Catalogued raw materials</div>
        </div>

        <div className="desk-card p-4">
          <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Below Reorder Level
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-secondary">
            {lowStockCount}
          </div>
          <div className="font-mono text-[10px] text-secondary mt-1">
            {lowStockCount ? 'Restock immediately' : 'Pantry thresholds healthy'}
          </div>
        </div>

        <div className="desk-card p-4">
          <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Expiring Within 3 Days
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-error">
            {expiringCount}
          </div>
          <div className="font-mono text-[10px] text-error mt-1">
            {expiringCount ? "Use up in today's shift" : 'No near-term spoilage'}
          </div>
        </div>

        <div className="desk-card p-4">
          <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase mb-1">
            Pantry Valuation
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            ₹{Math.round(totalValuation).toLocaleString('en-IN')}
          </div>
          <div className="font-mono text-[10px] text-on-surface-variant mt-1">Estimated asset value</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="desk-card p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-on-surface-variant absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ingredient name (e.g., toor dal, basmati, ghee)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg pl-9 pr-3 py-2 text-xs font-body text-on-surface outline-none focus:border-primary"
            />
          </div>

          {/* Quick Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-mono font-bold border transition flex items-center gap-1.5 shrink-0 ${
              showLowStockOnly
                ? 'bg-secondary text-white border-[#571a00] shadow-[0_2px_0_0_#571a00]'
                : 'bg-white border-outline-variant text-on-surface hover:bg-surface-container'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Deficit Only</span>
          </button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 font-mono text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-primary-container text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Inventory Ledger Table */}
      <div className="desk-card overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <h3 className="font-headline font-bold text-base text-primary">
              Raw Ingredients Matrix
            </h3>
          </div>
          <span className="font-mono text-xs text-on-surface-variant">
            {filteredItems.length} items listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-body text-xs">
            <thead>
              <tr className="border-b border-outline-variant/60 bg-surface-container-low font-mono text-[11px] text-on-surface-variant uppercase font-bold">
                <th className="py-3 px-4">Ingredient Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-center">Available Stock</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Reorder Point</th>
                <th className="py-3 px-3 text-right">Cost/Unit</th>
                <th className="py-3 px-3">Expiry Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center font-mono text-on-surface-variant">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                    Loading kitchen stock ledger...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center font-body text-on-surface-variant">
                    No ingredients found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.quantity <= item.reorder_level;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-container-low/60 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="font-headline font-bold text-sm text-on-surface capitalize">
                          {item.name}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                          {item.category || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-1.5 font-mono">
                          <button
                            onClick={() => handleQuickAdjust(item, -1)}
                            className="text-on-surface-variant hover:text-error transition"
                            title="Decrement 1 unit"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm text-primary w-14 text-center">
                            {item.quantity} {item.unit}
                          </span>
                          <button
                            onClick={() => handleQuickAdjust(item, 1)}
                            className="text-on-surface-variant hover:text-primary transition"
                            title="Increment 1 unit"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {isLow ? (
                          <span className="badge-alert">
                            DEFICIT ({item.quantity}/{item.reorder_level})
                          </span>
                        ) : (
                          <span className="badge-fresh">HEALTHY ✓</span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-on-surface-variant">
                        {item.reorder_level} {item.unit}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-on-surface">
                        ₹{item.cost_per_unit}/{item.unit}
                      </td>

                      <td className="py-3 px-3 font-mono text-xs">
                        {item.expiry_date ? (
                          <span className={item.is_expiring ? 'text-error font-bold' : 'text-on-surface-variant'}>
                            {item.expiry_date}
                          </span>
                        ) : (
                          <span className="text-outline-variant">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedChartIngredient(item.name);
                              openSupplierSearch(item.name);
                            }}
                            className="font-mono text-[10px] bg-white border border-outline-variant/60 text-secondary hover:bg-surface-container px-2 py-1 rounded inline-flex items-center gap-1 transition shadow-2xs font-semibold"
                            title="Compare supplier wholesale prices"
                          >
                            <Store className="w-3 h-3 text-secondary" />
                            Prices
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 rounded text-on-surface-variant hover:text-primary transition"
                            title="Edit Ingredient"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.name)}
                            className="p-1 rounded text-on-surface-variant hover:text-error transition"
                            title="Delete Ingredient"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Price Trend Chart (Tiger Data / TimescaleDB Hypertable Integration) */}
      <div className="desk-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/40 pb-3 mb-4 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-headline font-bold text-base text-primary">
                TimescaleDB Hypertable: Historical Procurement Trend
              </h3>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Wholesale price variance tracked for &ldquo;{selectedChartIngredient}&rdquo; via Tiger Data snapshots
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-on-surface-variant">Ingredient:</span>
            <select
              value={selectedChartIngredient}
              onChange={(e) => setSelectedChartIngredient(e.target.value)}
              className="bg-white border border-outline-variant rounded px-2.5 py-1 text-xs font-bold text-primary outline-none"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.name}>
                  {ing.name} ({ing.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        <HistoricalPriceChart
          ingredientName={selectedChartIngredient}
        />
      </div>

      {/* Add / Edit Ingredient Modal Ticket */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-primary/30 rounded-xl shadow-[0_8px_0_0_#18542a] w-full max-w-md overflow-hidden">
            <div className="bg-primary px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-tertiary-fixed" />
                <h3 className="font-headline font-bold text-base tracking-tight">
                  {editingItem ? 'Edit Pantry Ingredient' : 'New Pantry Ingredient'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body text-xs">
              <div>
                <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Ingredient Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. toor dal, basmati rice, mustard seeds"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  >
                    {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Measurement Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
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
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Reorder Min
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    required
                    value={reorderLevel}
                    onChange={(e) => setReorderLevel(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Cost/Unit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={costPerUnit}
                    onChange={(e) => setCostPerUnit(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingItem ? 'Update Stock Item' : 'Save New Ingredient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Wholesale Supplier Search Modal */}
      <SupplierSearchModal />
    </div>
  );
}
