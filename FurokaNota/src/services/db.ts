import Dexie, { type Table } from 'dexie';
import type { Transaction, Category, Budget, RecurringTransaction } from '../types';

class FurokaNoteDB extends Dexie {
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  budgets!: Table<Budget>;
  recurringTransactions!: Table<RecurringTransaction>;

  constructor() {
    super('FurokaNota');
    this.version(1).stores({
      transactions: '++id, date, type, category, createdAt',
      categories: '++id, name, type',
      budgets: '++id, categoryName, month',
    });
    // v2: add recurringTransactions table + recurringId index on transactions
    this.version(2).stores({
      transactions: '++id, date, type, category, createdAt, recurringId',
      categories: '++id, name, type',
      budgets: '++id, categoryName, month',
      recurringTransactions: '++id, isActive',
    });
  }
}

export const db = new FurokaNoteDB();

// ---------------------------------------------------------------------------
// Default category seeding
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: '食費', type: 'expense', color: '#ef4444' },
  { name: '交通費', type: 'expense', color: '#f97316' },
  { name: '娯楽', type: 'expense', color: '#a855f7' },
  { name: '日用品', type: 'expense', color: '#3b82f6' },
  { name: '医療', type: 'expense', color: '#06b6d4' },
  { name: '光熱費', type: 'expense', color: '#eab308' },
  { name: '通信費', type: 'expense', color: '#84cc16' },
  { name: '家賃', type: 'expense', color: '#8b5cf6' },
  { name: 'その他支出', type: 'expense', color: '#6b7280' },
  { name: '給与', type: 'income', color: '#22c55e' },
  { name: '副収入', type: 'income', color: '#10b981' },
  { name: 'その他収入', type: 'income', color: '#14b8a6' },
];

// Module-level promise ensures concurrent calls (e.g. React StrictMode double-invoke) only seed once
let _seedPromise: Promise<void> | null = null;

export function seedDefaultCategories(): Promise<void> {
  if (!_seedPromise) {
    _seedPromise = (async () => {
      const all = await db.categories.toArray();
      if (all.length === 0) {
        await db.categories.bulkAdd(DEFAULT_CATEGORIES as Category[]);
        return;
      }

      // Deduplicate: keep only the first occurrence of each name
      const seen = new Set<string>();
      const duplicateIds: number[] = [];
      for (const cat of all) {
        if (seen.has(cat.name)) {
          if (cat.id !== undefined) duplicateIds.push(cat.id);
        } else {
          seen.add(cat.name);
        }
      }
      if (duplicateIds.length > 0) {
        await db.categories.bulkDelete(duplicateIds);
      }

      // Add any default categories that are missing from the DB
      const missing = DEFAULT_CATEGORIES.filter(d => !seen.has(d.name));
      if (missing.length > 0) {
        await db.categories.bulkAdd(missing as Category[]);
      }
    })();
  }
  return _seedPromise;
}

// ---------------------------------------------------------------------------
// Recurring transaction auto-generation
// ---------------------------------------------------------------------------

/** Returns YYYY-MM-DD for a recurring rule in a given month, capped to the last day. */
function resolveDate(year: number, month: number, day: number): string {
  const lastDay = new Date(year, month, 0).getDate(); // day=0 of next month = last day of this month
  const d = Math.min(day, lastDay);
  const mm = String(month).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

let _generatePromise: Promise<void> | null = null;

/**
 * For each active RecurringTransaction, create a Transaction for the current month
 * if one hasn't been created yet (idempotent — checked via recurringId + month).
 */
export function generateRecurringForCurrentMonth(): Promise<void> {
  if (!_generatePromise) {
    _generatePromise = (async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1; // 1-indexed
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const rules = await db.recurringTransactions
        .filter(r => r.isActive)
        .toArray();

      for (const rule of rules) {
        if (rule.id === undefined) continue;

        // Check if already generated for this month
        const existing = await db.transactions
          .filter(t => t.recurringId === rule.id && t.date.startsWith(monthStr))
          .first();
        if (existing) continue;

        const date = resolveDate(year, month, rule.dayOfMonth);
        await db.transactions.add({
          date,
          type: rule.type,
          amount: rule.amount,
          category: rule.category,
          note: rule.note || rule.name,
          createdAt: Date.now(),
          recurringId: rule.id,
        } as Transaction);
      }
    })();
  }
  return _generatePromise;
}

// ---------------------------------------------------------------------------
// Transaction CRUD
// ---------------------------------------------------------------------------

export const transactionService = {
  getAll: () => db.transactions.orderBy('date').reverse().toArray(),
  getByMonth: (month: string) =>
    db.transactions.filter(t => t.date.startsWith(month)).toArray(),
  add: (t: Omit<Transaction, 'id'>) => db.transactions.add(t as Transaction),
  update: (id: number, changes: Partial<Transaction>) =>
    db.transactions.update(id, changes),
  delete: (id: number) => db.transactions.delete(id),
};

// ---------------------------------------------------------------------------
// Category CRUD
// ---------------------------------------------------------------------------

/** Sort categories by DEFAULT_CATEGORIES order; user-added categories go last. */
function sortCategories(cats: Category[]): Category[] {
  const orderMap = new Map(DEFAULT_CATEGORIES.map((c, i) => [c.name, i]));
  return [...cats].sort((a, b) => {
    const ia = orderMap.get(a.name) ?? Infinity;
    const ib = orderMap.get(b.name) ?? Infinity;
    return ia - ib;
  });
}

export const categoryService = {
  getAll: () => db.categories.toArray().then(sortCategories),
  getByType: (type: 'income' | 'expense') =>
    db.categories.filter(c => c.type === type).toArray().then(sortCategories),
  add: (c: Omit<Category, 'id'>) => db.categories.add(c as Category),
  update: (id: number, changes: Partial<Category>) =>
    db.categories.update(id, changes),
  delete: (id: number) => db.categories.delete(id),
};

// ---------------------------------------------------------------------------
// Budget CRUD
// ---------------------------------------------------------------------------

export const budgetService = {
  getAll: () => db.budgets.toArray(),
  getByMonth: (month: string) =>
    db.budgets.filter(b => b.month === month).toArray(),
  upsert: async (budget: Omit<Budget, 'id'>) => {
    const existing = await db.budgets
      .filter(b => b.categoryName === budget.categoryName && b.month === budget.month)
      .first();
    if (existing?.id) {
      await db.budgets.update(existing.id, { limit: budget.limit });
    } else {
      await db.budgets.add(budget as Budget);
    }
  },
  delete: (id: number) => db.budgets.delete(id),
};

// ---------------------------------------------------------------------------
// RecurringTransaction CRUD
// ---------------------------------------------------------------------------

export const recurringService = {
  getAll: () => db.recurringTransactions.toArray(),
  add: (r: Omit<RecurringTransaction, 'id'>) =>
    db.recurringTransactions.add(r as RecurringTransaction),
  update: (id: number, changes: Partial<RecurringTransaction>) =>
    db.recurringTransactions.update(id, changes),
  delete: async (id: number) => {
    // Remove the rule; leave generated transactions intact but clear their recurringId
    await db.transactions
      .filter(t => t.recurringId === id)
      .modify({ recurringId: undefined });
    await db.recurringTransactions.delete(id);
  },
};
