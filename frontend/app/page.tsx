'use client';

import { useEffect, useState } from 'react';
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
import DemoBanner from '@/components/DemoBanner';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const fetchDashboard = async (dateStr?: string) => {
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
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchDashboard(today);
  }, []);

  return (
    <div className="space-y-6">
      {/* Demo / Connectivity Banner */}
      <DemoBanner dbDisconnected={data?.db_connected === false} />

      {/* Header & Date Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Kitchen Overview</h1>
          <p className="text-sm text-[#78716C]">
            Live operational intelligence for your tiffin & meal prep operations
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E7E5E4] rounded-lg px-3 py-1.5 shadow-xs text-sm">
            <Calendar className="w-4 h-4 text-[#78716C]" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-sm font-medium text-[#1C1917] outline-none"
            />
          </div>
          <button
            onClick={() => fetchDashboard(selectedDate)}
            className="p-2 border border-[#E7E5E4] rounded-lg bg-[#FFFFFF] hover:bg-[#F5F5F4] text-[#57534E]"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center justify-between">
          <span>{error} — Ensure FastAPI backend is running on port 8000.</span>
          <button
            onClick={() => fetchDashboard(selectedDate)}
            className="underline font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link
          href="/planner"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#1B4332] text-white hover:bg-[#2D6A4F] transition shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/10 text-amber-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm">Generate Prep Plan</div>
              <div className="text-xs text-emerald-100">AI Forecast & Shopping List</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 opacity-75 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/sales"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7E5E4] hover:bg-[#F5F5F4] transition shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EBF8EE] text-[#1B4332]">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1C1917]">Record Today's Sale</div>
              <div className="text-xs text-[#78716C]">Log meal portions & revenue</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A8A29E] group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/inventory"
          className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFFFFF] border border-[#E7E5E4] hover:bg-[#F5F5F4] transition shadow-xs group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FFFBEB] text-[#D97706]">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-sm text-[#1C1917]">Update Inventory</div>
              <div className="text-xs text-[#78716C]">Stock counts & costs</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[#A8A29E] group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned / Expected */}
        <div className="card-warm p-4">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Planned Portions</span>
            <UtensilsCrossed className="w-4 h-4 text-[#1B4332]" />
          </div>
          <div className="text-2xl font-bold text-[#0F291E]">
            {data?.expected_portions || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">Confirmed from preparation plan</p>
        </div>

        {/* Recorded Sales */}
        <div className="card-warm p-4">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Recorded Sales</span>
            <Receipt className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-bold text-[#0F291E]">
            {data?.recorded_sales || 0} <span className="text-xs font-normal text-[#78716C]">portions</span>
          </div>
          <p className="text-xs text-emerald-700 font-medium mt-1">
            ₹{data?.total_revenue?.toLocaleString('en-IN') || 0} revenue
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="card-warm p-4">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock Items</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-700">
            {data?.low_stock_items?.length || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            {data?.low_stock_items?.length ? 'Needs immediate restock' : 'Stock levels healthy'}
          </p>
        </div>

        {/* Waste / Leftovers */}
        <div className="card-warm p-4">
          <div className="flex items-center justify-between text-[#78716C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Leftover Cost</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-700">
            ₹{data?.estimated_waste_cost?.toLocaleString('en-IN') || 0}
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            {data?.leftover_portions || 0} portions unconsumed
          </p>
        </div>
      </div>

      {/* Main Grid: 7-Day Chart + Next Prep Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart (2 cols) */}
        <div className="lg:col-span-2 card-warm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-[#0F291E]">7-Day Sales & Portions</h2>
              <p className="text-xs text-[#78716C]">Historical sales volume used for AI baseline forecasting</p>
            </div>
            <Link href="/sales" className="text-xs font-semibold text-[#1B4332] hover:underline">
              View All Sales &rarr;
            </Link>
          </div>

          <div className="h-64 w-full">
            {data?.sales_chart_data && data.sales_chart_data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sales_chart_data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EFEB" vertical={false} />
                  <XAxis dataKey="day" stroke="#A8A29E" fontSize={12} tickLine={false} />
                  <YAxis stroke="#A8A29E" fontSize={12} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E5E4',
                      borderRadius: '0.5rem',
                      fontSize: '12px',
                    }}
                    formatter={(value: any, name: any) => [
                      name === 'portions' ? `${value} portions` : `₹${value}`,
                      name === 'portions' ? 'Portions Sold' : 'Revenue',
                    ]}
                  />
                  <Bar dataKey="portions" fill="#1B4332" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#A8A29E] text-sm">
                <p>No historical sales recorded in this period</p>
                <Link href="/sales" className="text-xs text-[#1B4332] font-semibold mt-1 hover:underline">
                  + Add sales records
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Next Preparation Plan (1 col) */}
        <div className="card-warm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#0F291E] flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[#D97706]" />
                Confirmed Prep Plan
              </h2>
              {data?.next_plan && (
                <span className="text-[10px] font-semibold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Confirmed
                </span>
              )}
            </div>

            {data?.next_plan ? (
              <div className="space-y-3">
                <div className="text-xs text-[#78716C]">
                  Target: <strong>{data.next_plan.target_date}</strong> ({data.next_plan.meal_period})
                </div>

                <div className="divide-y divide-[#E7E5E4] max-h-48 overflow-y-auto pr-1">
                  {data.next_plan.recipes?.map((r: any, idx: number) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-xs">
                      <span className="font-medium text-[#1C1917]">{r.recipe_name}</span>
                      <span className="font-semibold text-[#1B4332]">{r.total_portions} portions</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-[#E7E5E4] flex justify-between text-xs text-[#57534E]">
                  <span>Est. Ingredient Cost:</span>
                  <span className="font-bold text-[#1C1917]">₹{data.next_plan.estimated_total_cost}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-[#78716C] text-xs space-y-2">
                <p>No confirmed prep plan for today yet.</p>
                <p className="text-[11px] text-[#A8A29E]">
                  Use the AI Preparation Planner to calculate portions and check shortages.
                </p>
              </div>
            )}
          </div>

          <Link
            href="/planner"
            className="w-full mt-4 btn-forest text-center py-2.5 text-xs font-semibold block"
          >
            {data?.next_plan ? 'Open Prep Planner' : 'Create Prep Plan Now'}
          </Link>
        </div>
      </div>

      {/* Warnings Grid: Low Stock & Expiring Ingredients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Low Stock List */}
        <div className="card-warm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0F291E] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Ingredients Below Reorder Threshold
            </h2>
            <Link href="/inventory" className="text-xs text-[#1B4332] font-semibold hover:underline">
              Inventory &rarr;
            </Link>
          </div>

          {data?.low_stock_items && data.low_stock_items.length > 0 ? (
            <div className="divide-y divide-[#E7E5E4]">
              {data.low_stock_items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[#1C1917] capitalize">{item.name}</span>
                    <span className="text-[#A8A29E] ml-2">threshold: {item.reorder_level} {item.unit}</span>
                  </div>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    {item.quantity} {item.unit} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#78716C]">
              All ingredient quantities are safely above reorder levels.
            </div>
          )}
        </div>

        {/* Expiring Ingredients */}
        <div className="card-warm p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#0F291E] flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Perishable Items Expiring Soon (3 Days)
            </h2>
            <Link href="/inventory" className="text-xs text-[#1B4332] font-semibold hover:underline">
              Check Dates &rarr;
            </Link>
          </div>

          {data?.expiring_items && data.expiring_items.length > 0 ? (
            <div className="divide-y divide-[#E7E5E4]">
              {data.expiring_items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-medium text-[#1C1917] capitalize">{item.name}</span>
                    <span className="text-[#78716C] ml-2">({item.quantity} {item.unit})</span>
                  </div>
                  <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Exp: {item.expiry_date}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#78716C]">
              No perishable ingredients nearing expiration in the next 3 days.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
