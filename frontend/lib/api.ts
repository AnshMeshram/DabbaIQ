/**
 * DabbaIQ API Client
 * Connects Next.js frontend to Python FastAPI backend
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://127.0.0.1:8000/api';

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  reorder_level: number;
  cost_per_unit: number;
  expiry_date?: string | null;
  is_low_stock?: boolean;
  is_expiring?: boolean;
  is_demo?: boolean;
}

export interface RecipeIngredient {
  ingredient_id: string;
  ingredient_name?: string;
  quantity_per_portion: number;
  unit: string;
}

export interface Recipe {
  id: string;
  name: string;
  meal_category: string;
  ingredients: RecipeIngredient[];
  prep_notes?: string;
  dietary_labels: string[];
  estimated_cost_per_portion: number;
  is_demo?: boolean;
}

export interface Sale {
  id: string;
  date: string;
  meal_period: string;
  recipe_id: string;
  recipe_name: string;
  portions_sold: number;
  revenue?: number | null;
  is_demo?: boolean;
}

export interface WasteRecord {
  id: string;
  date: string;
  meal_period: string;
  recipe_id: string;
  recipe_name: string;
  portions_prepared: number;
  portions_sold: number;
  leftover_portions: number;
  estimated_waste_cost: number;
  reason?: string | null;
  is_demo?: boolean;
}

export interface ShoppingItem {
  ingredient_id: string;
  ingredient_name: string;
  required_qty: number;
  available_qty: number;
  shortage_qty: number;
  unit: string;
  estimated_cost: number;
}

export interface ForecastDetail {
  recipe_id: string;
  recipe_name: string;
  method: string;
  observations_used: number;
  baseline_forecast: number;
  explanation: string;
}

export interface PlanRecipeItem {
  recipe_id: string;
  recipe_name: string;
  forecast_portions: number;
  confirmed_orders: number;
  buffer_portions: number;
  total_portions: number;
}

export interface PrepPlan {
  id: string;
  target_date: string;
  meal_period: string;
  recipes: PlanRecipeItem[];
  shopping_list: ShoppingItem[];
  forecasts: ForecastDetail[];
  estimated_total_cost: number;
  ai_recommendation?: string | null;
  ai_menu_suggestion?: string | null;
  ai_notes_interpretation?: string | null;
  ai_error?: string | null;
  is_confirmed: boolean;
}

export interface DashboardData {
  date: string;
  expected_portions: number;
  recorded_sales: number;
  total_revenue: number;
  low_stock_items: Array<{ id: string; name: string; quantity: number; unit: string; reorder_level: number }>;
  expiring_items: Array<{ id: string; name: string; expiry_date: string; quantity: number; unit: string }>;
  leftover_portions: number;
  estimated_waste_cost: number;
  sales_chart_data: Array<{ date: string; day: string; portions: number; revenue: number }>;
  next_plan?: PrepPlan | null;
  db_connected: boolean;
}

export interface ReportSummary {
  start_date: string;
  end_date: string;
  total_sales_portions: number;
  total_revenue: number;
  estimated_ingredient_cost: number;
  total_waste_portions: number;
  estimated_waste_cost: number;
  restock_items: Array<{ id: string; name: string; quantity: number; unit: string; reorder_level: number }>;
  daily_breakdown: Array<{ date: string; portions: number; revenue: number }>;
  meal_summaries: Array<{ meal_period: string; portions: number; revenue: number }>;
}

export interface HealthStatus {
  status: string;
  app_name: string;
  version: string;
  app_env?: string;
  db_connected: boolean;
  db_message: string;
  database?: string;
  latency_ms?: number | null;
  ai_available?: boolean;
  ai_model?: string;
  partners?: {
    elevenlabs: boolean;
    backboard: boolean;
    tinker: boolean;
  };
}

export interface IntegrationsStatus {
  database: {
    provider: string;
    connected: boolean;
    status: string;
    message: string;
    database_name: string;
    latency_ms?: number | null;
  };
  ai: {
    provider: string;
    available: boolean;
    model: string;
    model_loaded?: boolean;
    base_url: string;
    message: string;
  };
  elevenlabs: {
    configured: boolean;
    provider: string;
    feature: string;
    message: string;
  };
  backboard: {
    configured: boolean;
    provider: string;
    feature: string;
    message: string;
  };
  tinker: {
    configured: boolean;
    provider: string;
    feature: string;
    message: string;
  };
}

export interface AIStatus {
  available: boolean;
  model: string;
  base_url: string;
  model_loaded?: boolean;
  available_models?: string[];
  message: string;
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const err = await res.json();
      errorDetail = err.detail || JSON.stringify(err);
    } catch {
      // ignore
    }
    throw new Error(`API Error [${res.status}]: ${errorDetail}`);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJSON<HealthStatus>(`${API_BASE_URL}/health`),
  getAiStatus: () => fetchJSON<AIStatus>(`${API_BASE_URL}/ai/status`),

  // Dashboard
  getDashboard: (date?: string) =>
    fetchJSON<DashboardData>(`${API_BASE_URL}/dashboard${date ? `?date=${date}` : ''}`),

  // Inventory
  getInventory: (params?: { category?: string; low_stock?: boolean; expiring_days?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.low_stock) q.set('low_stock', 'true');
    if (params?.expiring_days) q.set('expiring_days', params.expiring_days.toString());
    const query = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<{ items: Ingredient[]; count: number }>(`${API_BASE_URL}/inventory${query}`);
  },
  createIngredient: (data: Partial<Ingredient>) =>
    fetchJSON<Ingredient>(`${API_BASE_URL}/inventory`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIngredient: (id: string, data: Partial<Ingredient>) =>
    fetchJSON<Ingredient>(`${API_BASE_URL}/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteIngredient: (id: string) =>
    fetchJSON<{ message: string }>(`${API_BASE_URL}/inventory/${id}`, {
      method: 'DELETE',
    }),

  // Recipes
  getRecipes: (meal_category?: string) => {
    const q = meal_category ? `?meal_category=${encodeURIComponent(meal_category)}` : '';
    return fetchJSON<{ items: Recipe[]; count: number }>(`${API_BASE_URL}/recipes${q}`);
  },
  getRecipe: (id: string) => fetchJSON<Recipe>(`${API_BASE_URL}/recipes/${id}`),
  createRecipe: (data: Partial<Recipe>) =>
    fetchJSON<Recipe>(`${API_BASE_URL}/recipes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRecipe: (id: string, data: Partial<Recipe>) =>
    fetchJSON<Recipe>(`${API_BASE_URL}/recipes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteRecipe: (id: string) =>
    fetchJSON<{ message: string }>(`${API_BASE_URL}/recipes/${id}`, {
      method: 'DELETE',
    }),

  // Sales
  getSales: (params?: { start_date?: string; end_date?: string; meal_period?: string; recipe_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.meal_period) q.set('meal_period', params.meal_period);
    if (params?.recipe_id) q.set('recipe_id', params.recipe_id);
    const query = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<{ items: Sale[]; count: number }>(`${API_BASE_URL}/sales${query}`);
  },
  createSale: (data: Partial<Sale>) =>
    fetchJSON<Sale>(`${API_BASE_URL}/sales`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSale: (id: string, data: Partial<Sale>) =>
    fetchJSON<Sale>(`${API_BASE_URL}/sales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSale: (id: string) =>
    fetchJSON<{ message: string }>(`${API_BASE_URL}/sales/${id}`, {
      method: 'DELETE',
    }),
  importSalesCSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE_URL}/sales/import`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail ? JSON.stringify(err.detail) : 'CSV import failed');
    }
    return res.json();
  },

  // Plans
  generatePlan: (data: {
    target_date: string;
    meal_period: string;
    recipe_ids?: string[];
    confirmed_orders?: Record<string, number>;
    safety_buffer?: number;
    kitchen_notes?: string;
  }) =>
    fetchJSON<PrepPlan>(`${API_BASE_URL}/plans/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmPlan: (plan_id: string) =>
    fetchJSON<PrepPlan>(`${API_BASE_URL}/plans/${plan_id}/confirm`, {
      method: 'POST',
    }),
  getPlans: (params?: { start_date?: string; end_date?: string; confirmed?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.confirmed) q.set('confirmed', 'true');
    const query = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<{ items: PrepPlan[]; count: number }>(`${API_BASE_URL}/plans${query}`);
  },

  // Waste
  getWaste: (params?: { start_date?: string; end_date?: string; recipe_id?: string }) => {
    const q = new URLSearchParams();
    if (params?.start_date) q.set('start_date', params.start_date);
    if (params?.end_date) q.set('end_date', params.end_date);
    if (params?.recipe_id) q.set('recipe_id', params.recipe_id);
    const query = q.toString() ? `?${q.toString()}` : '';
    return fetchJSON<{ items: WasteRecord[]; count: number }>(`${API_BASE_URL}/waste${query}`);
  },
  createWaste: (data: Partial<WasteRecord>) =>
    fetchJSON<WasteRecord>(`${API_BASE_URL}/waste`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteWaste: (id: string) =>
    fetchJSON<{ message: string }>(`${API_BASE_URL}/waste/${id}`, {
      method: 'DELETE',
    }),

  // Reports
  getReportSummary: (start_date: string, end_date: string) =>
    fetchJSON<ReportSummary>(`${API_BASE_URL}/reports/summary?start_date=${start_date}&end_date=${end_date}`),
  exportReportUrl: (start_date: string, end_date: string, type: 'sales' | 'waste' | 'inventory') =>
    `${API_BASE_URL}/reports/export?start_date=${start_date}&end_date=${end_date}&report_type=${type}`,

  // AI Notes & Menu
  parseNotes: (notes: string) =>
    fetchJSON<{
      parsed: {
        entries: Array<{
          date?: string;
          meal_period?: string;
          recipe_name?: string;
          portions?: number;
          revenue?: number;
          confidence: number;
          original_text: string;
        }>;
        unparseable_text?: string | null;
      };
      requires_confirmation: boolean;
      message: string;
    }>(`${API_BASE_URL}/ai/parse-notes`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  generateMenuDescription: (recipe_ids: string[], language: string = 'English') =>
    fetchJSON<{ description: string; language: string }>(`${API_BASE_URL}/ai/menu-description`, {
      method: 'POST',
      body: JSON.stringify({ recipe_ids, language }),
    }),

  // Integrations & Diagnostics
  getIntegrationsStatus: () => fetchJSON<IntegrationsStatus>(`${API_BASE_URL}/integrations/status`),

  // Voice Kitchen Notes (ElevenLabs STT)
  transcribeVoiceNote: async (audioFile: File) => {
    const formData = new FormData();
    formData.append('file', audioFile);
    const res = await fetch(`${API_BASE_URL}/voice/transcribe`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const message = err.detail?.message || err.detail || 'Voice transcription failed';
      throw new Error(typeof message === 'object' ? JSON.stringify(message) : message);
    }
    return res.json() as Promise<{
      transcript: string;
      language: string;
      parsed: {
        entries: Array<{
          date?: string;
          meal_period?: string;
          recipe_name?: string;
          portions?: number;
          revenue?: number;
          confidence: number;
          original_text: string;
        }>;
        unparseable_text?: string | null;
      };
      requires_confirmation: boolean;
      message: string;
    }>;
  },

  // Fine-Tuning Status (Tinker)
  getTrainingStatus: () =>
    fetchJSON<{ configured: boolean; provider: string; feature: string; message: string }>(
      `${API_BASE_URL}/training/status`
    ),

  // Supplier Search & Market Pricing (SerpAPI)
  searchSuppliers: (data: {
    ingredient_name: string;
    package_quantity?: number;
    package_unit?: string;
    location?: string;
  }) =>
    fetchJSON<SupplierSearchResponse>(`${API_BASE_URL}/supplier-search`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Tiger Data (TimescaleDB) Price Snapshots & History
  savePriceSnapshot: (data: {
    ingredient_name: string;
    ingredient_id?: string;
    source_name: string;
    product_title: string;
    price_numeric?: number | null;
    currency?: string;
    original_price_text?: string | null;
    source_url?: string | null;
    query_text?: string | null;
  }) =>
    fetchJSON<{ status: string; ingredient: string; price?: number; message: string }>(
      `${API_BASE_URL}/prices/snapshot`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    ),

  getPriceHistory: (ingredientName: string, days: number = 60) =>
    fetchJSON<PriceHistoryResponse>(
      `${API_BASE_URL}/prices/history/${encodeURIComponent(ingredientName)}?days=${days}`
    ),

  getPriceSummary: () =>
    fetchJSON<PriceSummaryResponse>(`${API_BASE_URL}/prices/summary`),

  // Temporal Workflow Orchestration
  triggerWorkflowPlan: (targetDate: string, mealPeriod: string = 'lunch') =>
    fetchJSON<WorkflowTriggerResponse>(`${API_BASE_URL}/workflows/plan`, {
      method: 'POST',
      body: JSON.stringify({ target_date: targetDate, meal_period: mealPeriod }),
    }),

  getWorkflowStatus: (workflowId: string) =>
    fetchJSON<{ temporal_active: boolean; workflow_id: string; status: string; result?: any }>(
      `${API_BASE_URL}/workflows/${workflowId}`
    ),
};

export interface SupplierSearchResultItem {
  title: string;
  source_name: string;
  url: string;
  price_text?: string | null;
  price_numeric?: number | null;
  currency: string;
  thumbnail?: string | null;
  retrieved_at: string;
  rating?: number | null;
  reviews?: number | null;
}

export interface SupplierSearchResponse {
  configured: boolean;
  query: string;
  location?: string | null;
  results: SupplierSearchResultItem[];
  cached: boolean;
  error?: string | null;
  retrieved_at?: string | null;
}

export interface PriceHistoryItem {
  captured_at: string;
  source_name: string;
  product_title: string;
  price_numeric?: number | null;
  currency: string;
  original_price_text?: string | null;
  source_url?: string | null;
}

export interface PriceHistoryResponse {
  configured: boolean;
  ingredient_name: string;
  days: number;
  history: PriceHistoryItem[];
  message?: string;
}

export interface PriceSummaryResponse {
  configured: boolean;
  items: Array<{
    ingredient_key: string;
    snapshot_count: number;
    min_price?: number | null;
    avg_price?: number | null;
    max_price?: number | null;
    latest_captured_at?: string | null;
  }>;
  error?: string;
}

export interface WorkflowTriggerResponse {
  orchestrator: string;
  temporal_active: boolean;
  workflow_id: string;
  run_id?: string;
  status?: string;
  message?: string;
  error?: string;
}
