'use client';

import React, { useState, useEffect } from 'react';
import { X, Receipt, Plus, AlertCircle, Check } from 'lucide-react';
import { api, Recipe } from '@/lib/api';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickSaleModal({
  isOpen,
  onClose,
  onSuccess,
}: QuickSaleModalProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [portions, setPortions] = useState<number>(1);
  const [revenue, setRevenue] = useState<number>(120);
  const [mealPeriod, setMealPeriod] = useState<string>('lunch');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getRecipes()
        .then((res) => {
          setRecipes(res.items);
          if (res.items.length > 0 && !selectedRecipeId) {
            setSelectedRecipeId(res.items[0].id);
            const estPrice = Math.max(80, Math.round(res.items[0].estimated_cost_per_portion * 2.2));
            setRevenue(estPrice);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, selectedRecipeId]);

  if (!isOpen) return null;

  const handleRecipeChange = (id: string) => {
    setSelectedRecipeId(id);
    const r = recipes.find((x) => x.id === id);
    if (r) {
      const unitEst = Math.max(80, Math.round(r.estimated_cost_per_portion * 2.2));
      setRevenue(unitEst * portions);
    }
  };

  const handlePortionsChange = (p: number) => {
    const val = Math.max(1, p);
    setPortions(val);
    const r = recipes.find((x) => x.id === selectedRecipeId);
    if (r) {
      const unitEst = Math.max(80, Math.round(r.estimated_cost_per_portion * 2.2));
      setRevenue(unitEst * val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecipeId) {
      setError('Please select a recipe.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = recipes.find((x) => x.id === selectedRecipeId);
      const today = new Date().toISOString().split('T')[0];
      await api.createSale({
        date: today,
        meal_period: mealPeriod,
        recipe_id: selectedRecipeId,
        recipe_name: r?.name || 'Walk-in Special',
        portions_sold: portions,
        revenue: revenue,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record sale ticket.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border-2 border-primary/30 rounded-xl shadow-[0_8px_0_0_#18542a] w-full max-w-md overflow-hidden">
        {/* Ticket Header */}
        <div className="bg-primary px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-tertiary-fixed" />
            <h3 className="font-headline font-bold text-base tracking-tight">
              Log Walk-in Dabba Sale
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body text-xs">
          {error && (
            <div className="p-3 bg-error-container text-error rounded-lg flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block font-mono font-semibold uppercase text-on-surface-variant mb-1">
              Meal Period
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['lunch', 'dinner', 'breakfast'].map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setMealPeriod(p)}
                  className={`py-1.5 px-3 rounded-lg font-mono capitalize text-xs border ${
                    mealPeriod === p
                      ? 'bg-primary-container text-white border-primary font-bold'
                      : 'bg-surface-container text-on-surface border-outline-variant/60 hover:bg-surface-container-high'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-mono font-semibold uppercase text-on-surface-variant mb-1">
              Select Recipe / Dabba Tier
            </label>
            <select
              value={selectedRecipeId}
              onChange={(e) => handleRecipeChange(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs text-on-surface outline-none focus:border-primary"
            >
              {recipes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.meal_category}) — ₹{Math.round(r.estimated_cost_per_portion)} cost/portion
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono font-semibold uppercase text-on-surface-variant mb-1">
                Portions Count
              </label>
              <input
                type="number"
                min="1"
                value={portions}
                onChange={(e) => handlePortionsChange(parseInt(e.target.value) || 1)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block font-mono font-semibold uppercase text-on-surface-variant mb-1">
                Gross Collected (₹)
              </label>
              <input
                type="number"
                min="0"
                value={revenue}
                onChange={(e) => setRevenue(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/50 flex justify-between items-center text-xs">
            <span className="text-on-surface-variant">Station Dispatch Group:</span>
            <span className="font-mono font-bold text-primary">MUM-04 Central Rail</span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container text-on-surface font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-secondary"
            >
              {loading ? 'Recording...' : 'Save & Print Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
