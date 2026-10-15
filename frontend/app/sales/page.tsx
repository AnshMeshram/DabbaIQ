'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Receipt,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Filter,
  Check,
  X,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { api, Sale, Recipe } from '@/lib/api';

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);

  const [formDate, setFormDate] = useState<string>('');
  const [formMeal, setFormMeal] = useState<string>('lunch');
  const [formRecipeId, setFormRecipeId] = useState<string>('');
  const [formPortions, setFormPortions] = useState<string>('');
  const [formRevenue, setFormRevenue] = useState<string>('');

  // Filters
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterMeal, setFilterMeal] = useState<string>('');

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  useEffect(() => {
    setFormDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, recipesRes] = await Promise.all([
        api.getSales({
          start_date: filterStartDate || undefined,
          end_date: filterEndDate || undefined,
          meal_period: filterMeal || undefined,
        }),
        api.getRecipes(),
      ]);
      setSales(salesRes.items);
      setRecipes(recipesRes.items);
      if (recipesRes.items.length > 0 && !formRecipeId) {
        setFormRecipeId(recipesRes.items[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStartDate, filterEndDate, filterMeal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const portions = parseInt(formPortions);
    if (isNaN(portions) || portions <= 0) {
      setError('Portions sold must be a positive integer greater than 0.');
      return;
    }

    const revenue = formRevenue ? parseFloat(formRevenue) : undefined;
    if (revenue !== undefined && (isNaN(revenue) || revenue < 0)) {
      setError('Revenue cannot be negative.');
      return;
    }

    try {
      if (editingSale) {
        await api.updateSale(editingSale.id, {
          date: formDate,
          meal_period: formMeal,
          recipe_id: formRecipeId,
          portions_sold: portions,
          revenue: revenue,
        });
      } else {
        await api.createSale({
          date: formDate,
          meal_period: formMeal,
          recipe_id: formRecipeId,
          portions_sold: portions,
          revenue: revenue,
        });
      }
      setShowAddModal(false);
      setEditingSale(null);
      setFormPortions('');
      setFormRevenue('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving sale');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove the sale record for "${name}"?`)) {
      return;
    }
    try {
      await api.deleteSale(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error deleting sale');
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormDate(sale.date);
    setFormMeal(sale.meal_period);
    setFormRecipeId(sale.recipe_id);
    setFormPortions(sale.portions_sold.toString());
    setFormRevenue(sale.revenue ? sale.revenue.toString() : '');
    setShowAddModal(true);
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportSummary(null);
    setError(null);

    try {
      const result = await api.importSalesCSV(file);
      setImportSummary(
        `Successfully imported ${result.imported} sales records!` +
          (result.errors?.length ? ` Encountered ${result.errors.length} errors.` : '')
      );
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // CSV Export URL
  const exportUrl = api.exportReportUrl(
    filterStartDate || '2020-01-01',
    filterEndDate || '2030-12-31',
    'sales'
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Sales Log</h1>
          <p className="text-sm text-[#78716C]">
            Track meal portions sold, customer revenues, and feed historical demand data
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <a
            href={exportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" />
            Export CSV
          </a>

          {/* Import CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn-outline px-3 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5 text-[#78716C]" />
            {importing ? 'Importing...' : 'Import CSV'}
          </button>

          {/* Add Sale Button */}
          <button
            onClick={() => {
              setEditingSale(null);
              setFormPortions('');
              setFormRevenue('');
              setShowAddModal(true);
            }}
            className="btn-forest px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Sale
          </button>
        </div>
      </div>

      {/* CSV template hint */}
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs text-[#78716C] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            CSV template format: <code>date,meal_period,recipe_id,portions_sold,revenue</code>
          </span>
        </div>
        <span className="text-[11px] text-[#A8A29E]">UTF-8 encoded</span>
      </div>

      {importSummary && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
          {importSummary}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-warm p-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-[#57534E]">
          <Filter className="w-3.5 h-3.5" />
          Filters:
        </div>

        <div className="flex items-center gap-2">
          <span>From:</span>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => setFilterStartDate(e.target.value)}
            className="border border-[#E7E5E4] rounded px-2 py-1 bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span>To:</span>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => setFilterEndDate(e.target.value)}
            className="border border-[#E7E5E4] rounded px-2 py-1 bg-white outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span>Meal:</span>
          <select
            value={filterMeal}
            onChange={(e) => setFilterMeal(e.target.value)}
            className="border border-[#E7E5E4] rounded px-2 py-1 bg-white outline-none capitalize"
          >
            <option value="">All Meals</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>
        </div>

        {(filterStartDate || filterEndDate || filterMeal) && (
          <button
            onClick={() => {
              setFilterStartDate('');
              setFilterEndDate('');
              setFilterMeal('');
            }}
            className="text-stone-500 hover:text-stone-800 underline ml-auto text-[11px]"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Sales Table */}
      <div className="card-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] border-b border-[#E7E5E4] text-[#78716C] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meal Period</th>
                <th className="py-3 px-4">Dish / Recipe</th>
                <th className="py-3 px-4 text-right">Portions Sold</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Data Type</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-[#FDFBF7]">
                  <td className="py-3 px-4 font-mono text-[#1C1917]">{sale.date}</td>
                  <td className="py-3 px-4 capitalize">
                    <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                      {sale.meal_period}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#1C1917]">{sale.recipe_name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[#1B4332]">
                    {sale.portions_sold}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-stone-700">
                    {sale.revenue !== undefined && sale.revenue !== null ? `₹${sale.revenue}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {sale.is_demo ? (
                      <span className="badge-demo">Demo</span>
                    ) : (
                      <span className="text-[10px] text-stone-400">Live</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(sale)}
                      className="p-1 hover:text-stone-900 text-stone-500 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5 inline" />
                    </button>
                    <button
                      onClick={() => handleDelete(sale.id, sale.recipe_name)}
                      className="p-1 hover:text-red-700 text-stone-400 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#A8A29E]">
                    {loading ? 'Loading sales records...' : 'No sales records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record / Edit Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <h3 className="font-bold text-base text-[#0F291E]">
                {editingSale ? 'Edit Sale Record' : 'Record New Sale'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Meal Period</label>
                <select
                  value={formMeal}
                  onChange={(e) => setFormMeal(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none capitalize"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snacks">Snacks</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Recipe / Dish</label>
                <select
                  value={formRecipeId}
                  onChange={(e) => setFormRecipeId(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.meal_category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Portions Sold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 25"
                    value={formPortions}
                    onChange={(e) => setFormPortions(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Revenue (₹, optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 750"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-forest px-5 py-2 font-semibold">
                  {editingSale ? 'Save Changes' : 'Add Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
