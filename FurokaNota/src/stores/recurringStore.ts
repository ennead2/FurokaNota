import { create } from 'zustand';
import type { RecurringTransaction } from '../types';
import { recurringService } from '../services/db';

interface RecurringState {
  recurringTransactions: RecurringTransaction[];
  fetchAll: () => Promise<void>;
  addRecurring: (r: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  updateRecurring: (id: number, changes: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: number) => Promise<void>;
  toggleActive: (id: number, isActive: boolean) => Promise<void>;
}

export const useRecurringStore = create<RecurringState>((set) => ({
  recurringTransactions: [],

  fetchAll: async () => {
    const recurringTransactions = await recurringService.getAll();
    set({ recurringTransactions });
  },

  addRecurring: async (r) => {
    await recurringService.add(r);
    const recurringTransactions = await recurringService.getAll();
    set({ recurringTransactions });
  },

  updateRecurring: async (id, changes) => {
    await recurringService.update(id, changes);
    const recurringTransactions = await recurringService.getAll();
    set({ recurringTransactions });
  },

  deleteRecurring: async (id) => {
    await recurringService.delete(id);
    const recurringTransactions = await recurringService.getAll();
    set({ recurringTransactions });
  },

  toggleActive: async (id, isActive) => {
    await recurringService.update(id, { isActive });
    const recurringTransactions = await recurringService.getAll();
    set({ recurringTransactions });
  },
}));
