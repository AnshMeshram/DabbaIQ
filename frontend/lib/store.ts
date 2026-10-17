/**
 * Zustand global UI state for DabbaIQ.
 * Manages transient UI state: selected date, meal period, supplier modal, comparison selection.
 * Business records and persistence remain strictly handled via FastAPI & MongoDB.
 */

import { create } from 'zustand';
import { SupplierSearchResultItem } from './api';

interface UIState {
  // Selected context
  selectedDate: string;
  selectedMealPeriod: string;
  setSelectedDate: (date: string) => void;
  setSelectedMealPeriod: (period: string) => void;

  // Filter state
  plannerFilterCategory: string;
  setPlannerFilterCategory: (category: string) => void;

  // Supplier Search & Price Comparison Modal
  supplierModalOpen: boolean;
  activeSearchIngredient: string;
  comparisonItems: SupplierSearchResultItem[];
  openSupplierSearch: (ingredientName: string) => void;
  closeSupplierSearch: () => void;
  toggleComparisonItem: (item: SupplierSearchResultItem) => void;
  clearComparison: () => void;

  // Temporal Workflow progress
  activeWorkflowId: string | null;
  workflowStatus: string | null;
  setWorkflowState: (id: string | null, status: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedDate: new Date().toISOString().split('T')[0],
  selectedMealPeriod: 'lunch',
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setSelectedMealPeriod: (selectedMealPeriod) => set({ selectedMealPeriod }),

  plannerFilterCategory: 'all',
  setPlannerFilterCategory: (plannerFilterCategory) => set({ plannerFilterCategory }),

  supplierModalOpen: false,
  activeSearchIngredient: '',
  comparisonItems: [],
  openSupplierSearch: (activeSearchIngredient) =>
    set({ supplierModalOpen: true, activeSearchIngredient }),
  closeSupplierSearch: () =>
    set({ supplierModalOpen: false, activeSearchIngredient: '', comparisonItems: [] }),
  toggleComparisonItem: (item) =>
    set((state) => {
      const exists = state.comparisonItems.some((i) => i.url === item.url && i.title === item.title);
      if (exists) {
        return {
          comparisonItems: state.comparisonItems.filter(
            (i) => !(i.url === item.url && i.title === item.title)
          ),
        };
      }
      return { comparisonItems: [...state.comparisonItems, item] };
    }),
  clearComparison: () => set({ comparisonItems: [] }),

  activeWorkflowId: null,
  workflowStatus: null,
  setWorkflowState: (activeWorkflowId, workflowStatus) => set({ activeWorkflowId, workflowStatus }),
}));
