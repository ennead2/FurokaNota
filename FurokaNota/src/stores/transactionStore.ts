import { create } from 'zustand';
import type { Transaction } from '../types';
import { transactionService } from '../services/db';

interface TransactionState {
  transactions: Transaction[];
  loading: boolean;
  fetchAll: () => Promise<void>;
  addTransaction: (t: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: number, changes: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: [],
  loading: false,

  fetchAll: async () => {
    set({ loading: true });
    const transactions = await transactionService.getAll();
    set({ transactions, loading: false });
  },

  addTransaction: async (t) => {
    await transactionService.add(t);
    const transactions = await transactionService.getAll();
    set({ transactions });
  },

  updateTransaction: async (id, changes) => {
    await transactionService.update(id, changes);
    const transactions = await transactionService.getAll();
    set({ transactions });
  },

  deleteTransaction: async (id) => {
    await transactionService.delete(id);
    const transactions = await transactionService.getAll();
    set({ transactions });
  },
}));
