'use client';

import { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  TrendingDown,
  AlertCircle,
  X,
  PieChart as PieIcon,
  BarChart2,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { api, WasteRecord, Recipe } from '@/lib/api';

const WASTE_REASONS = [
  'Overestimated demand',
  'Late order cancellations',
  'Weather / rain reduced walk-ins',
  'Preparation / quality defect',
  'Portion measurement discrepancy',
  'Other',
];

export default function WastePage() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState<string>('');
  const [formMeal, setFormMeal] = useState<string>('lunch');
  const [formRecipeId, setFormRecipeId] = useState<string>('');
  const [formPrepared, setFormPrepared] = useState<string>('');
  const [formSold, setFormSold] = useState<string>('');
  const [formReason, setFormReason] = useState<string>(WASTE_REASONS[0]);

  useEffect(() => {
    setFormDate(new Date().toISOString().split('T')[0]);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [wRes, rRes] = await Promise.all([api.getWaste(), api.getRecipes()]);
      setWasteRecords(wRes.items);
      setRecipes(rRes.items);
      if (rRes.items.length > 0 && !formRecipeId) {
        setFormRecipeId(rRes.items[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load waste records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const prepared = parseInt(formPrepared);
    const sold = parseInt(formSold);

    if (isNaN(prepared) || prepared <= 0) {
      setError('Portions prepared must be greater than 0.');
      return;
    }
    if (isNaN(sold) || sold < 0) {
      setError('Portions sold cannot be negative.');
      return;
    }
    if (sold > prepared) {
      setError('Portions sold cannot exceed portions prepared.');
      return;
    }

    try {
      await api.createWaste({
        date: formDate,
        meal_period: formMeal,
        recipe_id: formRecipeId,
        portions_prepared: prepared,
        portions_sold: sold,
        reason: formReason,
      });

      setShowModal(false);
      setFormPrepared('');
      setFormSold('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error logging waste record');
    }
  };

  // Aggregations
  const totalLeftoverPortions = wasteRecords.reduce((acc, w) => acc + w.leftover_portions, 0);
  const totalWasteCost = wasteRecords.reduce((acc, w) => acc + w.estimated_waste_cost, 0);

  // Group by recipe for top waste
  const wasteByRecipe: Record<string, { portions: number; cost: number; name: string }> = {};
  wasteRecords.forEach((w) => {
    if (!wasteByRecipe[w.recipe_id]) {
      wasteByRecipe[w.recipe_id] = { portions: 0, cost: 0, name: w.recipe_name };
    }
    wasteByRecipe[w.recipe_id].portions += w.leftover_portions;
    wasteByRecipe[w.recipe_id].cost += w.estimated_waste_cost;
  });

  const topWasteList = Object.values(wasteByRecipe)
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // Chart data: Prepared vs Sold comparison
  const chartData = wasteRecords.slice(0, 7).map((w) => ({
    name: `${w.date.slice(5)} ${w.recipe_name.split(' ')[0]}`,
    prepared: w.portions_prepared,
    sold: w.portions_sold,
    leftover: w.leftover_portions,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Leftover & Waste Tracker</h1>
          <p className="text-sm text-[#78716C]">
            Quantify unconsumed food, identify chronic overprep, and audit estimated food cost losses
          </p>
        </div>

        <button
          onClick={() => {
            setFormPrepared('');
            setFormSold('');
            setShowModal(true);
          }}
          className="btn-forest px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Log Meal Leftovers
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Total Leftover Portions
          </div>
          <div className="text-2xl font-bold text-[#0F291E]">{totalLeftoverPortions}</div>
          <p className="text-xs text-[#78716C] mt-1">Across all logged services</p>
        </div>

        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Estimated Waste Cost
          </div>
          <div className="text-2xl font-bold text-rose-700">₹{totalWasteCost.toLocaleString('en-IN')}</div>
          <p className="text-xs text-[#78716C] mt-1">
            <em>Estimated</em> based on recipe ingredient costs
          </p>
        </div>

        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Top Waste Dish
          </div>
          <div className="text-lg font-bold text-[#0F291E] truncate">
            {topWasteList[0]?.name || 'No data yet'}
          </div>
          <p className="text-xs text-rose-600 font-medium mt-1">
            {topWasteList[0] ? `₹${topWasteList[0].cost} est. lost` : 'Log leftovers to calculate'}
          </p>
        </div>
      </div>

      {/* Comparison Chart & Top Dishes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prepared vs Sold chart (2 cols) */}
        <div className="lg:col-span-2 card-warm p-5">
          <h2 className="text-sm font-semibold text-[#0F291E] mb-1">Prepared vs Sold Comparison</h2>
          <p className="text-xs text-[#78716C] mb-4">
            Recent services comparing portion count prepared against customer portions sold
          </p>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEB" vertical={false} />
                  <XAxis dataKey="name" stroke="#A8A29E" fontSize={11} tickLine={false} />
                  <YAxis stroke="#A8A29E" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5E4',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="prepared" name="Prepared" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="sold" name="Sold" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#A8A29E]">
                No waste records available for chart rendering.
              </div>
            )}
          </div>
        </div>

        {/* Top Waste Dishes (1 col) */}
        <div className="card-warm p-5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0F291E] mb-1">Top Dishes by Recorded Waste</h2>
            <p className="text-xs text-[#78716C] mb-3">Highest cumulative estimated financial loss</p>

            <div className="divide-y divide-[#E7E5E4]">
              {topWasteList.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-[#1C1917]">{item.name}</div>
                    <div className="text-[11px] text-[#78716C]">{item.portions} portions left over</div>
                  </div>
                  <div className="text-right font-mono font-bold text-rose-700">₹{item.cost}</div>
                </div>
              ))}
              {topWasteList.length === 0 && (
                <div className="py-8 text-center text-xs text-[#A8A29E]">No waste data yet.</div>
              )}
            </div>
          </div>

          <div className="p-2.5 bg-[#FFFBEB] rounded-lg border border-[#FDE68A] text-[11px] text-[#92400E] mt-4 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D97706]" />
            <span>
              Leftover cost figures are estimates calculated from ingredient costs per portion, excluding labor and overhead.
            </span>
          </div>
        </div>
      </div>

      {/* Waste Records Table */}
      <div className="card-warm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] border-b border-[#E7E5E4] text-[#78716C] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Meal Period</th>
                <th className="py-3 px-4">Dish</th>
                <th className="py-3 px-4 text-right">Prepared</th>
                <th className="py-3 px-4 text-right">Sold</th>
                <th className="py-3 px-4 text-right">Leftover Portions</th>
                <th className="py-3 px-4 text-right">Est. Waste Cost</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {wasteRecords.map((w) => (
                <tr key={w.id} className="hover:bg-[#FDFBF7]">
                  <td className="py-3 px-4 font-mono">{w.date}</td>
                  <td className="py-3 px-4 capitalize">
                    <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded text-[11px]">
                      {w.meal_period}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#1C1917]">{w.recipe_name}</td>
                  <td className="py-3 px-4 text-right font-mono text-stone-600">{w.portions_prepared}</td>
                  <td className="py-3 px-4 text-right font-mono text-stone-600">{w.portions_sold}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">
                    {w.leftover_portions}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#1C1917]">
                    ₹{w.estimated_waste_cost}
                  </td>
                  <td className="py-3 px-4 text-stone-600 text-[11px]">{w.reason || '—'}</td>
                </tr>
              ))}
              {wasteRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A8A29E]">
                    {loading ? 'Loading waste records...' : 'No waste records found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Leftovers Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <h3 className="font-bold text-base text-[#0F291E]">Log Service Leftovers</h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
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
                <label className="block font-semibold text-[#57534E] mb-1">Dish / Recipe</label>
                <select
                  value={formRecipeId}
                  onChange={(e) => setFormRecipeId(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Portions Prepared *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 30"
                    value={formPrepared}
                    onChange={(e) => setFormPrepared(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Portions Sold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="e.g. 24"
                    value={formSold}
                    onChange={(e) => setFormSold(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Reason for Leftovers</label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                >
                  {WASTE_REASONS.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline px-4 py-2">
                  Cancel
                </button>
                <button type="submit" className="btn-forest px-5 py-2 font-semibold">
                  Record Waste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
