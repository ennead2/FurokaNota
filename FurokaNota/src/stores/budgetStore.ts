import { create } from 'zustand';
import type { Budget } from '../types';
import { budgetService } from '../services/db';

interface BudgetState {
  budgets: Budget[];
  fetchAll: () => Promise<void>;
  upsertBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
  deleteBudget: (id: number) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set) => ({
  budgets: [],

  fetchAll: async () => {
    const budgets = await budgetService.getAll();
    set({ budgets });
  },

  upsertBudget: async (b) => {
    await budgetService.upsert(b);
    const budgets = await budgetService.getAll();
    set({ budgets });
  },

  deleteBudget: async (id) => {
    await budgetService.delete(id);
    const budgets = await budgetService.getAll();
    set({ budgets });
  },
}));
