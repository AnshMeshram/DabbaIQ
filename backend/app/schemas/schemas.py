"""Pydantic schemas for DabbaIQ data validation."""

from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from enum import Enum


# ─── Enums ───────────────────────────────────────────────────────────────────

class MealPeriod(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACKS = "snacks"


class Unit(str, Enum):
    KG = "kg"
    G = "g"
    L = "L"
    ML = "ml"
    PIECES = "pieces"


class MealCategory(str, Enum):
    MAIN = "main"
    SIDE = "side"
    BREAD = "bread"
    RICE = "rice"
    DESSERT = "dessert"
    BEVERAGE = "beverage"
    SNACK = "snack"


UNIT_CONVERSIONS = {
    ("kg", "g"): 1000,
    ("g", "kg"): 0.001,
    ("L", "ml"): 1000,
    ("ml", "L"): 0.001,
}


def units_compatible(unit_a: str, unit_b: str) -> bool:
    """Check if two units are compatible (same or convertible)."""
    if unit_a == unit_b:
        return True
    return (unit_a, unit_b) in UNIT_CONVERSIONS


def convert_units(value: float, from_unit: str, to_unit: str) -> float:
    """Convert between compatible units."""
    if from_unit == to_unit:
        return value
    factor = UNIT_CONVERSIONS.get((from_unit, to_unit))
    if factor is None:
        raise ValueError(f"Cannot convert from {from_unit} to {to_unit}")
    return value * factor


# ─── Ingredient Schemas ──────────────────────────────────────────────────────

class IngredientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(default="general", max_length=50)
    quantity: float = Field(..., ge=0)
    unit: Unit
    reorder_level: float = Field(default=0, ge=0)
    cost_per_unit: float = Field(..., ge=0, description="Cost per unit (e.g., per kg, per piece)")
    expiry_date: Optional[date] = None

    @field_validator("name")
    @classmethod
    def name_strip(cls, v: str) -> str:
        return v.strip().lower()


class IngredientCreate(IngredientBase):
    pass


class IngredientUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=50)
    quantity: Optional[float] = Field(None, ge=0)
    unit: Optional[Unit] = None
    reorder_level: Optional[float] = Field(None, ge=0)
    cost_per_unit: Optional[float] = Field(None, ge=0)
    expiry_date: Optional[date] = None


class IngredientResponse(IngredientBase):
    id: str
    is_low_stock: bool = False
    is_expiring: bool = False
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime


# ─── Recipe Schemas ──────────────────────────────────────────────────────────

class RecipeIngredient(BaseModel):
    ingredient_id: str
    ingredient_name: str = ""
    quantity_per_portion: float = Field(..., gt=0)
    unit: Unit


class RecipeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    meal_category: MealCategory
    ingredients: List[RecipeIngredient] = Field(..., min_length=1)
    prep_notes: Optional[str] = None
    dietary_labels: List[str] = Field(default_factory=list)

    @field_validator("name")
    @classmethod
    def name_strip(cls, v: str) -> str:
        return v.strip()


class RecipeCreate(RecipeBase):
    pass


class RecipeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    meal_category: Optional[MealCategory] = None
    ingredients: Optional[List[RecipeIngredient]] = None
    prep_notes: Optional[str] = None
    dietary_labels: Optional[List[str]] = None


class RecipeResponse(RecipeBase):
    id: str
    estimated_cost_per_portion: float = 0.0
    is_demo: bool = False
    created_at: datetime
    updated_at: datetime


# ─── Sales Schemas ───────────────────────────────────────────────────────────

class SaleBase(BaseModel):
    date: date
    meal_period: MealPeriod
    recipe_id: str
    recipe_name: str = ""
    portions_sold: int = Field(..., gt=0)
    revenue: Optional[float] = Field(None, ge=0)


class SaleCreate(SaleBase):
    pass


class SaleUpdate(BaseModel):
    date: Optional[date] = None
    meal_period: Optional[MealPeriod] = None
    recipe_id: Optional[str] = None
    recipe_name: Optional[str] = None
    portions_sold: Optional[int] = Field(None, gt=0)
    revenue: Optional[float] = Field(None, ge=0)


class SaleResponse(SaleBase):
    id: str
    is_demo: bool = False
    created_at: datetime


# ─── Waste Schemas ───────────────────────────────────────────────────────────

class WasteBase(BaseModel):
    date: date
    meal_period: MealPeriod
    recipe_id: str
    recipe_name: str = ""
    portions_prepared: int = Field(..., gt=0)
    portions_sold: int = Field(..., ge=0)
    reason: Optional[str] = None

    @field_validator("portions_sold")
    @classmethod
    def sold_lte_prepared(cls, v, info):
        if "portions_prepared" in info.data and v > info.data["portions_prepared"]:
            raise ValueError("Portions sold cannot exceed portions prepared")
        return v


class WasteCreate(WasteBase):
    pass


class WasteResponse(WasteBase):
    id: str
    leftover_portions: int = 0
    estimated_waste_cost: float = 0.0
    is_demo: bool = False
    created_at: datetime


# ─── Plan Schemas ────────────────────────────────────────────────────────────

class PlanRecipeItem(BaseModel):
    recipe_id: str
    recipe_name: str = ""
    forecast_portions: int = Field(..., ge=0)
    confirmed_orders: int = Field(default=0, ge=0)
    buffer_portions: int = Field(default=0, ge=0)
    total_portions: int = Field(default=0, ge=0)


