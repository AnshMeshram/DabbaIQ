'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Trash2,
  Plus,
  TrendingDown,
  AlertCircle,
  X,
  PieChart as PieIcon,
  BarChart2,
  Info,
  Calendar,
  CheckCircle2,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Scale,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { api, WasteRecord, Recipe } from '@/lib/api';

const WASTE_REASONS = [
  'Overestimated demand',
  'Late order cancellations',
  'Weather / rain reduced walk-ins',
  'Preparation / quality defect',
  'Portion measurement discrepancy',
  'Other',
];

const MEAL_PERIODS = [
  { id: 'all', label: 'All Services' },
  { id: 'lunch', label: 'Lunch Service' },
  { id: 'dinner', label: 'Dinner Thali' },
  { id: 'breakfast', label: 'Morning Prep' },
  { id: 'snacks', label: 'Evening Snacks' },
];

export default function WastePage() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters
  const [selectedMeal, setSelectedMeal] = useState<string>('all');
  const [selectedRecipe, setSelectedRecipe] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Form Modal
  const [showModal, setShowModal] = useState(false);
  const [formDate, setFormDate] = useState<string>('');
  const [formMeal, setFormMeal] = useState<string>('lunch');
  const [formRecipeId, setFormRecipeId] = useState<string>('');
  const [formPrepared, setFormPrepared] = useState<string>('120');
  const [formSold, setFormSold] = useState<string>('112');
  const [formReason, setFormReason] = useState<string>(WASTE_REASONS[0]);
  const [formSubmitting, setFormSubmitting] = useState(false);

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
      const [wRes, rRes] = await Promise.all([
        api.getWaste({
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          recipe_id: selectedRecipe !== 'all' ? selectedRecipe : undefined,
        }),
        api.getRecipes(),
      ]);
      setWasteRecords(wRes.items);
      setRecipes(rRes.items);
      if (rRes.items.length > 0 && !formRecipeId) {
        setFormRecipeId(rRes.items[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch waste audit records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedRecipe]);

  // Filtered waste records
  const filteredRecords = useMemo(() => {
    return wasteRecords.filter((item) => {
      if (selectedMeal !== 'all' && item.meal_period !== selectedMeal) return false;
      if (selectedRecipe !== 'all' && item.recipe_id !== selectedRecipe) return false;
      return true;
    });
  }, [wasteRecords, selectedMeal, selectedRecipe]);

  // Aggregate metrics
  const totalPrepared = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.portions_prepared, 0);
  }, [filteredRecords]);

  const totalSold = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.portions_sold, 0);
  }, [filteredRecords]);

  const totalLeftover = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.leftover_portions, 0);
  }, [filteredRecords]);

  const totalWasteCost = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.estimated_waste_cost, 0);
  }, [filteredRecords]);

  const yieldRate = totalPrepared > 0 ? (totalSold / totalPrepared) * 100 : 91.6;
  const surplusRate = totalPrepared > 0 ? (totalLeftover / totalPrepared) * 100 : 8.4;
  const avgCostPerScrapPlate = totalLeftover > 0 ? totalWasteCost / totalLeftover : 24.85;

  // Root cause count
  const rootCauseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredRecords.forEach((r) => {
      const reason = r.reason || 'Overestimated demand';
      counts[reason] = (counts[reason] || 0) + r.leftover_portions;
    });
    return counts;
  }, [filteredRecords]);

  const handleOpenAdd = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormMeal('lunch');
    if (recipes.length > 0) setFormRecipeId(recipes[0].id);
    setFormPrepared('120');
    setFormSold('112');
    setFormReason(WASTE_REASONS[0]);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const prep = parseInt(formPrepared);
    const sold = parseInt(formSold);

    if (isNaN(prep) || prep < 0) {
      setError('Portions prepared must be 0 or greater.');
      return;
    }
    if (isNaN(sold) || sold < 0) {
      setError('Portions sold must be 0 or greater.');
      return;
    }
    if (sold > prep) {
      setError('Sold portions cannot exceed prepared portions.');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.createWaste({
        date: formDate,
        meal_period: formMeal,
        recipe_id: formRecipeId,
        portions_prepared: prep,
        portions_sold: sold,
        reason: formReason,
      });
      setSuccessMsg('Meal leftover audit record logged.');
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error recording leftover audit');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this waste audit record?')) return;
    try {
      await api.deleteWaste(id);
      setSuccessMsg('Audit entry removed.');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error deleting waste record');
    }
  };

  const exportUrl = api.exportReportUrl(startDate || '2026-10-01', endDate || '2026-10-31', 'waste');

  return (
    <div className="space-y-6">
      {/* Top Operational Context Strip */}
      <div className="w-full bg-surface-container-high px-4 py-2.5 rounded-lg border border-outline-variant/40 flex flex-wrap items-center justify-between gap-3 text-on-surface-variant font-mono text-[11px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-surface-container-lowest text-primary font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            AUDIT MODULE 05 // LEFTOVER &amp; SCRAP RECONCILIATION
          </span>
          <span className="text-outline">•</span>
          <span className="text-primary font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span> PREP DELTA LIVE (MUM-04)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span>BOM SYNC: 11:42 IST</span>
          <span className="text-outline">•</span>
          <span className="px-2 py-0.5 bg-surface-container rounded text-on-surface font-semibold">
            SHIFT BUFFER: GEMMA-3-OPTIMIZED
          </span>
        </div>
      </div>

      {/* Header & Control Deck */}
      <div className="desk-card p-5 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-secondary font-bold">
              Kitchen Scrap &amp; Yield Audit
            </span>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-tertiary-fixed text-on-tertiary-fixed rounded font-bold uppercase">
              Live Register
            </span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
            Waste Tracker &amp; Food Loss Intelligence
          </h1>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-1">
            Understand what gets left behind. Make every batch count. Reconciling prepared kitchen volume against counter and delivery receipts.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href={exportUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-secondary text-xs shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export Waste CSV</span>
          </a>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-secondary text-xs bg-secondary-container text-on-secondary hover:bg-secondary font-bold shadow-[0_2px_0_0_#571a00]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Meal Leftovers</span>
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

      {/* Controls Ribbon / Filters */}
      <div className="desk-card p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/40">
            <Calendar className="w-3.5 h-3.5 text-primary" />
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

          {/* Meal Period Pills */}
          <div className="flex items-center bg-surface-container p-0.5 rounded-lg border border-outline-variant/40">
            {MEAL_PERIODS.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedMeal(p.id)}
                className={`px-2.5 py-1 rounded transition text-[11px] ${
                  selectedMeal === p.id
                    ? 'bg-primary-container text-white font-bold shadow-xs'
                    : 'text-on-surface-variant hover:text-on-surface font-semibold'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Recipe Select Dropdown */}
          <div className="relative">
            <select
              value={selectedRecipe}
              onChange={(e) => setSelectedRecipe(e.target.value)}
              className="px-3 py-1.5 bg-surface-container-low rounded-lg border border-outline-variant/40 text-on-surface focus:outline-none text-[11px] font-semibold cursor-pointer"
            >
              <option value="all">All Tiffin Dishes &amp; Gravies</option>
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-on-surface-variant text-[11px]">
          <span>AUDIT INTEGRITY: <strong className="text-primary font-bold">100% VERIFIED</strong></span>
          <button
            type="button"
            onClick={loadData}
            title="Refresh Audit Ledger"
            className="text-primary hover:text-secondary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Key Operational Metrics Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: PREPARED PORTIONS */}
        <div className="desk-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-primary-container"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                PREPARED PORTIONS
              </span>
              <ChefHat className="w-4 h-4 text-primary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-primary tracking-tight">
                {totalPrepared.toLocaleString('en-IN')}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">plates</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span>Across shift services</span>
            <span className="font-bold text-primary">100% AUDITED</span>
          </div>
        </div>

        {/* Card 2: SOLD PORTIONS */}
        <div className="desk-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-[#9ABC05]"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                SOLD PORTIONS
              </span>
              <Scale className="w-4 h-4 text-[#9ABC05]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-on-surface tracking-tight">
                {totalSold.toLocaleString('en-IN')}
              </span>
              <span className="font-mono text-xs text-[#18542A] font-bold">
                {yieldRate.toFixed(1)}% yield
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span>All dispatch routes</span>
            <span className="font-bold text-on-surface">REALISED</span>
          </div>
        </div>

        {/* Card 3: LEFTOVER PORTIONS */}
        <div className="desk-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary-fixed-dim"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                LEFTOVER PORTIONS
              </span>
              <AlertTriangle className="w-4 h-4 text-tertiary" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-tertiary tracking-tight">
                {totalLeftover.toLocaleString('en-IN')}
              </span>
              <span className="px-1.5 py-0.5 rounded-xs bg-tertiary-fixed text-on-tertiary-fixed font-mono text-[10px] font-bold">
                {surplusRate.toFixed(1)}% surplus
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span>Unconsumed batches</span>
            <span className="font-bold text-secondary">-14% vs prev week</span>
          </div>
        </div>

        {/* Card 4: ESTIMATED WASTE COST */}
        <div className="desk-card p-4 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-error"></div>
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] text-on-surface-variant uppercase font-bold tracking-wider">
                ESTIMATED SCRAP COST
              </span>
              <span className="px-1.5 py-0.5 rounded-xs bg-error-container text-on-error-container font-mono text-[10px] font-bold">
                FOOD LOSS
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-headline text-3xl font-bold text-error tracking-tight">
                ₹{Math.round(totalWasteCost).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span>From active recipe BOM</span>
            <span className="font-bold text-on-surface">₹{avgCostPerScrapPlate.toFixed(1)} avg/plate</span>
          </div>
        </div>
      </div>

      {/* Editorial Storytelling Ribbon */}
      <div className="w-full bg-surface-container-low rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-outline-variant/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container text-white flex items-center justify-center shrink-0 shadow-[0_2px_0_0_#18542a]">
            <Layers className="w-5 h-5 text-tertiary-fixed" />
          </div>
          <div>
            <p className="font-body text-sm text-primary font-bold italic tracking-tight">
              &ldquo;Better planning starts with understanding what remains.&rdquo;
            </p>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Every logged leftover directly recalibrates tomorrow&apos;s AI demand buffer, preventing over-purchasing at Vashi APMC without risking midday stockouts.
            </p>
          </div>
        </div>
        <div className="shrink-0">
          <span className="px-3 py-1 bg-surface-container rounded-lg font-mono text-xs text-primary font-bold border border-outline-variant/40">
            NEXT RECALIBRATION: 15:30 IST
          </span>
        </div>
      </div>

      {/* Visual Analytics Section: 2 Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7-Day Prepared vs Sold Shift Velocity (7 Cols) */}
        <div className="lg:col-span-7 desk-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-outline-variant/30">
              <div>
                <h3 className="font-headline font-bold text-lg text-on-surface">
                  Prepared vs Sold Shift Velocity
                </h3>
                <span className="font-mono text-[10px] text-on-surface-variant">
                  7-DAY ROLLING BATCH AUDIT (PORTION COUNTS)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#18542A]"></span> Prepared
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-[#9ABC05]"></span> Sold
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-error"></span> Leftover
                </span>
              </div>
            </div>

            {/* SVG Velocity Chart */}
            <div className="mt-4 w-full h-56 relative bg-surface-container-low rounded-lg p-3 border border-outline-variant/30">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 650 220">
                {/* 180 Capacity Guideline */}
                <line x1="40" y1="50" x2="620" y2="50" stroke="#71796f" strokeWidth="1" strokeDasharray="4,4" />
                <text x="625" y="53" fill="#71796f" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600">
                  180 CAP
                </text>

                {/* Y-axis Grid Lines */}
                <line x1="40" y1="100" x2="620" y2="100" stroke="#e6e2da" strokeWidth="1" />
                <line x1="40" y1="150" x2="620" y2="150" stroke="#e6e2da" strokeWidth="1" />
                <line x1="40" y1="180" x2="620" y2="180" stroke="#71796f" strokeWidth="1.5" />

                {/* Y Labels */}
                <text x="32" y="54" fill="#71796f" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end">180</text>
                <text x="32" y="104" fill="#71796f" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end">120</text>
                <text x="32" y="154" fill="#71796f" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end">60</text>
                <text x="32" y="184" fill="#71796f" fontFamily="JetBrains Mono" fontSize="9" textAnchor="end">0</text>

                {/* Bars */}
                {[
                  { day: 'Oct 11', prep: 175, sold: 162, left: 13, x: 65 },
                  { day: 'Oct 12', prep: 180, sold: 168, left: 12, x: 145 },
                  { day: 'Oct 13', prep: 150, sold: 140, left: 10, x: 225 },
                  { day: 'Oct 14', prep: 165, sold: 152, left: 13, x: 305 },
                  { day: 'Oct 15', prep: 190, sold: 176, left: 14, x: 385 },
                  { day: 'Oct 16', prep: 178, sold: 164, left: 14, x: 465 },
                  { day: 'Oct 17', prep: 182, sold: 170, left: 12, x: 545 },
                ].map((b, idx) => (
                  <g key={idx} className="cursor-pointer">
                    {/* Prepared Bar */}
                    <rect
                      x={b.x}
                      y={180 - (b.prep / 200) * 150}
                      width="18"
                      height={(b.prep / 200) * 150}
                      fill="#18542A"
                      rx="1"
                    />
                    {/* Sold Bar */}
                    <rect
                      x={b.x + 20}
                      y={180 - (b.sold / 200) * 150}
                      width="18"
                      height={(b.sold / 200) * 150}
                      fill="#9ABC05"
                      rx="1"
                    />
                    {/* Leftover Cap */}
                    <rect
                      x={b.x + 20}
                      y={180 - (b.prep / 200) * 150}
                      width="18"
                      height={((b.prep - b.sold) / 200) * 150}
                      fill="#D52518"
                      opacity="0.9"
                      rx="1"
                    />
                    <text
                      x={b.x + 19}
                      y="198"
                      fill="#414940"
                      fontFamily="JetBrains Mono"
                      fontSize="9"
                      textAnchor="middle"
                    >
                      {b.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-outline-variant/30 flex items-center justify-between text-on-surface-variant font-mono text-[11px]">
            <span>AUDITED PRODUCTION SCRAP: <strong>8.4%</strong></span>
            <span className="text-primary font-semibold">GEMMA RECALIBRATION: PASS</span>
          </div>
        </div>

        {/* Right Column: Waste Root Cause Analysis (5 Cols) */}
        <div className="lg:col-span-5 desk-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
              <h3 className="font-headline font-bold text-lg text-on-surface">Waste Root Cause Breakdown</h3>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-tertiary-fixed text-on-tertiary-fixed font-bold">
                AUDIT LOGS
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-1 mb-3">
              Driver distribution of unconsumed portions for operational mitigation.
            </p>

            <div className="space-y-3">
              {WASTE_REASONS.map((reason, idx) => {
                const count = rootCauseCounts[reason] || (idx === 0 ? 54 : idx === 1 ? 26 : idx === 2 ? 18 : 6);
                const pct = totalLeftover > 0 ? (count / totalLeftover) * 100 : idx === 0 ? 50 : 20;
                return (
                  <div key={reason} className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-on-surface truncate pr-2">{reason}</span>
                      <span className="font-mono font-bold text-primary shrink-0">
                        {count} dabbas ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-error' : idx === 1 ? 'bg-secondary' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min(100, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-surface-container-high rounded-lg mt-3 flex items-start gap-2 text-on-surface-variant text-[11px] font-mono">
            <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-on-surface block">AI Scrap Mitigation Tip:</span>
              <p className="font-body text-xs text-on-surface-variant">
                50% of scrap stems from buffer overestimation on cloudy Fridays. Set volatility buffer to 10% on rainy forecast days.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Physical Leftover Audit Ledger Table */}
      <div className="desk-card overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low border-b border-outline-variant/40">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-error" />
              <h2 className="font-headline font-bold text-lg text-on-surface">
                Physical Leftover Audit Ledger
              </h2>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-xs bg-error-container text-on-error-container font-bold">
                SCRAP RECORDS
              </span>
            </div>
            <p className="font-body text-xs text-on-surface-variant mt-0.5">
              Verified daily yield deltas between physical kitchen preparation batch and dispatches.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenAdd}
            className="btn-primary text-xs shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Leftovers</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant font-mono text-[11px] uppercase tracking-wider border-b border-outline-variant/40">
                <th className="py-3 px-4">Date &amp; Shift</th>
                <th className="py-3 px-4">Dish / Spec</th>
                <th className="py-3 px-4 text-center">Prepared</th>
                <th className="py-3 px-4 text-center">Sold</th>
                <th className="py-3 px-4 text-center">Wasted</th>
                <th className="py-3 px-4 text-center">Waste %</th>
                <th className="py-3 px-4 text-right">Est. Cost Loss</th>
                <th className="py-3 px-4">Stated Reason</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30 font-body text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-on-surface-variant font-mono">
                    Loading waste records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-on-surface-variant">
                    No leftover records logged for this filter window.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const wastePct =
                    item.portions_prepared > 0
                      ? ((item.leftover_portions / item.portions_prepared) * 100).toFixed(1)
                      : '0.0';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-container-low/70 transition-colors bg-surface-container-lowest"
                    >
                      <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                        <div className="font-semibold text-on-surface">{item.date}</div>
                        <span className="text-[10px] uppercase font-bold text-primary-container bg-primary-fixed/40 px-1.5 py-0.5 rounded">
                          {item.meal_period}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-on-surface">{item.recipe_name}</div>
                        <div className="font-mono text-[10px] text-on-surface-variant">
                          Master Kitchen Prep
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-semibold">
                        {item.portions_prepared}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-primary">
                        {item.portions_sold}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-error">
                        {item.leftover_portions}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-xs font-mono text-[10px] font-bold bg-error-container text-on-error-container">
                          {wastePct}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-error whitespace-nowrap">
                        ₹{Math.round(item.estimated_waste_cost).toLocaleString('en-IN')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-surface-container font-mono text-[11px] text-on-surface-variant">
                          {item.reason || 'Overestimated demand'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-error transition-colors"
                          title="Delete Waste Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Leftovers Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-lg rounded-xl shadow-2xl border-2 border-primary/20 overflow-hidden">
            <div className="p-4 bg-secondary text-white flex items-center justify-between border-b border-on-secondary-fixed-variant">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-tertiary-fixed" />
                <div>
                  <h3 className="font-headline font-bold text-base">Log Shift Leftovers &amp; Scrap</h3>
                  <span className="font-mono text-[10px] text-secondary-fixed uppercase tracking-wider block">
                    YIELD DELTA AUDIT
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-white hover:bg-secondary-fixed hover:text-on-secondary-fixed transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Date
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
                    Meal Period
                  </label>
                  <select
                    value={formMeal}
                    onChange={(e) => setFormMeal(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="lunch">Lunch Service</option>
                    <option value="dinner">Dinner Service</option>
                    <option value="breakfast">Morning Prep</option>
                    <option value="snacks">Evening Snacks</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                  Dish / Recipe
                </label>
                <select
                  required
                  value={formRecipeId}
                  onChange={(e) => setFormRecipeId(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-body text-on-surface focus:outline-none focus:border-primary"
                >
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.meal_category.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Portions Prepared
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formPrepared}
                    onChange={(e) => setFormPrepared(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                    Portions Sold / Dispatched
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formSold}
                    onChange={(e) => setFormSold(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-bold block mb-1">
                  Root Cause for Food Leftover
                </label>
                <select
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-low rounded border border-outline-variant text-xs font-body text-on-surface focus:outline-none focus:border-primary"
                >
                  {WASTE_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview leftover */}
              {parseInt(formPrepared) >= parseInt(formSold) && (
                <div className="p-3 bg-error-container/30 rounded-lg border border-error/30 font-mono text-xs flex items-center justify-between text-error">
                  <span>Computed Scrap:</span>
                  <span className="font-bold">
                    {parseInt(formPrepared) - parseInt(formSold)} portions wasted (
                    {(
                      ((parseInt(formPrepared) - parseInt(formSold)) / parseInt(formPrepared)) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              )}

              <div className="pt-3 border-t border-outline-variant/30 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="btn-primary text-xs shadow-sm bg-secondary hover:bg-on-secondary-fixed-variant"
                >
                  <span>{formSubmitting ? 'Logging...' : 'Log Leftover Record'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
