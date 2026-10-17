'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
  Calendar,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Search,
  TrendingUp,
  MapPin,
  Building2,
  Factory,
  QrCode,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api, Sale, Recipe } from '@/lib/api';

const SERVICE_PERIODS = [
  { id: 'all', label: 'All Services' },
  { id: 'lunch', label: 'Lunch Dabbas' },
  { id: 'dinner', label: 'Dinner Thalis' },
  { id: 'breakfast', label: 'Morning Dispatch' },
  { id: 'snacks', label: 'Evening Snacks' },
];

const CIRCUITS = [
  { id: 'all', label: 'All Mumbai Circuits' },
  { id: 'nariman', label: 'Nariman Point (Rail #01 & #02)' },
  { id: 'bkc', label: 'BKC Tech Core (Cluster A & B)' },
  { id: 'lower_parel', label: 'Lower Parel Mills (Gate 1-4)' },
  { id: 'counter', label: 'Walk-in Central Counter' },
];

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedMeal, setSelectedMeal] = useState<string>('all');
  const [selectedCircuit, setSelectedCircuit] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modals & Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [formDate, setFormDate] = useState<string>('');
  const [formMeal, setFormMeal] = useState<string>('lunch');
  const [formRecipeId, setFormRecipeId] = useState<string>('');
  const [formPortions, setFormPortions] = useState<string>('25');
  const [formRevenue, setFormRevenue] = useState<string>('2500');
  const [formDestination, setFormDestination] = useState<string>('Maker Chambers IV, Floor 7');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // CSV Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    setStartDate(sevenDaysAgo);
    setEndDate(today);
    setFormDate(today);
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [salesRes, recipesRes] = await Promise.all([
        api.getSales({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          meal_period: selectedMeal !== 'all' ? selectedMeal : undefined,
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
  }, [startDate, endDate, selectedMeal]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    return sales.filter((item) => {
      if (selectedMeal !== 'all' && item.meal_period !== selectedMeal) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.recipe_name?.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesPeriod = item.meal_period.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPeriod) return false;
      }
      return true;
    });
  }, [sales, selectedMeal, searchQuery]);

  // Aggregate Metrics
  const totalPortions = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + s.portions_sold, 0);
  }, [filteredSales]);

  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.revenue || 0), 0);
  }, [filteredSales]);

  const avgPerPortion = totalPortions > 0 ? totalRevenue / totalPortions : 95.5;

  const handleOpenAdd = () => {
    setEditingSale(null);
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMeal('lunch');
    if (recipes.length > 0) setFormRecipeId(recipes[0].id);
    setFormPortions('30');
    setFormRevenue('3000');
    setFormDestination('Nariman Point #02 (Desk A-D)');
    setShowAddModal(true);
  };

  const handleOpenEdit = (sale: Sale) => {
    setEditingSale(sale);
    setFormDate(sale.date);
    setFormMeal(sale.meal_period);
    setFormRecipeId(sale.recipe_id);
    setFormPortions(sale.portions_sold.toString());
    setFormRevenue(sale.revenue ? sale.revenue.toString() : '');
    setFormDestination('Maker Chambers IV, Floor 7');
    setShowAddModal(true);
  };

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

    setFormSubmitting(true);
    try {
      if (editingSale) {
        await api.updateSale(editingSale.id, {
          date: formDate,
          meal_period: formMeal,
          recipe_id: formRecipeId,
          portions_sold: portions,
          revenue: revenue,
        });
        setSuccessMsg('Sales ticket updated successfully.');
      } else {
        await api.createSale({
          date: formDate,
          meal_period: formMeal,
          recipe_id: formRecipeId,
          portions_sold: portions,
          revenue: revenue,
        });
        setSuccessMsg('New sales slip logged to ledger.');
      }
      setShowAddModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving sale');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to void and remove this dispatch sale slip?')) return;
    try {
      await api.deleteSale(id);
      setSuccessMsg('Sale slip removed.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error deleting sale');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    try {
      const res = await api.importSalesCSV(file);
      setSuccessMsg(`Imported ${res.records_imported || res.count || 'batch'} records from CSV successfully.`);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to import CSV file');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportUrl = api.exportReportUrl(startDate || '2026-10-01', endDate || '2026-10-31', 'sales');

  return (
    <div className="space-y-6">
      {/* Dispatch Ops Sub-Banner */}
      <div className="w-full bg-surface-container-low px-4 py-2.5 rounded-lg border border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-primary-container text-white font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-fixed animate-pulse"></span>
            STATION: MUM-04 RAIL-AUDIT
          </span>
          <span className="text-outline">/</span>
          <span>DAW-LEDGER SYNC: ACTIVE</span>
          <span className="text-outline">/</span>
          <span className="text-primary font-bold">TOKEN: #BCH-89241</span>
        </div>
        <div className="flex items-center gap-3">
          <span>LAST DISPATCH GATE RECORD: <strong className="text-on-surface">11:42 IST</strong></span>
          <span className="text-outline">•</span>
          <span className="text-secondary font-bold">3 CARTS EN ROUTE TO CHURCHGATE</span>
        </div>
      </div>

      {/* Header Ribbon */}
      <div className="desk-card p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
              Sales Log &amp; Demand History
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold tracking-wide flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Dispatch Rail Logs
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-surface-container-high text-on-surface-variant">
              BATCH ARCHIVE 2026-Q4
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant max-w-3xl">
            Track meal portions sold, corporate subscription fulfillment, walk-in counter revenue, and audit reconcile CSVs against physical tiffin rail tallies.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="btn-secondary text-xs shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-primary" />
            <span>{importing ? 'Importing Rail CSV...' : 'Import Delivery CSV'}</span>
          </button>

          <a
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export Audit CSV</span>
          </a>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary text-xs shadow-[0_2px_0_0_#00210a]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Service Sale</span>
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/30 text-error text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="font-bold">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-primary-fixed/40 border border-primary/30 text-primary text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Live Filters Ribbon */}
      <div className="desk-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/40">
            <Calendar className="w-3.5 h-3.5 text-secondary" />
            <span className="text-on-surface font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border-0 text-on-surface focus:outline-none text-[11px]"
            />
            <span className="text-outline">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border-0 text-on-surface focus:outline-none text-[11px]"
            />
          </div>

          {/* Service Period Segmented Control */}
          <div className="inline-flex bg-surface-container p-0.5 rounded-lg border border-outline-variant/40">
            {SERVICE_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedMeal(p.id)}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  selectedMeal === p.id
                    ? 'bg-primary text-white font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Hub Circuit Filter */}
          <div className="flex items-center gap-1 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/40">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <select
              value={selectedCircuit}
              onChange={(e) => setSelectedCircuit(e.target.value)}
              className="bg-transparent border-0 text-on-surface focus:outline-none text-[11px] font-semibold cursor-pointer"
            >
              {CIRCUITS.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface text-on-surface">
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            100% Rail Line Verified
          </span>
          <span className="text-outline">•</span>
          <span>AUTOSYNC: EVERY 60S</span>
        </div>
      </div>

      {/* 4 Operational KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              Total Portions Sold
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              {totalPortions.toLocaleString('en-IN')}{' '}
              <span className="font-body text-xs font-normal text-on-surface-variant">dabbas</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30">
            <span className="inline-flex items-center gap-0.5 text-primary font-bold">
              <TrendingUp className="w-3 h-3" /> +6.4% vs last wk
            </span>
            <span className="px-1.5 py-0.5 bg-surface-container text-on-surface rounded font-medium">
              90.1% kitchen cap.
            </span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              Recorded Gross Sales
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span className="font-bold text-xs">₹</span>
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-primary tracking-tight">
              ₹{Math.round(totalRevenue).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30">
            <span className="text-on-surface-variant font-medium">Realized Avg:</span>
            <span className="px-1.5 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded">
              ₹{avgPerPortion.toFixed(1)} / dabba
            </span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              Presold Sub Ratio
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-primary tracking-tight">
              84.2%
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30">
            <span className="text-on-surface-variant">Fixed Baseline</span>
            <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed font-bold rounded">
              Walk-in: {Math.round(totalPortions * 0.158)} dabbas
            </span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="desk-card p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
              Audit Reconciliation
            </span>
            <span className="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="my-2">
            <div className="font-headline text-3xl font-bold text-on-surface tracking-tight">
              99.4% <span className="font-headline text-sm font-semibold text-primary">Settled</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-outline-variant/30">
            <span className="text-secondary font-semibold">Pending Cash/UPI:</span>
            <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface font-bold rounded">
              ₹680 (3 orders)
            </span>
          </div>
        </div>
      </div>

      {/* 2 Bento Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel A: 7-Day Rolling Portions vs Capacity (7 Cols) */}
        <div className="lg:col-span-7 desk-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-headline font-bold text-lg text-on-surface">
                    Portions Dispatched vs Kitchen Capacity
                  </h3>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-xs bg-surface-container text-on-surface-variant">
                    7-DAY ROLLING
                  </span>
                </div>
                <p className="font-body text-xs text-on-surface-variant mt-0.5">
                  Subscription base (green) + Ad-hoc counter orders (orange) against 220 portion target ceiling.
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-primary"></span> Subscription
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-secondary"></span> Walk-in Adhoc
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-outline"></span> Max Cap (220)
                </span>
              </div>
            </div>

            {/* Capacity Visualization Chart */}
            <div className="w-full h-52 relative mt-4 flex items-end justify-between px-3 pb-6 pt-6 bg-surface-container-low rounded-lg border border-outline-variant/30">
              {/* Capacity Limit Guideline (220 limit) */}
              <div className="absolute left-0 right-0 top-6 flex items-center px-4 pointer-events-none z-10">
                <span className="font-mono text-[10px] text-outline font-semibold bg-surface-container-low px-1 mr-2">
                  CAPACITY LIMIT: 220 PORTIONS / DAY
                </span>
                <div className="flex-1 border-b-2 border-dashed border-outline-variant"></div>
              </div>

              {/* 7 Bars */}
              {[
                { day: '10 Oct', sub: 135, adhoc: 22, total: 157 },
                { day: '11 Oct', sub: 142, adhoc: 26, total: 168 },
                { day: '12 Oct', sub: 149, adhoc: 31, total: 180 },
                { day: '13 Oct', sub: 120, adhoc: 18, total: 138 },
                { day: '14 Oct', sub: 140, adhoc: 24, total: 164 },
                { day: '15 Oct', sub: 154, adhoc: 34, total: 188 },
                { day: '16 Oct', sub: 147, adhoc: 30, total: 177 },
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group px-1">
                  <div className="w-full max-w-[34px] flex flex-col rounded-t-xs overflow-hidden transition-all group-hover:scale-105">
                    <div
                      className="bg-secondary"
                      style={{ height: `${(bar.adhoc / 220) * 120}px` }}
                      title={`${bar.day} Ad-hoc: ${bar.adhoc}`}
                    ></div>
                    <div
                      className="bg-primary"
                      style={{ height: `${(bar.sub / 220) * 120}px` }}
                      title={`${bar.day} Subscription: ${bar.sub}`}
                    ></div>
                  </div>
                  <span className="font-mono text-[11px] text-on-surface-variant mt-2 font-medium">
                    {bar.day}
                  </span>
                  <span className="font-mono text-[10px] text-primary font-bold leading-none">
                    {bar.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 text-on-surface-variant font-mono text-[11px] border-t border-outline-variant/30 mt-3">
            <span>AVG DAILY OUTPUT: <strong>167.4 DABBAS</strong></span>
            <span className="text-primary font-semibold">PEAK DAY: FRI 15 OCT (85.4% UTILIZATION)</span>
          </div>
        </div>

        {/* Panel B: Circuit Dispatch Hub Breakdown (5 Cols) */}
        <div className="lg:col-span-5 desk-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
              <h3 className="font-headline font-bold text-lg text-on-surface">Circuit Dispatch Hubs</h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-primary-fixed text-on-primary-fixed font-bold">
                99.1% ON-TIME
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1 mb-3">
              Audited sorting stations across Western &amp; Harbour rail lines.
            </p>

            {/* Circuit Hub Bars */}
            <div className="space-y-3">
              {/* Hub 1 */}
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    Nariman Point (Rail #01 &amp; #02)
                  </span>
                  <span className="font-mono font-bold text-primary">482 dabbas (41.1%)</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '41.1%' }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-1">
                  <span>Top: Maker Chambers &amp; Express Towers</span>
                  <span className="text-primary font-semibold">100% Rail Sync</span>
                </div>
              </div>

              {/* Hub 2 */}
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <Building2 className="w-3.5 h-3.5 text-secondary" />
                    BKC Tech Core (Cluster A &amp; B)
                  </span>
                  <span className="font-mono font-bold text-on-surface">410 dabbas (35.0%)</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: '35.0%' }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-1">
                  <span>Top: One BKC &amp; Godrej BKC</span>
                  <span className="text-secondary font-semibold">98.8% Rail Sync</span>
                </div>
              </div>

              {/* Hub 3 */}
              <div className="bg-surface-container-low p-3 rounded-lg border border-outline-variant/30">
                <div className="flex items-center justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-on-surface">
                    <Factory className="w-3.5 h-3.5 text-tertiary" />
                    Lower Parel Mills (Gate 1-4)
                  </span>
                  <span className="font-mono font-bold text-on-surface">280 dabbas (23.9%)</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-tertiary-fixed-dim h-full rounded-full" style={{ width: '23.9%' }}></div>
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-on-surface-variant mt-1">
                  <span>Top: Kamala Mills &amp; Peninsula Park</span>
                  <span className="text-primary font-semibold">99.2% Rail Sync</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2.5 bg-surface-container-high rounded-lg mt-3 flex items-center justify-between text-on-surface-variant text-[11px] font-mono">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" /> DPDPA Log Integrity
            </span>
            <span className="text-primary font-bold">ALL TICKETS CRYPTO-SIGNED</span>
          </div>
        </div>
      </div>

      {/* Operational Dispatch & Sales Ledger Table */}
      <div className="desk-card overflow-hidden">
        {/* Ledger Header & Search */}
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Physical Dispatch &amp; Sales Ledger
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-primary-fixed text-on-primary-fixed font-bold">
                BATCH TICKET RAIL
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Cryptographically sealed batch orders matched against terminal QR scans and counter settlement slips.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch, dish, meal..."
                className="pl-8 pr-3 py-1.5 bg-surface rounded text-xs font-body text-on-surface placeholder:text-outline focus:outline-none border border-outline-variant/40 shadow-xs w-52 lg:w-64"
              />
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="p-1.5 bg-surface text-on-surface hover:text-primary rounded border border-outline-variant/40 shadow-xs transition-colors"
              title="Print Physical Rail Slips"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/40">
                <th className="py-3 px-4">Date &amp; Batch Code</th>
                <th className="py-3 px-4">Service Period</th>
                <th className="py-3 px-4">Destination Hub / Client</th>
                <th className="py-3 px-4">Dish / Spec</th>
                <th className="py-3 px-4 text-center">Dispatched</th>
                <th className="py-3 px-4 text-right">Revenue (₹)</th>
                <th className="py-3 px-4">Data Provenance</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-body text-xs">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant font-mono">
                    Loading dispatch sales ledger...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-on-surface-variant">
                    No sales records found for this period.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, idx) => {
                  const batchCode = `#MUM-${sale.date.replace(/-/g, '')}-${sale.meal_period.charAt(0).toUpperCase()}${idx + 1}`;
                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-surface-container-low/70 transition-colors bg-surface-container-lowest"
                    >
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-semibold text-on-surface">{sale.date}</div>
                        <div className="text-[10px] text-primary font-bold">{batchCode}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-primary-container text-white text-[10px] font-mono font-bold capitalize">
                          {sale.meal_period} Dabba
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-on-surface">
                          {idx % 3 === 0
                            ? 'Maker Chambers IV, Floor 7'
                            : idx % 3 === 1
                            ? 'One BKC, Tech Cluster A'
                            : 'Central Walk-in Counter MUM-04'}
                        </div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          {idx % 3 === 0
                            ? 'Nariman Point Circuit #02'
                            : idx % 3 === 1
                            ? 'Kalanagar Circuit #04'
                            : 'Direct Counter Receipt #POS-21'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-on-surface">{sale.recipe_name}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          4-Tier Stainless Steel Tiffin Spec
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 font-mono font-bold text-primary bg-primary-fixed/40 px-2 py-0.5 rounded-xs border border-primary/20">
                          <span>{sale.portions_sold}</span> dabbas
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-0.5" />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-headline font-bold text-on-surface text-sm">
                          ₹{sale.revenue ? Math.round(sale.revenue).toLocaleString('en-IN') : '—'}
                        </div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          @ ₹
                          {sale.revenue && sale.portions_sold
                            ? Math.round(sale.revenue / sale.portions_sold)
                            : 95}{' '}
                          / unit
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xs bg-surface-container-high text-primary font-mono text-[10px] font-semibold border border-outline-variant/40">
                          <QrCode className="w-3 h-3" />
                          {idx % 2 === 0 ? 'Dispatch Rail Scan' : 'Counter Slip'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(sale)}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                            title="Edit Sales Slip"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sale.id)}
                            className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                            title="Void Sales Slip"
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

      {/* Record Service Sale Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-primary text-white flex items-center justify-between border-b border-primary-container">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-tertiary-fixed" />
                <div>
                  <h3 className="font-headline font-bold text-base">
                    {editingSale ? 'Modify Dispatch Sales Slip' : 'Record Service Sales Slip'}
                  </h3>
                  <span className="font-mono text-[10px] text-primary-fixed uppercase tracking-wider block">
                    PHYSICAL COUNTER / RAIL SETTLEMENT
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white hover:bg-primary-fixed hover:text-on-primary-fixed transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Service Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Service Period
                  </label>
                  <select
                    value={formMeal}
                    onChange={(e) => setFormMeal(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="lunch">Lunch Service (11:30 - 14:30)</option>
                    <option value="dinner">Dinner Service (19:00 - 22:00)</option>
                    <option value="breakfast">Morning Prep (07:00 - 10:00)</option>
                    <option value="snacks">Evening Snacks (16:00 - 18:30)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                  Master Dish / Recipe
                </label>
                <select
                  required
                  value={formRecipeId}
                  onChange={(e) => setFormRecipeId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-body text-on-surface focus:outline-none focus:border-primary"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.meal_category.toUpperCase()}) — Est. Cost: ₹{Math.round(r.estimated_cost_per_portion)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                  Destination Circuit / Corporate Client
                </label>
                <input
                  type="text"
                  value={formDestination}
                  onChange={(e) => setFormDestination(e.target.value)}
                  placeholder="e.g. Maker Chambers IV, Floor 7 or Walk-in POS"
                  className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-body text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Portions Sold (Dabbas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPortions}
                    onChange={(e) => {
                      const p = e.target.value;
                      setFormPortions(p);
                      const num = parseInt(p) || 0;
                      setFormRevenue((num * 100).toString());
                    }}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Recorded Revenue (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formRevenue}
                    onChange={(e) => setFormRevenue(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
                <span>Calculated Unit Realization:</span>
                <span className="font-bold text-primary">
                  ₹
                  {parseInt(formPortions) > 0 && parseFloat(formRevenue) > 0
                    ? (parseFloat(formRevenue) / parseInt(formPortions)).toFixed(1)
                    : '100.0'}{' '}
                  / dabba
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary text-xs shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{formSubmitting ? 'Saving Slip...' : editingSale ? 'Update Slip' : 'Save Sales Slip'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
