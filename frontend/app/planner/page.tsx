'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  ChefHat,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Clock,
  Printer,
  RefreshCw,
  Mic,
  Store,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api, Recipe, PrepPlan } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import TemporalWorkflowAction from '@/components/TemporalWorkflowAction';
import SupplierSearchModal from '@/components/SupplierSearchModal';

const MEAL_PERIODS = [
  { id: 'lunch', label: 'Lunch Service', time: '11:30 – 14:30' },
  { id: 'dinner', label: 'Dinner Service', time: '19:00 – 22:00' },
  { id: 'breakfast', label: 'Morning Prep', time: '07:00 – 10:00' },
  { id: 'snacks', label: 'Evening Snacks', time: '16:00 – 18:30' },
];

export default function PlannerPage() {
  const { openSupplierSearch } = useUIStore();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<string[]>([]);
  const [targetDate, setTargetDate] = useState<string>('');
  const [mealPeriod, setMealPeriod] = useState<string>('lunch');
  const [safetyBuffer, setSafetyBuffer] = useState<number>(0.15); // 15%
  const [confirmedOrders, setConfirmedOrders] = useState<Record<string, number>>({});
  const [kitchenNotes, setKitchenNotes] = useState<string>('');
  const [transcribingVoice, setTranscribingVoice] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PrepPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedSuccess, setConfirmedSuccess] = useState(false);

  // Load recipes on mount
  useEffect(() => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    setTargetDate(tomorrow);
    api.getRecipes()
      .then((res) => {
        setRecipes(res.items);
        setSelectedRecipes(res.items.map((r) => r.id));
      })
      .catch((err) => setError('Failed to load recipe library: ' + err.message));
  }, []);

  const toggleRecipe = (id: string) => {
    if (selectedRecipes.includes(id)) {
      setSelectedRecipes(selectedRecipes.filter((r) => r !== id));
    } else {
      setSelectedRecipes([...selectedRecipes, id]);
    }
  };

  const handleOrderChange = (recipeId: string, val: string) => {
    const num = parseInt(val) || 0;
    setConfirmedOrders((prev) => ({ ...prev, [recipeId]: Math.max(0, num) }));
  };

  const handleGeneratePlan = async () => {
    if (selectedRecipes.length === 0) {
      setError('Please select at least one recipe to include in the plan.');
      return;
    }
    setLoading(true);
    setError(null);
    setConfirmedSuccess(false);

    try {
      const generated = await api.generatePlan({
        target_date: targetDate,
        meal_period: mealPeriod,
        recipe_ids: selectedRecipes,
        confirmed_orders: confirmedOrders,
        safety_buffer: safetyBuffer,
        kitchen_notes: kitchenNotes.trim() || undefined,
      });
      setPlan(generated);
    } catch (err: any) {
      setError(err.message || 'Error generating preparation plan');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPlan = async () => {
    if (!plan) return;
    setConfirming(true);
    try {
      const res = await api.confirmPlan(plan.id);
      setPlan(res);
      setConfirmedSuccess(true);
    } catch (err: any) {
      setError('Failed to confirm plan: ' + err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
              AI Preparation Planner
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
              GEMMA 2 + ENGINE
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Grounded demand forecasts, ingredient shortage calculations, and AI menu synthesis
          </p>
        </div>

        {plan && (
          <button
            onClick={() => window.print()}
            className="btn-surface text-xs self-start sm:self-auto font-mono"
          >
            <Printer className="w-3.5 h-3.5 text-on-surface-variant" />
            Print Station Prep Slips
          </button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/30 text-error text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-error mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* STEP 1: Plan Parameters & Dabba Tier Configuration Desk */}
      <div className="desk-card p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary-container text-white flex items-center justify-center font-bold text-xs">
              01
            </span>
            <h2 className="font-headline font-bold text-base text-primary">
              Shift Parameters &amp; Advance Orders
            </h2>
          </div>
          <span className="font-mono text-[11px] text-on-surface-variant">
            Station: MUM-04 Central Rail
          </span>
        </div>

        {/* Meal Period Tabs */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Select Active Shift
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {MEAL_PERIODS.map((period) => {
              const isActive = mealPeriod === period.id;
              return (
                <button
                  type="button"
                  key={period.id}
                  onClick={() => setMealPeriod(period.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'bg-primary-container text-white border-primary shadow-[0_2px_0_0_#00210a]'
                      : 'bg-surface-container-low border-outline-variant/60 text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <div className="font-headline font-bold text-xs">{period.label}</div>
                  <div className={`font-mono text-[10px] mt-0.5 ${isActive ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                    {period.time}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Date & Safety Buffer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Production Date */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Target Prep Date
            </label>
            <div className="flex items-center gap-2 border border-outline-variant rounded-lg px-3 py-2 bg-surface-container-lowest shadow-xs text-xs font-mono">
              <Calendar className="w-4 h-4 text-primary shrink-0" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full font-medium text-on-surface outline-none bg-transparent cursor-pointer"
              />
            </div>
          </div>

          {/* Volatility Safety Buffer Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Safety Buffer: {Math.round(safetyBuffer * 100)}%
              </label>
              <span className="font-mono text-[10px] text-primary font-semibold">
                +{Math.round(safetyBuffer * 100)}% extra portions
              </span>
            </div>
            <div className="flex items-center gap-3 pt-1.5">
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.05"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(parseFloat(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="font-mono text-xs font-bold text-primary w-12 text-right">
                +{Math.round(safetyBuffer * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recipe Selection Matrix styled as Tiffin Assembly Tiers */}
        <div>
          <label className="block font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
            Select Dishes &amp; Log Confirmed Advance Orders
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipes.map((recipe) => {
              const isSelected = selectedRecipes.includes(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-primary bg-primary-fixed/20 shadow-[0_2px_0_0_#18542a]'
                      : 'border-outline-variant/60 bg-surface-container-low opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipe(recipe.id)}
                        className="rounded text-primary focus:ring-primary w-4 h-4"
                      />
                      <span className="font-headline font-bold text-xs text-on-surface">
                        {recipe.name}
                      </span>
                    </label>
                    <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">
                      {recipe.meal_category}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs font-mono">
                      <span className="text-on-surface-variant text-[11px]">Advance Orders:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={confirmedOrders[recipe.id] || ''}
                        onChange={(e) => handleOrderChange(recipe.id, e.target.value)}
                        className="w-16 border border-outline-variant rounded px-2 py-0.5 text-right font-bold text-xs bg-white text-primary outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Free-text Kitchen Notes & Voice STT */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="font-mono text-xs font-bold uppercase tracking-wider text-on-surface-variant">
              Kitchen Notes &amp; Special Constraints (Optional)
            </label>

            {/* Voice upload button */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer font-mono text-xs font-bold text-secondary hover:text-[#802a00] flex items-center gap-1">
                <Mic className="w-3.5 h-3.5" />
                <span>{transcribingVoice ? 'Transcribing Audio...' : 'Voice Note (ElevenLabs STT)'}</span>
                <input
                  type="file"
                  accept="audio/*"
                  disabled={transcribingVoice}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setTranscribingVoice(true);
                    setVoiceNotice(null);
                    try {
                      const res = await api.transcribeVoiceNote(file);
                      if (res.transcript) {
                        setKitchenNotes((prev) =>
                          prev ? `${prev}\n${res.transcript}` : res.transcript
                        );
                        setVoiceNotice(
                          `Voice note transcribed (${res.language}): "${res.transcript}"`
                        );
                      }
                    } catch (err: any) {
                      setVoiceNotice(`Voice Note Notice: ${err.message}`);
                    } finally {
                      setTranscribingVoice(false);
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {voiceNotice && (
            <div className="mb-2 p-2 bg-tertiary-fixed/30 border border-tertiary-fixed rounded text-xs font-mono text-on-tertiary-fixed flex items-center justify-between">
              <span>{voiceNotice}</span>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="text-on-surface-variant hover:text-on-surface font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            rows={2}
            value={kitchenNotes}
            onChange={(e) => setKitchenNotes(e.target.value)}
            placeholder="e.g. 'Sharma office requested 8 extra dal; rainy day expected tomorrow so walk-ins may drop 10%; use up perishable tomatoes first'"
            className="w-full text-xs font-body border border-outline-variant rounded-lg p-2.5 bg-surface-container-lowest outline-none focus:border-primary"
          />
          <p className="font-mono text-[11px] text-on-surface-variant mt-1">
            Gemma open-weight model interprets these constraints without overriding deterministic stock math. Voice notes processed via ElevenLabs STT.
          </p>
        </div>

        {/* Generate Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="btn-primary text-xs px-6 py-2.5 shadow-[0_2px_0_0_#00210a]"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Computing Forecast &amp; Consulting Gemma...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-tertiary-fixed" />
                <span>Generate Plan &amp; Shopping List</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Temporal Distributed Workflow Orchestrator Integration */}
      <TemporalWorkflowAction
        targetDate={targetDate}
        mealPeriod={mealPeriod}
        onPlanCreated={() => handleGeneratePlan()}
      />

      {/* STEP 2: Generated Plan Output & Shortages */}
      {plan && (
        <div className="space-y-6 pt-2 animate-in fade-in duration-200">
          {/* Grounded AI Rationale Card */}
          <div className="desk-card p-5 border-l-4 border-l-primary bg-gradient-to-r from-surface-container-low to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-secondary" />
                <h3 className="font-headline font-bold text-sm text-primary">
                  Gemma AI Grounded Rationale
                </h3>
              </div>
              <span className="badge-live">
                LOCAL INFERENCE
              </span>
            </div>

            {plan.ai_recommendation ? (
              <div className="space-y-2 font-body text-xs text-on-surface leading-relaxed">
                <p className="font-medium">{plan.ai_recommendation}</p>

                {plan.ai_notes_interpretation && (
                  <div className="bg-tertiary-fixed/30 p-2.5 rounded-lg border border-tertiary-fixed/60 text-on-tertiary-fixed font-mono text-[11px]">
                    <strong>Kitchen Constraints Interpreted:</strong> {plan.ai_notes_interpretation}
                  </div>
                )}

                {plan.ai_menu_suggestion && (
                  <div className="bg-primary-fixed/30 p-2.5 rounded-lg border border-primary/20 text-primary font-mono text-[11px]">
                    <strong>Menu Hook / Story:</strong> {plan.ai_menu_suggestion}
                  </div>
                )}
              </div>
            ) : plan.ai_error ? (
              <div className="text-xs font-mono text-on-surface-variant bg-surface-container p-3 rounded-lg border border-outline-variant">
                <span className="font-bold text-error">AI Service Notice:</span> {plan.ai_error}
                <div className="text-[11px] text-on-surface-variant mt-1">
                  Deterministic forecast &amp; stock calculations remain 100% operational below.
                </div>
              </div>
            ) : (
              <div className="text-xs text-on-surface-variant">No specific AI recommendation generated.</div>
            )}
          </div>

          {/* Portion Calculations & Baseline Formulas */}
          <div className="desk-card p-5">
            <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-primary-container text-white flex items-center justify-center font-bold text-xs">
                  02
                </span>
                <h3 className="font-headline font-bold text-base text-primary">
                  Portion Calculations &amp; Baseline Explanations
                </h3>
              </div>
              <span className="font-mono text-xs text-on-surface-variant">
                Target: {plan.target_date} ({plan.meal_period})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/60 font-mono text-[11px] text-on-surface-variant uppercase font-bold">
                    <th className="pb-2">Recipe / Dish</th>
                    <th className="pb-2 text-right">Baseline Forecast</th>
                    <th className="pb-2 text-right">Advance Orders</th>
                    <th className="pb-2 text-right">Buffer ({Math.round(safetyBuffer * 100)}%)</th>
                    <th className="pb-2 text-right font-bold text-primary">Target Prep</th>
                    <th className="pb-2 pl-4">Method &amp; Historical Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40">
                  {plan.recipes.map((r) => {
                    const forecastInfo = plan.forecasts.find((f) => f.recipe_id === r.recipe_id);
                    return (
                      <tr key={r.recipe_id} className="hover:bg-surface-container-low transition-colors">
                        <td className="py-2.5 font-bold text-on-surface">{r.recipe_name}</td>
                        <td className="py-2.5 text-right font-mono text-on-surface-variant">{r.forecast_portions}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-secondary">{r.confirmed_orders}</td>
                        <td className="py-2.5 text-right font-mono text-on-surface-variant">+{r.buffer_portions}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-sm text-primary">
                          {r.total_portions}
                        </td>
                        <td className="py-2.5 pl-4 text-[11px] font-mono text-on-surface-variant">
                          <span className="font-bold text-primary">
                            {forecastInfo?.method === 'weekday_average'
                              ? `Weekday Average (${forecastInfo.observations_used} days)`
                              : forecastInfo?.method === 'trailing_average'
                              ? `Trailing 7-Day Average (${forecastInfo.observations_used} days)`
                              : 'Manual / Standing Plan'}
                          </span>
                          : {forecastInfo?.explanation}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ingredient Shortages & Shopping List */}
          <div className="desk-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-outline-variant/40 pb-3 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-secondary text-white flex items-center justify-center font-bold text-xs">
                  03
                </span>
                <h3 className="font-headline font-bold text-base text-primary">
                  Bill of Materials &amp; Shortages Shopping List
                </h3>
              </div>
              <div className="font-mono text-xs text-on-surface">
                Estimated BOM Cost: <strong className="font-headline font-bold text-base text-primary">₹{plan.estimated_total_cost}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-body text-xs">
                <thead>
                  <tr className="border-b border-outline-variant/60 font-mono text-[11px] text-on-surface-variant uppercase font-bold">
                    <th className="pb-2">Ingredient</th>
                    <th className="pb-2 text-right">Required Qty</th>
                    <th className="pb-2 text-right">Available in Stock</th>
                    <th className="pb-2 text-right">Shortage to Buy</th>
                    <th className="pb-2 text-right">Unit</th>
                    <th className="pb-2 text-right">Estimated Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/40 font-mono">
                  {plan.shopping_list.map((item, idx) => {
                    const hasShortage = item.shortage_qty > 0;
                    return (
                      <tr
                        key={idx}
                        className={hasShortage ? 'bg-secondary-fixed/20 hover:bg-secondary-fixed/30' : 'hover:bg-surface-container-low'}
                      >
                        <td className="py-2.5 font-bold font-body text-on-surface capitalize">
                          <div className="flex items-center justify-between gap-2">
                            <span>{item.ingredient_name}</span>
                            <button
                              type="button"
                              onClick={() => openSupplierSearch(item.ingredient_name)}
                              className="font-mono text-[10px] bg-white hover:bg-surface-container border border-outline-variant/60 text-primary px-2 py-0.5 rounded inline-flex items-center gap-1 transition shadow-2xs"
                              title="Compare wholesale supplier prices via SerpAPI"
                            >
                              <Store className="w-3 h-3 text-secondary" />
                              Supplier Price
                            </button>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-medium">{item.required_qty}</td>
                        <td className="py-2.5 text-right text-on-surface-variant">{item.available_qty}</td>
                        <td className="py-2.5 text-right">
                          {hasShortage ? (
                            <span className="badge-alert">
                              {item.shortage_qty} {item.unit}
                            </span>
                          ) : (
                            <span className="badge-fresh">IN STOCK ✓</span>
                          )}
                        </td>
                        <td className="py-2.5 text-right text-on-surface-variant font-body">{item.unit}</td>
                        <td className="py-2.5 text-right font-bold text-primary">₹{item.estimated_cost}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plan Finalization Action Ticket */}
          <div className="desk-card p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface-container-low border-2 border-primary/30">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                <h4 className="font-headline font-bold text-base text-primary">Confirm &amp; Finalize Preparation Plan</h4>
              </div>
              <p className="font-body text-xs text-on-surface-variant mt-0.5">
                Lock this plan as today&apos;s active production target on your Master Kitchen Dashboard.
              </p>
            </div>

            {confirmedSuccess || plan.is_confirmed ? (
              <div className="flex items-center gap-2 text-primary font-mono bg-primary-fixed/40 px-4 py-2 rounded-lg text-xs font-bold border border-primary/40">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                Plan Confirmed &amp; Dispatched to Desk!
              </div>
            ) : (
              <button
                onClick={handleConfirmPlan}
                disabled={confirming}
                className="btn-primary text-xs px-6 py-2.5 shadow-[0_2px_0_0_#00210a]"
              >
                {confirming ? 'Saving Plan...' : 'Confirm Preparation Plan'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global Wholesale Supplier Search Modal (SerpAPI + Tiger Data) */}
      <SupplierSearchModal />
    </div>
  );
}