class ShoppingItem(BaseModel):
    ingredient_id: str
    ingredient_name: str
    required_qty: float
    available_qty: float
    shortage_qty: float
    unit: str
    estimated_cost: float


class PlanGenerateRequest(BaseModel):
    target_date: date
    meal_period: MealPeriod
    recipe_ids: List[str] = Field(default_factory=list)
    confirmed_orders: dict[str, int] = Field(default_factory=dict)
    safety_buffer: Optional[float] = None
    kitchen_notes: Optional[str] = None


class ForecastDetail(BaseModel):
    recipe_id: str
    recipe_name: str
    method: str
    observations_used: int
    baseline_forecast: int
    explanation: str


class PlanResponse(BaseModel):
    id: str
    target_date: date
    meal_period: MealPeriod
    recipes: List[PlanRecipeItem]
    shopping_list: List[ShoppingItem]
    forecasts: List[ForecastDetail]
    estimated_total_cost: float
    ai_recommendation: Optional[str] = None
    ai_menu_suggestion: Optional[str] = None
    is_confirmed: bool = False
    created_at: datetime


# ─── AI Schemas ──────────────────────────────────────────────────────────────

class AIMenuSuggestion(BaseModel):
    """Validated schema for AI menu suggestions."""
    recommended_recipes: List[str] = Field(
        default_factory=list,
        description="List of recipe IDs from existing recipes"
    )
    explanation: str = Field(
        default="",
        description="Plain-language explanation of the recommendation"
    )
    notes_interpretation: Optional[str] = Field(
        None,
        description="Interpretation of free-text kitchen notes"
    )
    menu_description: Optional[str] = Field(
        None,
        description="Optional menu description"
    )


class AIKitchenNoteParsed(BaseModel):
    """Parsed kitchen note entry for user confirmation."""
    date: Optional[str] = None
    meal_period: Optional[str] = None
    recipe_name: Optional[str] = None
    portions: Optional[int] = None
    revenue: Optional[float] = None
    confidence: float = Field(default=0.5, ge=0, le=1)
    original_text: str = ""


class AIParseResponse(BaseModel):
    """Response from AI kitchen notes parsing."""
    entries: List[AIKitchenNoteParsed] = Field(default_factory=list)
    unparseable_text: Optional[str] = None


# ─── Dashboard Schemas ───────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    date: date
    expected_portions: int = 0
    recorded_sales: int = 0
    total_revenue: float = 0.0
    low_stock_items: List[dict] = Field(default_factory=list)
    expiring_items: List[dict] = Field(default_factory=list)
    leftover_portions: int = 0
    estimated_waste_cost: float = 0.0
    sales_chart_data: List[dict] = Field(default_factory=list)
    next_plan: Optional[dict] = None
    db_connected: bool = False


# ─── Report Schemas ──────────────────────────────────────────────────────────

class ReportSummary(BaseModel):
    start_date: date
    end_date: date
    total_sales_portions: int = 0
    total_revenue: float = 0.0
    estimated_ingredient_cost: float = 0.0
    total_waste_portions: int = 0
    estimated_waste_cost: float = 0.0
    restock_items: List[dict] = Field(default_factory=list)
    daily_breakdown: List[dict] = Field(default_factory=list)
    meal_summaries: List[dict] = Field(default_factory=list)


# ─── Health / Status ─────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str = "ok"
    app_name: str = "DabbaIQ"
    version: str
    db_connected: bool
    db_message: str = ""


class AIStatusResponse(BaseModel):
    available: bool
    model: str
    base_url: str
    message: str = ""


# ─── Supplier Search (SerpAPI) & Market Pricing ────────────────────────────

class SupplierSearchRequest(BaseModel):
    ingredient_name: str = Field(..., min_length=1, max_length=100, description="Ingredient to search prices for")
    package_quantity: Optional[float] = Field(None, gt=0, description="Optional package quantity")
    package_unit: Optional[str] = Field(None, max_length=20, description="Unit e.g. kg, L, pieces")
    location: Optional[str] = Field(None, max_length=100, description="Target city/region")


class SupplierSearchResultItem(BaseModel):
    title: str
    source_name: str
    url: str
    price_text: Optional[str] = None
    price_numeric: Optional[float] = None
    currency: str = "INR"
    thumbnail: Optional[str] = None
    retrieved_at: str
    rating: Optional[float] = None
    reviews: Optional[int] = None


class SupplierSearchResponse(BaseModel):
    configured: bool
    query: str
    location: Optional[str] = None
    results: List[SupplierSearchResultItem] = Field(default_factory=list)
    cached: bool = False
    error: Optional[str] = None
    retrieved_at: Optional[str] = None


# ─── Tiger Data (TimescaleDB) Price Snapshots ──────────────────────────────

class PriceSnapshotSaveRequest(BaseModel):
    ingredient_name: str = Field(..., min_length=1, max_length=100)
    ingredient_id: Optional[str] = None
    source_name: str = Field(..., min_length=1, max_length=200)
    product_title: str = Field(..., min_length=1)
    price_numeric: Optional[float] = None
    currency: str = Field(default="INR", max_length=10)
    original_price_text: Optional[str] = None
    source_url: Optional[str] = None
    query_text: Optional[str] = None


# ─── Temporal Workflow Orchestration ───────────────────────────────────────

class WorkflowTriggerRequest(BaseModel):
    target_date: str = Field(..., description="Target date YYYY-MM-DD")
    meal_period: str = Field(default="lunch", description="Target meal period (lunch, dinner, etc.)")
