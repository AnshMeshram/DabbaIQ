/**
 * Zod validation schemas for DabbaIQ frontend.
 * Provides runtime validation for forms, mutations, and API responses.
 */

import { z } from 'zod';

export const ingredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required').max(100),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.enum(['kg', 'g', 'L', 'ml', 'pieces']),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative'),
  cost_per_unit: z.number().min(0, 'Cost cannot be negative'),
  expiry_date: z.string().nullable().optional(),
});

export const saleSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  meal_period: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']),
  recipe_id: z.string().min(1, 'Recipe must be selected'),
  portions_sold: z.number().int().positive('Portions sold must be at least 1'),
  revenue: z.number().min(0, 'Revenue cannot be negative').optional(),
});

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().min(1, 'Ingredient required'),
  quantity_per_portion: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit required'),
});

export const recipeSchema = z.object({
  name: z.string().min(1, 'Recipe name is required').max(100),
  meal_category: z.enum(['main', 'side', 'bread', 'rice', 'dessert', 'beverage', 'snack']),
  ingredients: z.array(recipeIngredientSchema).min(1, 'At least one ingredient required'),
  prep_notes: z.string().optional(),
  dietary_labels: z.array(z.string()).default([]),
});

export const planRequestSchema = z.object({
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD)'),
  meal_period: z.enum(['breakfast', 'lunch', 'dinner', 'snacks']),
  recipe_ids: z.array(z.string()).min(1, 'Select at least one recipe'),
  safety_buffer: z.number().min(0).max(1).optional(),
});

export const supplierSearchRequestSchema = z.object({
  ingredient_name: z.string().min(1, 'Ingredient name is required').max(100),
  package_quantity: z.number().positive().optional(),
  package_unit: z.string().max(20).optional(),
  location: z.string().max(100).optional(),
});

export const supplierSearchResultSchema = z.object({
  title: z.string(),
  source_name: z.string(),
  url: z.string(),
  price_text: z.string().nullable().optional(),
  price_numeric: z.number().nullable().optional(),
  currency: z.string().default('INR'),
  thumbnail: z.string().nullable().optional(),
  retrieved_at: z.string(),
  rating: z.number().nullable().optional(),
  reviews: z.number().nullable().optional(),
});
