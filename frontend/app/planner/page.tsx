'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Calendar,
  ChefHat,
  ShoppingCart,
  AlertCircle,
  CheckCircle2,
  Info,
  Clock,
  Printer,
  ChevronDown,
  RefreshCw,
  Mic,
  UploadCloud,
  Store,
} from 'lucide-react';
import { api, Recipe, PrepPlan } from '@/lib/api';
import { useUIStore } from '@/lib/store';
import TemporalWorkflowAction from '@/components/TemporalWorkflowAction';
import SupplierSearchModal from '@/components/SupplierSearchModal';

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
        // Select all by default
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">AI Preparation Planner</h1>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Gemma 3 + Deterministic Engine
            </span>
          </div>
          <p className="text-sm text-[#78716C]">
            Grounded demand forecasts, stock shortage calculations, and AI menu synthesis
          </p>
        </div>

        {plan && (
          <button
            onClick={() => window.print()}
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Printer className="w-4 h-4 text-[#78716C]" />
            Print Kitchen Prep Sheet
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="card-warm p-5 space-y-5">
        <h2 className="text-base font-semibold text-[#0F291E]">1. Plan Parameters & Input</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Target Date */}
          <div>
            <label className="block text-xs font-semibold text-[#57534E] mb-1">Target Date</label>
            <div className="flex items-center gap-2 border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white">
              <Calendar className="w-4 h-4 text-[#78716C]" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full text-sm outline-none bg-transparent"
              />
            </div>
          </div>

          {/* Meal Period */}
          <div>
            <label className="block text-xs font-semibold text-[#57534E] mb-1">Meal Period</label>
            <select
              value={mealPeriod}
              onChange={(e) => setMealPeriod(e.target.value)}
              className="w-full text-sm border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none capitalize"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snacks">Snacks</option>
            </select>
          </div>

          {/* Safety Buffer */}
          <div>
            <label className="block text-xs font-semibold text-[#57534E] mb-1">
              Safety Buffer: {Math.round(safetyBuffer * 100)}%
            </label>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.05"
                value={safetyBuffer}
                onChange={(e) => setSafetyBuffer(parseFloat(e.target.value))}
                className="w-full accent-[#1B4332]"
              />
              <span className="text-xs font-mono font-bold text-[#1B4332] w-12 text-right">
                +{Math.round(safetyBuffer * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Recipes Selection & Confirmed Orders */}
        <div>
          <label className="block text-xs font-semibold text-[#57534E] mb-2">
            Recipes to Prepare & Known Advance Orders (Tiffin Count)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recipes.map((recipe) => {
              const isSelected = selectedRecipes.includes(recipe.id);
              return (
                <div
                  key={recipe.id}
                  className={`border rounded-xl p-3 flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'border-[#1B4332] bg-[#EBF8EE]/40 shadow-xs'
                      : 'border-[#E7E5E4] bg-white opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipe(recipe.id)}
                        className="rounded text-[#1B4332] focus:ring-[#1B4332]"
                      />
                      <span className="font-medium text-xs text-[#1C1917]">{recipe.name}</span>
                    </label>
                    <span className="text-[10px] uppercase font-bold text-[#78716C] bg-stone-100 px-1.5 py-0.5 rounded">
                      {recipe.meal_category}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="mt-2.5 pt-2 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
                      <span className="text-[#78716C] text-[11px]">Confirmed Orders:</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={confirmedOrders[recipe.id] || ''}
                        onChange={(e) => handleOrderChange(recipe.id, e.target.value)}
                        className="w-16 border border-[#E7E5E4] rounded px-2 py-0.5 text-right font-medium text-xs bg-white"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Free-text Kitchen Notes with Voice STT */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#57534E]">
              Messy Kitchen Notes / Special Constraints (Optional)
            </label>

            {/* Voice upload button */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-xs font-semibold text-[#D97706] hover:text-[#B45309] flex items-center gap-1">
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
            <div className="mb-2 p-2 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 flex items-center justify-between">
              <span>{voiceNotice}</span>
              <button
                type="button"
                onClick={() => setVoiceNotice(null)}
                className="text-stone-400 hover:text-stone-700 ml-2"
              >
                ✕
              </button>
            </div>
          )}

          <textarea
            rows={2}
            value={kitchenNotes}
            onChange={(e) => setKitchenNotes(e.target.value)}
            placeholder="e.g. 'Sharma office ordered 8 extra dal; rain forecast tomorrow, might reduce walk-ins by 10%; use up remaining tomatoes first'"
            className="w-full text-xs border border-[#E7E5E4] rounded-lg p-2.5 bg-white outline-none focus:border-[#1B4332]"
          />
          <p className="text-[11px] text-[#A8A29E] mt-1">
            Gemma open-weight model interprets these constraints without overriding deterministic stock math. Voice notes processed via ElevenLabs server-side STT.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            onClick={handleGeneratePlan}
            disabled={loading}
            className="btn-forest px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Computing Demand &amp; Consulting Gemma...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                Generate Plan &amp; Shopping List
              </>
            )}
          </button>
        </div>
      </div>

      {/* Temporal Distributed Workflow Orchestrator Card */}
      <TemporalWorkflowAction
        targetDate={targetDate}
        mealPeriod={mealPeriod}
        onPlanCreated={() => handleGeneratePlan()}
      />

      {/* Generated Plan Section */}
      {plan && (
        <div className="space-y-6 pt-2">
          {/* AI Grounded Recommendations Card */}
          <div className="card-warm p-5 border-l-4 border-l-[#1B4332] bg-gradient-to-r from-[#FBFDFB] to-white">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h3 className="text-sm font-bold text-[#0F291E]">AI Grounded Reasoning (Gemma)</h3>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1B4332] bg-[#EBF8EE] px-2 py-0.5 rounded-full border border-[#D8F3DC]">
                Local Inference
              </span>
            </div>

            {plan.ai_recommendation ? (
              <div className="space-y-2 text-xs text-[#44403C] leading-relaxed">
                <p className="font-medium text-[#1C1917]">{plan.ai_recommendation}</p>

                {plan.ai_notes_interpretation && (
                  <div className="bg-[#FFFBEB] p-2.5 rounded-lg border border-[#FDE68A] text-[#92400E] text-[11px]">
                    <strong>Kitchen Notes Interpreted:</strong> {plan.ai_notes_interpretation}
                  </div>
                )}

                {plan.ai_menu_suggestion && (
                  <div className="bg-[#EBF8EE] p-2.5 rounded-lg border border-[#D8F3DC] text-[#1B4332] text-[11px]">
                    <strong>Menu Tagline / Description:</strong> {plan.ai_menu_suggestion}
                  </div>
                )}
              </div>
            ) : plan.ai_error ? (
              <div className="text-xs text-[#78716C] bg-stone-50 p-3 rounded-lg border border-stone-200">
                <span className="font-semibold text-stone-700">AI Service Offline:</span> {plan.ai_error}
                <div className="text-[11px] text-[#A8A29E] mt-1">
                  Deterministic forecast & stock calculations remain 100% operational below.
                </div>
              </div>
            ) : (
              <div className="text-xs text-[#78716C]">No specific AI recommendation generated.</div>
            )}
          </div>

          {/* Section 2: Preparation Portions & Forecast Formulas */}
          <div className="card-warm p-5">
            <h3 className="text-sm font-bold text-[#0F291E] mb-3 flex items-center gap-2">
              <ChefHat className="w-4 h-4 text-[#1B4332]" />
              2. Portion Calculations & Baseline Method Explanations
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E7E5E4] text-[#78716C] font-semibold">
                    <th className="pb-2">Recipe</th>
                    <th className="pb-2 text-right">Baseline Forecast</th>
                    <th className="pb-2 text-right">Confirmed Orders</th>
                    <th className="pb-2 text-right">Buffer ({Math.round(safetyBuffer * 100)}%)</th>
                    <th className="pb-2 text-right font-bold text-[#0F291E]">Total Prep</th>
                    <th className="pb-2 pl-4">Method & Observations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {plan.recipes.map((r) => {
                    const forecastInfo = plan.forecasts.find((f) => f.recipe_id === r.recipe_id);
                    return (
                      <tr key={r.recipe_id} className="hover:bg-[#FDFBF7]">
                        <td className="py-2.5 font-semibold text-[#1C1917]">{r.recipe_name}</td>
                        <td className="py-2.5 text-right font-mono">{r.forecast_portions}</td>
                        <td className="py-2.5 text-right font-mono text-[#D97706]">{r.confirmed_orders}</td>
                        <td className="py-2.5 text-right font-mono text-stone-500">+{r.buffer_portions}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-base text-[#1B4332]">
                          {r.total_portions}
                        </td>
                        <td className="py-2.5 pl-4 text-[11px] text-[#78716C]">
                          <span className="font-semibold text-stone-700">
                            {forecastInfo?.method === 'weekday_average'
                              ? `Weekday Average (${forecastInfo.observations_used} days)`
                              : forecastInfo?.method === 'trailing_average'
                              ? `Trailing 7-Day Average (${forecastInfo.observations_used} days)`
                              : 'Manual / No History'}
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

          {/* Section 3: Ingredient Shortages & Shopping List */}
          <div className="card-warm p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#0F291E] flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#D97706]" />
                3. Ingredient Requirements & Shortages Shopping List
              </h3>
              <div className="text-xs text-[#57534E]">
                Estimated Total Cost: <strong className="text-sm text-[#0F291E]">₹{plan.estimated_total_cost}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E7E5E4] text-[#78716C] font-semibold">
                    <th className="pb-2">Ingredient</th>
                    <th className="pb-2 text-right">Required</th>
                    <th className="pb-2 text-right">Available in Stock</th>
                    <th className="pb-2 text-right">Shortage to Buy</th>
                    <th className="pb-2 text-right">Unit</th>
                    <th className="pb-2 text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E5E4]">
                  {plan.shopping_list.map((item, idx) => {
                    const hasShortage = item.shortage_qty > 0;
                    return (
                      <tr
                        key={idx}
                        className={hasShortage ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-[#FDFBF7]'}
                      >
                        <td className="py-2 font-medium text-[#1C1917] capitalize">
                          <div className="flex items-center justify-between gap-1">
                            <span>{item.ingredient_name}</span>
                            <button
                              type="button"
                              onClick={() => openSupplierSearch(item.ingredient_name)}
                              className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-medium inline-flex items-center gap-1 transition"
                              title="Search wholesale supplier market prices"
                            >
                              <Store className="w-3 h-3" />
                              Price
                            </button>
                          </div>
                        </td>
                        <td className="py-2 text-right font-mono">{item.required_qty}</td>
                        <td className="py-2 text-right font-mono text-[#57534E]">{item.available_qty}</td>
                        <td className="py-2 text-right font-mono font-bold">
                          {hasShortage ? (
                            <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              {item.shortage_qty} {item.unit}
                            </span>
                          ) : (
                            <span className="text-emerald-700">In Stock ✓</span>
                          )}
                        </td>
                        <td className="py-2 text-right text-stone-500">{item.unit}</td>
                        <td className="py-2 text-right font-mono text-[#1C1917]">₹{item.estimated_cost}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Confirmation Action */}
          <div className="card-warm p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#FDFBF7]">
            <div>
              <h4 className="font-bold text-sm text-[#0F291E]">Confirm & Finalize Plan</h4>
              <p className="text-xs text-[#78716C]">
                Confirming locks this plan as today's active production target on your kitchen dashboard.
              </p>
            </div>

            {confirmedSuccess || plan.is_confirmed ? (
              <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-300">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Plan Confirmed & Active!
              </div>
            ) : (
              <button
                onClick={handleConfirmPlan}
                disabled={confirming}
                className="btn-forest px-6 py-2.5 text-sm font-semibold flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {confirming ? 'Saving...' : 'Confirm Preparation Plan'}
              </button>
            )}
          </div>
        </div>
      )}
      {/* Global Supplier Search Modal */}
      <SupplierSearchModal />
    </div>
  );
}
