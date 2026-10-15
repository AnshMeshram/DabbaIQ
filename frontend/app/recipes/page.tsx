'use client';

import { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  X,
  IndianRupee,
  AlertCircle,
  Tag,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api, Recipe, Ingredient, RecipeIngredient } from '@/lib/api';

const MEAL_CATEGORIES = ['main', 'side', 'bread', 'rice', 'dessert', 'beverage', 'snack'];
const UNITS = ['kg', 'g', 'L', 'ml', 'pieces'];

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
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

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rRes, iRes] = await Promise.all([api.getRecipes(), api.getInventory()]);
      setRecipes(rRes.items);
      setIngredients(iRes.items);
    } catch (err: any) {
      setError(err.message || 'Failed to load recipes and ingredients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingRecipe(null);
    setName('');
    setMealCategory('main');
    setPrepNotes('');
    setDietaryLabels('vegetarian');
    // Start with one blank ingredient
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
      setGeneratedDesc(`AI Description unavailable: ${err.message}`);
    } finally {
      setGeneratingDesc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E7E5E4]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F291E]">Recipe Library</h1>
          <p className="text-sm text-[#78716C]">
            Deterministic per-portion ingredient costs calculated automatically from stock prices
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-forest px-4 py-2 text-xs font-semibold flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Recipe
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {recipes.map((recipe) => (
          <div key={recipe.id} className="card-warm p-5 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-bold text-base text-[#0F291E] flex items-center gap-1.5">
                    {recipe.name}
                    {recipe.is_demo && <span className="badge-demo scale-90">Demo</span>}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                    {recipe.meal_category}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-xs text-[#78716C]">Cost / Portion</div>
                  <div className="text-base font-bold text-[#1B4332] font-mono">
                    ₹{recipe.estimated_cost_per_portion}
                  </div>
                </div>
              </div>

              {/* Dietary Labels */}
              {recipe.dietary_labels && recipe.dietary_labels.length > 0 && (
                <div className="flex flex-wrap gap-1 my-2">
                  {recipe.dietary_labels.map((label, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-medium bg-[#EBF8EE] text-[#1B4332] px-1.5 py-0.5 rounded border border-[#D8F3DC]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              )}

              {/* Ingredients List */}
              <div className="mt-3 pt-3 border-t border-[#E7E5E4]">
                <div className="text-[11px] font-semibold text-[#57534E] mb-1.5 uppercase tracking-wider">
                  Ingredients per Portion:
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {recipe.ingredients.map((ing, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-0.5 text-stone-700"
                    >
                      <span className="capitalize">{ing.ingredient_name || 'Ingredient'}</span>
                      <span className="font-mono text-stone-500">
                        {ing.quantity_per_portion} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prep Notes */}
              {recipe.prep_notes && (
                <div className="mt-3 p-2 bg-[#FBF9F5] rounded-lg border border-[#E7E5E4] text-[11px] text-[#57534E]">
                  <strong>Prep notes:</strong> {recipe.prep_notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-[#E7E5E4] flex items-center justify-between text-xs">
              <button
                onClick={() => handleGenerateDescription(recipe)}
                className="text-[#D97706] hover:text-[#B45309] font-semibold flex items-center gap-1"
                title="Generate marketing menu description using Gemma"
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Description
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(recipe)}
                  className="p-1 hover:text-stone-900 text-stone-500 rounded"
                  title="Edit"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(recipe.id, recipe.name)}
                  className="p-1 hover:text-red-700 text-stone-400 rounded"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {recipes.length === 0 && (
          <div className="col-span-full py-16 text-center text-[#A8A29E] card-warm">
            {loading ? 'Loading recipe library...' : 'No recipes created yet.'}
          </div>
        )}
      </div>

      {/* AI Menu Description Modal */}
      {descModalRecipe && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <h3 className="font-bold text-base text-[#0F291E]">
                  AI Menu Description — {descModalRecipe.name}
                </h3>
              </div>
              <button onClick={() => setDescModalRecipe(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-stone-700">Language:</span>
              {['English', 'Hindi', 'Marathi'].map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setAiLang(lang);
                    handleGenerateDescription(descModalRecipe);
                  }}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                    aiLang === lang ? 'bg-[#1B4332] text-white' : 'bg-stone-100 text-stone-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <div className="bg-[#FBF9F5] p-4 rounded-xl border border-[#E7E5E4] min-h-24 text-xs text-stone-800 leading-relaxed">
              {generatingDesc ? (
                <div className="text-stone-400 italic">Generating appetizing description with Gemma...</div>
              ) : (
                generatedDesc || 'Click a language above to generate.'
              )}
            </div>

            <div className="flex justify-end">
              <button onClick={() => setDescModalRecipe(null)} className="btn-outline px-4 py-1.5 text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Recipe Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7E5E4]">
              <h3 className="font-bold text-base text-[#0F291E]">
                {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Recipe Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dal Tadka, Jeera Rice"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#57534E] mb-1">Meal Category</label>
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none capitalize"
                  >
                    {MEAL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ingredients per portion */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-[#57534E]">Ingredients per Portion *</label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-[#1B4332] font-semibold flex items-center gap-1 hover:underline text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Ingredient
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {recipeIngredients.map((row, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[#FBF9F5] p-2 rounded-lg border border-[#E7E5E4]">
                      <select
                        value={row.ingredient_id}
                        onChange={(e) => handleUpdateIngredientRow(index, 'ingredient_id', e.target.value)}
                        className="flex-1 border border-[#E7E5E4] rounded px-2 py-1 bg-white outline-none capitalize"
                      >
                        {ingredients.map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({ing.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        required
                        placeholder="Qty"
                        value={row.quantity_per_portion}
                        onChange={(e) =>
                          handleUpdateIngredientRow(index, 'quantity_per_portion', e.target.value)
                        }
                        className="w-20 border border-[#E7E5E4] rounded px-2 py-1 bg-white outline-none font-mono text-center"
                      />

                      <span className="text-stone-500 font-mono w-10 text-center">{row.unit}</span>

                      <button
                        type="button"
                        onClick={() => handleRemoveIngredientRow(index)}
                        className="text-stone-400 hover:text-red-600 p-1"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">
                  Dietary Labels (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="vegetarian, vegan, gluten-free, jain"
                  value={dietaryLabels}
                  onChange={(e) => setDietaryLabels(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2 bg-white outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#57534E] mb-1">Preparation Notes</label>
                <textarea
                  rows={2}
                  placeholder="Cooking instructions, portion specs (e.g. 3 chapatis per tiffin)"
                  value={prepNotes}
                  onChange={(e) => setPrepNotes(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg p-2 bg-white outline-none"
                />
              </div>

              <div className="pt-3 border-t border-[#E7E5E4] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline px-4 py-2"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-forest px-5 py-2 font-semibold">
                  {editingRecipe ? 'Save Recipe' : 'Create Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
