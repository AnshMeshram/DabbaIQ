'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Receipt,
  AlertTriangle,
  Clock,
  TrendingDown,
  Sparkles,
  ArrowRight,
  PlusCircle,
  PackagePlus,
  RefreshCw,
  Calendar,
  ChefHat,
  Layers,
  CheckCircle2,
  AlertCircle,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { api, DashboardData } from '@/lib/api';
import ShiftTelemetryBar from '@/components/ShiftTelemetryBar';
import QuickSaleModal from '@/components/QuickSaleModal';
import DemoBanner from '@/components/DemoBanner';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [reconcileNotice, setReconcileNotice] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (dateStr?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboard(dateStr || undefined);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchDashboard(today);
  }, [fetchDashboard]);

  const handleReconcile = () => {
    const planned = data?.expected_portions || 0;
    const sold = data?.recorded_sales || 0;
    const diff = planned - sold;
    if (diff > 0) {
      setReconcileNotice(
        `Batch Reconciliation: ${diff} unsold portions remaining for lunch shift. Auto-logging surplus to Waste Tracker.`
      );
    } else {
      setReconcileNotice(
        `Batch Reconciliation: All ${planned} planned portions fully cleared or exceeded with walk-in demand.`
      );
    }
    setTimeout(() => setReconcileNotice(null), 7000);
  };

  return (
    <div className="space-y-6">
      {/* Connectivity & Offline Banner */}
      <DemoBanner dbDisconnected={data?.db_connected === false} />

      {/* Date Header & Operational Desk Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
              Master Kitchen Desk
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
              LIVE
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Real-time batch telemetries, Dabba tier tracking, and operational intelligence
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 bg-white border border-outline-variant/80 rounded-lg px-3 py-1.5 shadow-xs text-xs font-mono">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                fetchDashboard(e.target.value);
              }}
              className="bg-transparent font-medium text-on-surface outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={() => fetchDashboard(selectedDate)}
            className="p-2 border border-outline-variant/80 rounded-lg bg-white hover:bg-surface-container text-on-surface-variant transition-colors shadow-xs"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Shift Dispatch Rail (Stitch Signature Telemetry) */}
      <ShiftTelemetryBar
        targetDabbas={data?.expected_portions || 185}
        onQuickReconcile={handleReconcile}
        onOpenWalkInModal={() => setIsQuickSaleOpen(true)}
      />

      {/* Reconcile Flash Alert */}
      {reconcileNotice && (
        <div className="p-3 bg-surface-container-high border-2 border-primary/40 rounded-xl text-xs font-mono text-primary flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-secondary shrink-0" />
            <span>{reconcileNotice}</span>
          </div>
          <button
            onClick={() => setReconcileNotice(null)}
            className="text-on-surface-variant hover:text-on-surface font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* API Connection Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/30 text-error text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error} — Ensure FastAPI backend is running on port 8000.</span>
          </div>
          <button
            onClick={() => fetchDashboard(selectedDate)}
            className="underline font-bold hover:text-on-error-container"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 4-Metric KPI Ledger Cards (Stitch Spec) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Production Volume */}
        <div className="desk-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Production Vol.
              </span>
              <span className="p-1.5 rounded-md bg-surface-container text-primary">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-primary">
                {data?.expected_portions || 0}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">dabbas planned</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-mono">
            <span className="text-on-surface-variant">Confirmed orders</span>
            <span className="font-semibold text-primary">
              {data?.next_plan ? `${data.next_plan.recipes?.length || 0} dishes` : 'Standing plan'}
            </span>
          </div>
        </div>

        {/* KPI 2: Sales Velocity */}
        <div className="desk-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Sales Velocity
              </span>
              <span className="p-1.5 rounded-md bg-secondary-fixed text-secondary">
                <Receipt className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-secondary">
                ₹{data?.total_revenue?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-mono">
            <span className="text-on-surface-variant">Recorded sales</span>
            <span className="font-bold text-secondary">
              {data?.recorded_sales || 0} portions logged
            </span>
          </div>
        </div>

        {/* KPI 3: Food Loss Intelligence */}
        <div className="desk-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Food Loss Cost
              </span>
              <span className="p-1.5 rounded-md bg-error-container text-error">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-error">
                ₹{data?.estimated_waste_cost?.toLocaleString('en-IN') || 0}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-mono">
            <span className="text-on-surface-variant">Unconsumed portions</span>
            <span className="font-bold text-error">
              {data?.leftover_portions || 0} portions
            </span>
          </div>
        </div>

        {/* KPI 4: Inventory Restock Alert */}
        <div className="desk-card p-4 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-on-surface-variant mb-1.5">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider">
                Restock Warnings
              </span>
              <span className="p-1.5 rounded-md bg-tertiary-fixed text-on-tertiary-fixed">
                <AlertTriangle className="w-4 h-4" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-primary">
                {data?.low_stock_items?.length || 0}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">items low</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-outline-variant/40 flex items-center justify-between text-[11px] font-mono">
            <span className="text-on-surface-variant">Perishables near expiry</span>
            <span className={`font-bold ${data?.expiring_items?.length ? 'text-secondary' : 'text-primary'}`}>
              {data?.expiring_items?.length || 0} items
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Operational Desk Grid (Matches Stitch 2566x3768 Canvas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): 7-Day Sales Trend & Inside the Dabba 4-Tier Inspection */}
        <div className="lg:col-span-7 space-y-6">
          {/* 7-Day Sales & Portions Trend Chart */}
          <div className="desk-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/40">
              <div>
                <h2 className="font-headline font-bold text-base text-primary">
                  7-Day Portion Sales &amp; Revenue Ledger
                </h2>
                <p className="font-body text-xs text-on-surface-variant">
                  Grounded historical demand utilized by Gemma AI for portion baseline forecasting
                </p>
              </div>
              <Link
                href="/sales"
                className="font-mono text-xs font-semibold text-primary hover:text-secondary inline-flex items-center gap-1"
              >
                Full Sales Log →
              </Link>
            </div>

            <div className="h-64 w-full">
              {data?.sales_chart_data && data.sales_chart_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.sales_chart_data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e6e2da" vertical={false} />
                    <XAxis
                      dataKey="day"
                      stroke="#71796f"
                      fontSize={11}
                      tickLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <YAxis
                      stroke="#71796f"
                      fontSize={11}
                      tickLine={false}
                      fontFamily="var(--font-mono)"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e6e2da',
                        borderRadius: '0.5rem',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                      }}
                      formatter={(value: any, name: any) => [
                        name === 'portions' ? `${value} portions` : `₹${value}`,
                        name === 'portions' ? 'Portions Sold' : 'Gross Revenue',
                      ]}
                    />
                    <Bar dataKey="portions" fill="#ff641a" radius={[4, 4, 0, 0]} name="portions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-on-surface-variant text-xs space-y-2">
                  <p>No historical transactions recorded in this window.</p>
                  <button
                    onClick={() => setIsQuickSaleOpen(true)}
                    className="btn-secondary text-xs"
                  >
                    + Record First Sale Ticket
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Inside the Dabba — 4-Tier Lunch Assembly Breakdown */}
          <div className="desk-card p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/40">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                  🍱
                </div>
                <div>
                  <h2 className="font-headline font-bold text-base text-primary">
                    Inside the Dabba — Tier Assembly Inspection
                  </h2>
                  <p className="font-body text-xs text-on-surface-variant">
                    Standard 4-tier cylindrical stainless steel tiffin prep status
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/experience"
                  className="font-mono text-xs font-semibold text-secondary hover:text-primary transition flex items-center gap-1"
                >
                  <span>3D Storyboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <span className="font-mono text-xs px-2 py-0.5 rounded-sm bg-surface-container text-primary font-semibold">
                  MUM-04 Prep Line
                </span>
              </div>
            </div>

            <div className="space-y-3 font-body text-xs">
              {/* Tier 1 */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-mono font-bold text-xs">
                    01
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">Tier 1: Fresh Phulkas / Rotis</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Folded whole-wheat phulkas brushed with ghee • Station Baker 1
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="badge-fresh">98% READY</span>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">370 pcs baked</div>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-center font-mono font-bold text-xs">
                    02
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">Tier 2: Dal Tadka / Toor Dal</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Tempered with mustard seeds, curry leaves &amp; garlic • Kettle 2
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="badge-fresh">100% READY</span>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">38L holding @ 74°C</div>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center font-mono font-bold text-xs">
                    03
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">Tier 3: Steamed Basmati Jeera Rice</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Fluffy long-grain basmati with toasted cumin • Steamer Station A
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="badge-fresh">100% READY</span>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">42 kg steamed</div>
                </div>
              </div>

              {/* Tier 4 */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center font-mono font-bold text-xs">
                    04
                  </div>
                  <div>
                    <div className="font-bold text-on-surface">Tier 4: Dry Subzi / Aloo Gobi Adraki</div>
                    <div className="text-[11px] text-on-surface-variant">
                      Spiced cauliflower &amp; potatoes with fresh ginger • Kadai 3
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="badge-live">PORTIONING</span>
                  <div className="text-[10px] text-on-surface-variant mt-0.5">140 / 185 packed</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Next Prep Plan & Inventory Restock Ledger */}
        <div className="lg:col-span-5 space-y-6">
          {/* Next Preparation Plan (Direct link to /planner) */}
          <div className="desk-card p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/40">
                <h2 className="font-headline font-bold text-base text-primary flex items-center gap-2">
                  <ChefHat className="w-4 h-4 text-secondary" />
                  Active Prep Plan
                </h2>
                {data?.next_plan ? (
                  <span className="badge-live">
                    CONFIRMED
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-sm">
                    PENDING
                  </span>
                )}
              </div>

              {data?.next_plan ? (
                <div className="space-y-3 font-body text-xs">
                  <div className="p-2.5 bg-surface-container-low rounded-lg flex items-center justify-between font-mono">
                    <span className="text-on-surface-variant">Target Date:</span>
                    <strong className="text-primary">{data.next_plan.target_date} ({data.next_plan.meal_period})</strong>
                  </div>

                  <div className="divide-y divide-outline-variant/40 max-h-48 overflow-y-auto pr-1">
                    {data.next_plan.recipes?.map((r: any, idx: number) => (
                      <div key={idx} className="py-2 flex items-center justify-between">
                        <span className="font-semibold text-on-surface">{r.recipe_name}</span>
                        <span className="font-mono font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-sm">
                          {r.total_portions} portions
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2.5 border-t border-outline-variant/40 flex justify-between items-center font-mono">
                    <span className="text-on-surface-variant">Estimated Bill of Materials:</span>
                    <span className="font-headline font-bold text-base text-primary">
                      ₹{data.next_plan.estimated_total_cost}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-on-surface-variant font-body text-xs space-y-2">
                  <p className="font-semibold text-on-surface">No active prep plan generated for this date.</p>
                  <p className="text-[11px] text-on-surface-variant">
                    Run the Gemma AI planner to compute meal portion forecasts, safety buffers, and ingredient shortages.
                  </p>
                </div>
              )}
            </div>

            <Link
              href="/planner"
              className="w-full mt-4 btn-primary text-xs text-center py-2.5 block"
            >
              {data?.next_plan ? 'Inspect Plan & Shopping List' : 'Generate Preparation Plan →'}
            </Link>
          </div>

          {/* Low Stock Threshold Warnings */}
          <div className="desk-card p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/40">
              <h2 className="font-headline font-bold text-sm text-primary flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-secondary" />
                Critical Stock Deficit
              </h2>
              <Link
                href="/inventory"
                className="font-mono text-xs font-semibold text-primary hover:underline"
              >
                Inventory →
              </Link>
            </div>

            {data?.low_stock_items && data.low_stock_items.length > 0 ? (
              <div className="divide-y divide-outline-variant/40 font-body text-xs">
                {data.low_stock_items.slice(0, 5).map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface capitalize">{item.name}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant">
                        Min threshold: {item.reorder_level} {item.unit}
                      </div>
                    </div>
                    <span className="badge-alert">
                      {item.quantity} {item.unit} left
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center font-body text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>All pantry ingredients safely above reorder levels.</span>
              </div>
            )}
          </div>

          {/* Perishable Shelf-Life Warnings */}
          <div className="desk-card p-5">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/40">
              <h2 className="font-headline font-bold text-sm text-primary flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-error" />
                Perishables Near Expiry (3 Days)
              </h2>
              <Link
                href="/inventory"
                className="font-mono text-xs font-semibold text-primary hover:underline"
              >
                Check Stock →
              </Link>
            </div>

            {data?.expiring_items && data.expiring_items.length > 0 ? (
              <div className="divide-y divide-outline-variant/40 font-body text-xs">
                {data.expiring_items.slice(0, 4).map((item) => (
                  <div key={item.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-on-surface capitalize">{item.name}</div>
                      <div className="text-[10px] font-mono text-on-surface-variant">
                        Available batch: {item.quantity} {item.unit}
                      </div>
                    </div>
                    <span className="badge-alert">
                      Exp: {item.expiry_date}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center font-body text-xs text-on-surface-variant flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Zero spoilage risk: No ingredients expiring in the next 3 days.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Walk-in Sale Modal Triggered from Live Desk Header */}
      <QuickSaleModal
        isOpen={isQuickSaleOpen}
        onClose={() => setIsQuickSaleOpen(false)}
        onSuccess={() => fetchDashboard(selectedDate)}
      />
    </div>
  );
}
