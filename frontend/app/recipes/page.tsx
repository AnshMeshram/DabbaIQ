'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  ChefHat,
  RefreshCw,
  CheckCircle2,
  Tag,
  Languages,
} from 'lucide-react';
import { api, Recipe, Ingredient, RecipeIngredient } from '@/lib/api';

const MEAL_CATEGORIES = [
  { id: 'all', label: 'All Dishes' },
  { id: 'main', label: 'Main Curry' },
  { id: 'side', label: 'Dal & Kadhi' },
  { id: 'bread', label: 'Breads & Phulkas' },
  { id: 'rice', label: 'Rice & Biryani' },
  { id: 'dessert', label: 'Dessert' },
  { id: 'snack', label: 'Sides & Snacks' },
];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [name, setName] = useState('');
  const [mealCategory, setMealCategory] = useState('main');
  const [prepNotes, setPrepNotes] = useState('');
  const [dietaryLabels, setDietaryLabels] = useState('vegetarian');
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([]);

  // AI Menu Description generator modal
  const [descModalRecipe, setDescModalRecipe] = useState<Recipe | null>(null);
  const [aiLang, setAiLang] = useState('English');
  const [generatedDesc, setGeneratedDesc] = useState('');
  const [generatingDesc, setGeneratingDesc] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, iRes] = await Promise.all([
        api.getRecipes(selectedCategory !== 'all' ? selectedCategory : undefined),
        api.getInventory(),
      ]);
      setRecipes(rRes.items);
      setIngredients(iRes.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes and ingredients');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingRecipe(null);
    setName('');
    setMealCategory('main');
    setPrepNotes('');
    setDietaryLabels('vegetarian');
    if (ingredients.length > 0) {
      setRecipeIngredients([
        {
          ingredient_id: ingredients[0].id,
          ingredient_name: ingredients[0].name,
          quantity_per_portion: 0.05,
          unit: ingredients[0].unit,
        },
      ]);
    } else {
      setRecipeIngredients([]);
    }
    setShowModal(true);
  };

  const handleOpenEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setMealCategory(recipe.meal_category);
    setPrepNotes(recipe.prep_notes || '');
    setDietaryLabels(recipe.dietary_labels?.join(', ') || '');
    setRecipeIngredients([...recipe.ingredients]);
    setShowModal(true);
  };

  const handleAddIngredientRow = () => {
    if (ingredients.length === 0) return;
    setRecipeIngredients([
      ...recipeIngredients,
      {
        ingredient_id: ingredients[0].id,
        ingredient_name: ingredients[0].name,
        quantity_per_portion: 0.05,
        unit: ingredients[0].unit,
      },
    ]);
  };

  const handleUpdateIngredientRow = (
    index: number,
    field: keyof RecipeIngredient,
    value: any
  ) => {
    const updated = [...recipeIngredients];
    if (field === 'ingredient_id') {
      const found = ingredients.find((i) => i.id === value);
      updated[index].ingredient_id = value;
      if (found) {
        updated[index].ingredient_name = found.name;
        updated[index].unit = found.unit;
      }
    } else {
      (updated[index] as any)[field] = value;
    }
    setRecipeIngredients(updated);
  };

  const handleRemoveIngredientRow = (index: number) => {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
  };

  // Live portion cost calculator for form preview
  const liveFormPortionCost = recipeIngredients.reduce((total, row) => {
    const ing = ingredients.find((i) => i.id === row.ingredient_id);
    const unitCost = ing ? ing.cost_per_unit : 0;
    const qty = parseFloat(row.quantity_per_portion.toString()) || 0;
    return total + unitCost * qty;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (recipeIngredients.length === 0) {
      setError('Recipe must include at least one ingredient.');
      return;
    }

    try {
      const payload: Partial<Recipe> = {
        name: name.trim(),
        meal_category: mealCategory,
        ingredients: recipeIngredients.map((ing) => ({
          ...ing,
          quantity_per_portion: parseFloat(ing.quantity_per_portion.toString()),
        })),
        prep_notes: prepNotes.trim() || undefined,
        dietary_labels: dietaryLabels
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingRecipe) {
        await api.updateRecipe(editingRecipe.id, payload);
      } else {
        await api.createRecipe(payload);
      }

      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving recipe');
    }
  };

  const handleDelete = async (id: string, recipeName: string) => {
    if (!confirm(`Are you sure you want to delete the recipe "${recipeName}"?`)) return;
    try {
      await api.deleteRecipe(id);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error deleting recipe');
    }
  };

  const handleGenerateDescription = async (recipe: Recipe) => {
    setDescModalRecipe(recipe);
    setGeneratedDesc('');
    setGeneratingDesc(true);
    try {
      const res = await api.generateMenuDescription([recipe.id], aiLang);
      setGeneratedDesc(res.description);
    } catch (err: any) {
      setGeneratedDesc(`AI Generation notice: ${err.message}`);
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Operational Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-headline font-bold text-primary tracking-tight">
              Recipe Library &amp; Costing Matrix
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 rounded-xs bg-primary text-white font-bold">
              BOM MATRIX
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-on-surface-variant mt-0.5">
            Bill of Materials (BOM), per-portion ingredient allocations, and Gemma AI menu storytelling
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary text-xs shadow-[0_2px_0_0_#00210a] self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Master Recipe</span>
        </button>
      </div>

      {/* Category Navigation Bar */}
      <div className="desk-card p-3 flex items-center gap-1.5 overflow-x-auto font-mono text-xs">
        {MEAL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-primary-container text-white font-bold shadow-[0_1px_2px_rgba(0,0,0,0.06)]'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container hover:text-on-surface border border-outline-variant/40'
            }`}
          >
            {cat.label}
          </button>
        ))}
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

      {/* Recipes Grid */}
      {loading ? (
        <div className="desk-card p-12 text-center font-mono text-xs text-on-surface-variant">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
          Loading Bill of Materials &amp; Recipes...
        </div>
      ) : recipes.length === 0 ? (
        <div className="desk-card p-12 text-center font-body text-xs text-on-surface-variant space-y-3">
          <BookOpen className="w-8 h-8 mx-auto text-outline" />
          <p className="font-semibold text-on-surface">No recipes found in this category.</p>
          <button onClick={handleOpenAdd} className="btn-secondary text-xs">
            + Create First Recipe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="desk-card p-5 flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div>
                {/* Recipe Header */}
                <div className="flex items-start justify-between gap-3 border-b border-outline-variant/40 pb-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-headline font-bold text-lg text-primary">
                        {recipe.name}
                      </h3>
                      <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded">
                        {recipe.meal_category}
                      </span>
                    </div>

                    {/* Dietary Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {recipe.dietary_labels?.map((label, idx) => (
                        <span
                          key={idx}
                          className="font-mono text-[10px] text-primary bg-primary-fixed/30 px-2 py-0.5 rounded font-semibold border border-primary/20"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Portion Cost Highlight */}
                  <div className="text-right shrink-0">
                    <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant block">
                      Cost / Dabba
                    </span>
                    <span className="font-headline font-bold text-xl text-primary">
                      ₹{Math.round(recipe.estimated_cost_per_portion)}
                    </span>
                  </div>
                </div>

                {/* Bill of Materials (BOM) Table */}
                <div className="mb-4">
                  <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase mb-1.5 flex items-center justify-between">
                    <span>Ingredient Allocation (per portion)</span>
                    <span>{recipe.ingredients.length} items</span>
                  </div>

                  <div className="bg-surface-container-low rounded-lg p-2.5 border border-outline-variant/40">
                    <div className="divide-y divide-outline-variant/40 font-mono text-xs">
                      {recipe.ingredients.map((ing, i) => (
                        <div key={i} className="py-1.5 flex items-center justify-between">
                          <span className="font-body text-on-surface font-medium capitalize">
                            {ing.ingredient_name || ing.ingredient_id}
                          </span>
                          <span className="font-bold text-primary">
                            {ing.quantity_per_portion} {ing.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Prep Notes */}
                {recipe.prep_notes && (
                  <div className="mb-4 p-2.5 bg-surface-container rounded-lg border border-outline-variant/40 text-xs font-mono text-on-surface-variant">
                    <span className="font-bold text-primary">Station Prep Notes: </span>
                    {recipe.prep_notes}
                  </div>
                )}
              </div>

              {/* Recipe Card Action Footer */}
              <div className="pt-3 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerateDescription(recipe)}
                  className="font-mono text-[11px] font-bold text-secondary bg-secondary-fixed/40 hover:bg-secondary-fixed/70 border border-secondary/30 px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5 text-secondary" />
                  <span>AI Menu Story</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(recipe)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition"
                    title="Edit Recipe"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.name)}
                    className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-surface-container transition"
                    title="Delete Recipe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* AI Menu Storyteller Modal (Gemma 2 Inference) */}
      {descModalRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border-2 border-primary/30 rounded-xl shadow-[0_8px_0_0_#18542a] w-full max-w-lg overflow-hidden">
            <div className="bg-primary px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-tertiary-fixed" />
                <h3 className="font-headline font-bold text-base tracking-tight">
                  Gemma AI Menu Storyteller
                </h3>
              </div>
              <button
                onClick={() => setDescModalRecipe(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 font-body text-xs">
              <div className="flex items-center justify-between bg-surface-container p-2.5 rounded-lg font-mono">
                <div>
                  <span className="text-on-surface-variant">Selected Dish: </span>
                  <strong className="text-primary">{descModalRecipe.name}</strong>
                </div>
                <div className="flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-primary" />
                  <select
                    value={aiLang}
                    onChange={(e) => {
                      setAiLang(e.target.value);
                      handleGenerateDescription(descModalRecipe);
                    }}
                    className="bg-white border border-outline-variant rounded px-2 py-0.5 text-xs font-bold text-primary outline-none"
                  >
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 min-h-28 flex items-center justify-center">
                {generatingDesc ? (
                  <div className="text-center font-mono text-on-surface-variant space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto text-primary" />
                    <span>Gemma generating culinary story &amp; promotional description...</span>
                  </div>
                ) : (
                  <p className="font-body text-sm text-on-surface leading-relaxed">
                    {generatedDesc || 'Click refresh to synthesize a fresh story.'}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleGenerateDescription(descModalRecipe)}
                  disabled={generatingDesc}
                  className="btn-surface text-xs font-mono"
                >
                  Regenerate
                </button>
                <button
                  type="button"
                  onClick={() => setDescModalRecipe(null)}
                  className="btn-primary text-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Recipe Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white border-2 border-primary/30 rounded-xl shadow-[0_8px_0_0_#18542a] w-full max-w-2xl my-8 overflow-hidden">
            <div className="bg-primary px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-tertiary-fixed" />
                <h3 className="font-headline font-bold text-base tracking-tight">
                  {editingRecipe ? 'Edit Master Recipe' : 'Create Master Recipe'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 font-body text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Recipe / Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toor Dal Tadka, Jeera Basmati Rice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                    Tiffin Category
                  </label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                    className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-medium text-on-surface outline-none focus:border-primary"
                  >
                    {MEAL_CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Dietary Labels (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="vegetarian, jain, high-protein, gluten-free"
                  value={dietaryLabels}
                  onChange={(e) => setDietaryLabels(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono text-on-surface outline-none focus:border-primary"
                />
              </div>

              {/* Bill of Materials Ingredient Allocator */}
              <div className="border border-outline-variant/60 rounded-xl p-3 bg-surface-container-low/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold uppercase text-on-surface-variant text-[11px]">
                    Ingredients Bill of Materials (per single dabba portion)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="btn-surface text-[10px] font-mono py-1 px-2"
                  >
                    + Add Ingredient Row
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recipeIngredients.map((row, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={row.ingredient_id}
                        onChange={(e) =>
                          handleUpdateIngredientRow(idx, 'ingredient_id', e.target.value)
                        }
                        className="flex-1 bg-white border border-outline-variant rounded px-2.5 py-1.5 text-xs text-on-surface font-medium outline-none"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} (₹{ing.cost_per_unit}/{ing.unit})
                          </option>
                        ))}
                      </select>

                      <div className="w-24 flex items-center gap-1 font-mono">
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          required
                          value={row.quantity_per_portion}
                          onChange={(e) =>
                            handleUpdateIngredientRow(
                              idx,
                              'quantity_per_portion',
                              e.target.value
                            )
                          }
                          className="w-full bg-white border border-outline-variant rounded px-2 py-1.5 text-xs font-bold text-right"
                        />
                        <span className="text-on-surface-variant text-[11px] w-6">
                          {row.unit}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        className="text-on-surface-variant hover:text-error p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Live Cost Calculation Bar */}
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between font-mono text-xs">
                  <span className="text-on-surface-variant">Calculated Ingredient Cost per Portion:</span>
                  <span className="font-headline font-bold text-base text-primary">
                    ₹{liveFormPortionCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-mono font-bold uppercase text-on-surface-variant mb-1">
                  Station Prep Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Kettle 2 • Temper with mustard seeds, curry leaves & garlic at 10:45 AM"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant rounded-lg p-2 text-xs font-body text-on-surface outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg hover:bg-surface-container text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary text-xs"
                >
                  {editingRecipe ? 'Update Recipe' : 'Save Master Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
