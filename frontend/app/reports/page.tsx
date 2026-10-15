'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Receipt,
  Trash2,
  DollarSign,
  FileSpreadsheet,
} from 'lucide-react';
import { api, ReportSummary } from '@/lib/api';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async (start?: string, end?: string) => {
    const s = start || startDate;
    const e = end || endDate;
    if (!s || !e) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReportSummary(s, e);
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load report summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    fetchReports(start, end);
  }, []);

  const salesExportUrl = api.exportReportUrl(startDate, endDate, 'sales');
  const wasteExportUrl = api.exportReportUrl(startDate, endDate, 'waste');
  const inventoryExportUrl = api.exportReportUrl(startDate, endDate, 'inventory');

  // Gross profit estimation: revenue - ingredient cost - waste cost
  const grossProfit = summary
    ? Math.round(
        summary.total_revenue -
          summary.estimated_ingredient_cost -
          summary.estimated_waste_cost
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Business & Operations Reports</h1>
          <p className="text-sm text-[#78716C]">
            Audited financial rollups, food-cost ratios, and downloadable operational spreadsheets
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={salesExportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" />
            Sales CSV
          </a>
          <a
            href={wasteExportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" />
            Waste CSV
          </a>
          <a
            href={inventoryExportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#78716C]" />
            Inventory CSV
          </a>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card-warm p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#57534E]">Date Range:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-[#E7E5E4] rounded px-2.5 py-1 bg-white outline-none"
            />
            <span className="text-stone-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-[#E7E5E4] rounded px-2.5 py-1 bg-white outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick presets */}
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
          >
            Last 7 Days
          </button>
          <button
            onClick={() => {
              setStartDate(new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-2.5 py-1 rounded bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium"
          >
            Last 14 Days
          </button>
          <button
            onClick={() => fetchReports()}
            className="p-1.5 border border-[#E7E5E4] rounded hover:bg-stone-50"
            title="Refresh report"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Total Revenue
          </div>
          <div className="text-2xl font-bold text-[#1B4332]">
            ₹{summary?.total_revenue?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            {summary?.total_sales_portions || 0} portions sold
          </p>
        </div>

        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Est. Ingredient Cost
          </div>
          <div className="text-2xl font-bold text-stone-800">
            ₹{summary?.estimated_ingredient_cost?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">From recipe bills of materials</p>
        </div>

        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Est. Leftover Loss
          </div>
          <div className="text-2xl font-bold text-rose-700">
            ₹{summary?.estimated_waste_cost?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            {summary?.total_waste_portions || 0} portions discarded
          </p>
        </div>

        <div className="card-warm p-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#78716C] mb-1">
            Est. Gross Margin
          </div>
          <div className={`text-2xl font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            ₹{grossProfit.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-[#78716C] mt-1">Before labor & utility overhead</p>
        </div>
      </div>

      {/* Meal Breakdown & Daily Sales Rollup */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meal Period Rollup */}
        <div className="card-warm p-5">
          <h2 className="text-sm font-semibold text-[#0F291E] mb-3">Sales Breakdown by Meal Service</h2>
          <div className="divide-y divide-[#E7E5E4]">
            {summary?.meal_summaries?.map((m) => (
              <div key={m.meal_period} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold capitalize text-[#1C1917]">{m.meal_period}</span>
                  <span className="text-[#78716C] ml-2">({m.portions} portions)</span>
                </div>
                <div className="font-mono font-bold text-[#1B4332]">₹{m.revenue.toLocaleString('en-IN')}</div>
              </div>
            ))}
            {(!summary?.meal_summaries || summary.meal_summaries.length === 0) && (
              <div className="py-8 text-center text-xs text-[#A8A29E]">No sales data in this window.</div>
            )}
          </div>
        </div>

        {/* Restock Priority Items */}
        <div className="card-warm p-5">
          <h2 className="text-sm font-semibold text-[#0F291E] mb-3">Restock Priority (Below Threshold)</h2>
          <div className="divide-y divide-[#E7E5E4]">
            {summary?.restock_items?.map((item) => (
              <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-[#1C1917] capitalize">{item.name}</span>
                  <span className="text-stone-400 ml-2">threshold: {item.reorder_level} {item.unit}</span>
                </div>
                <div className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {item.quantity} {item.unit}
                </div>
              </div>
            ))}
            {(!summary?.restock_items || summary.restock_items.length === 0) && (
              <div className="py-8 text-center text-xs text-[#A8A29E]">
                All ingredients currently above reorder thresholds.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Breakdown Table */}
      <div className="card-warm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E7E5E4] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#0F291E]">Daily Volume Breakdown</h2>
          <span className="text-xs text-[#78716C]">{summary?.daily_breakdown?.length || 0} active days</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FBF9F5] border-b border-[#E7E5E4] text-[#78716C] uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Portions Sold</th>
                <th className="py-3 px-4 text-right">Daily Revenue</th>
                <th className="py-3 px-4 text-right">Average Price / Portion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E5E4]">
              {summary?.daily_breakdown?.map((day) => {
                const avgPrice = day.portions > 0 ? (day.revenue / day.portions).toFixed(1) : '—';
                return (
                  <tr key={day.date} className="hover:bg-[#FDFBF7]">
                    <td className="py-3 px-4 font-mono font-medium">{day.date}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#1B4332]">
                      {day.portions}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">₹{day.revenue.toLocaleString('en-IN')}</td>
                    <td className="py-3 px-4 text-right font-mono text-stone-600">₹{avgPrice}</td>
                  </tr>
                );
              })}
              {(!summary?.daily_breakdown || summary.daily_breakdown.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#A8A29E]">
                    No recorded days in selected range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
