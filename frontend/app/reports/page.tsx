'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Boxes,
  CheckCircle2,
  ShieldCheck,
  Building2,
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

  const setPreset = (days: number) => {
    const end = new Date().toISOString().split('T')[0];
    const start = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
    setStartDate(start);
    setEndDate(end);
    fetchReports(start, end);
  };

  const salesExportUrl = api.exportReportUrl(startDate || '2026-10-01', endDate || '2026-10-31', 'sales');
  const wasteExportUrl = api.exportReportUrl(startDate || '2026-10-01', endDate || '2026-10-31', 'waste');
  const inventoryExportUrl = api.exportReportUrl(startDate || '2026-10-01', endDate || '2026-10-31', 'inventory');

  // Gross profit estimation: revenue - ingredient cost - waste cost
  const grossProfit = summary
    ? Math.round(
        summary.total_revenue -
          summary.estimated_ingredient_cost -
          summary.estimated_waste_cost
      )
    : 0;

  const grossMarginPct =
    summary && summary.total_revenue > 0
      ? ((grossProfit / summary.total_revenue) * 100).toFixed(1)
      : '0.0';

  const ingredientCostPct =
    summary && summary.total_revenue > 0
      ? ((summary.estimated_ingredient_cost / summary.total_revenue) * 100).toFixed(1)
      : '32.0';

  const wasteLossPct =
    summary && summary.total_revenue > 0
      ? ((summary.estimated_waste_cost / summary.total_revenue) * 100).toFixed(1)
      : '3.4';

  return (
    <div className="space-y-6">
      {/* Header Deck & Quick Export Buttons */}
      <div className="desk-card p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
              Business &amp; Operations Reports
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
              P&amp;L ROLLUP
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-surface-container-high text-on-surface-variant font-semibold">
              MUM-04 AUDIT
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Audited financial rollups, food-cost ratios, gross margin contributions, and downloadable operational spreadsheets.
          </p>
        </div>

        {/* CSV Export Triggers */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <a
            href={salesExportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Sales CSV</span>
          </a>
          <a
            href={wasteExportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Waste CSV</span>
          </a>
          <a
            href={inventoryExportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Inventory CSV</span>
          </a>
        </div>
      </div>

      {/* Date Range Filter Deck */}
      <div className="desk-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/40">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            <span className="text-on-surface font-semibold">Date Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-on-surface focus:outline-none text-[11px]"
            />
            <span className="text-outline">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-on-surface focus:outline-none text-[11px]"
            />
          </div>

          <div className="inline-flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/40">
            <button
              type="button"
              onClick={() => setPreset(7)}
              className="px-2.5 py-1 rounded text-on-surface hover:bg-surface-container-high transition text-[11px]"
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setPreset(14)}
              className="px-2.5 py-1 rounded text-on-surface hover:bg-surface-container-high transition text-[11px]"
            >
              Last 14 Days
            </button>
            <button
              type="button"
              onClick={() => setPreset(30)}
              className="px-2.5 py-1 rounded text-on-surface hover:bg-surface-container-high transition text-[11px]"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchReports()}
          className="p-2 rounded bg-surface-container hover:bg-surface-container-high text-primary transition flex items-center gap-1.5"
          title="Refresh Reports"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span className="font-semibold text-[11px]">Recalculate P&amp;L</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/30 text-error text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* 4 Financial Ledger Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* TOTAL REVENUE */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              TOTAL REVENUE
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary font-bold">
              ₹
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              ₹{summary ? Math.round(summary.total_revenue).toLocaleString('en-IN') : '0'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30 text-on-surface-variant">
            <span>
              {summary ? summary.total_sales_portions.toLocaleString('en-IN') : 0} portions sold
            </span>
            <span className="font-bold text-primary">
              @ ₹
              {summary && summary.total_sales_portions > 0
                ? Math.round(summary.total_revenue / summary.total_sales_portions)
                : 95}
              /unit
            </span>
          </div>
        </div>

        {/* EST. INGREDIENT COST */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              EST. INGREDIENT COST
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-secondary tracking-tight">
              ₹{summary ? Math.round(summary.estimated_ingredient_cost).toLocaleString('en-IN') : '0'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30 text-on-surface-variant">
            <span>Recipe Bills of Materials</span>
            <span className="font-bold text-secondary">{ingredientCostPct}% of rev</span>
          </div>
        </div>

        {/* EST. LEFTOVER LOSS */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              EST. LEFTOVER LOSS
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-error">
              <Trash2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-error tracking-tight">
              ₹{summary ? Math.round(summary.estimated_waste_cost).toLocaleString('en-IN') : '0'}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30 text-on-surface-variant">
            <span>
              {summary ? summary.total_waste_portions : 0} portions discarded
            </span>
            <span className="font-bold text-error">{wasteLossPct}% scrap</span>
          </div>
        </div>

        {/* EST. GROSS MARGIN */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              EST. GROSS MARGIN
            </span>
            <span className="w-7 h-7 rounded-lg bg-primary-fixed/40 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-primary tracking-tight">
              ₹{grossProfit.toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30 text-on-surface-variant">
            <span className="px-1.5 py-0.5 rounded-xs bg-primary-fixed text-on-primary-fixed font-bold">
              {grossMarginPct}% Margin
            </span>
            <span>Before overhead</span>
          </div>
        </div>
      </div>

      {/* Middle Analytics Panels (Grid Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel A: Sales Breakdown by Meal Service */}
        <div className="desk-card p-5">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30 mb-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Sales Breakdown by Meal Service
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-surface-container text-on-surface-variant">
              SHIFT REVENUE
            </span>
          </div>

          {!summary || summary.meal_summaries.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-body text-xs">
              No sales data recorded in this window.
            </div>
          ) : (
            <div className="space-y-4">
              {summary.meal_summaries.map((m) => {
                const pct =
                  summary.total_revenue > 0
                    ? ((m.revenue / summary.total_revenue) * 100).toFixed(1)
                    : '0';
                return (
                  <div key={m.meal_period} className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-on-surface capitalize font-headline font-bold">
                        {m.meal_period} Service
                      </span>
                      <span className="font-mono text-primary font-bold">
                        ₹{Math.round(m.revenue).toLocaleString('en-IN')}{' '}
                        <span className="text-on-surface-variant font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${Math.min(100, parseFloat(pct))}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-1.5">
                      <span>{m.portions} portions dispatched</span>
                      <span className="text-primary font-semibold">
                        Avg ₹{m.portions > 0 ? Math.round(m.revenue / m.portions) : 95}/dabba
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel B: Restock Priority (Below Threshold) */}
        <div className="desk-card p-5">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30 mb-4">
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Restock Priority (Below Threshold)
            </h3>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-error-container text-on-error-container font-bold">
              PANTRY DEFICITS
            </span>
          </div>

          {!summary || summary.restock_items.length === 0 ? (
            <div className="py-12 text-center text-on-surface-variant font-body text-xs space-y-2">
              <CheckCircle2 className="w-8 h-8 text-primary mx-auto" />
              <p className="font-bold text-on-surface">Pantry inventory healthy.</p>
              <p>All ingredients currently above reorder thresholds.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {summary.restock_items.map((item) => (
                <div
                  key={item.id}
                  className="bg-error-container/20 p-3 rounded-lg border border-error/30 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-headline font-bold text-xs text-on-surface">{item.name}</h4>
                    <span className="font-mono text-[10px] text-error font-semibold">
                      Current: {item.quantity} {item.unit} (Threshold: {item.reorder_level} {item.unit})
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-xs bg-error text-white font-mono text-[10px] font-bold">
                    DEFICIT
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Performance Breakdown Table */}
      <div className="desk-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Daily Financial Performance Breakdown
              </h2>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Net gross margin per active kitchen operating day in selected window.
            </p>
          </div>

          <span className="font-mono text-xs text-on-surface-variant">
            {summary?.daily_breakdown?.length || 0} active days
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/40">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-center">Portions Sold</th>
                <th className="py-3 px-4 text-right">Daily Revenue (₹)</th>
                <th className="py-3 px-4 text-right">Avg Price / Portion</th>
                <th className="py-3 px-4 text-right">Est. Gross Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-body text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant font-mono">
                    Compiling financial reports...
                  </td>
                </tr>
              ) : !summary || summary.daily_breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-on-surface-variant">
                    No recorded days in selected range.
                  </td>
                </tr>
              ) : (
                summary.daily_breakdown.map((row) => {
                  const avg = row.portions > 0 ? Math.round(row.revenue / row.portions) : 0;
                  const estimatedDayMargin = Math.round(row.revenue * 0.62);
                  return (
                    <tr
                      key={row.date}
                      className="hover:bg-surface-container-low/70 transition-colors bg-surface-container-lowest"
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-on-surface">
                        {row.date}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-primary">
                        {row.portions} dabbas
                      </td>
                      <td className="py-3.5 px-4 text-right font-headline font-bold text-on-surface">
                        ₹{Math.round(row.revenue).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-on-surface-variant">
                        ₹{avg} / unit
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-primary-fixed/40 font-mono text-[11px] font-bold text-primary border border-primary/20">
                          ₹{estimatedDayMargin.toLocaleString('en-IN')} (~62%)
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
