export interface Transaction {
  id?: number;
  date: string;          // YYYY-MM-DD
  type: 'income' | 'expense';
  amount: number;
  category: string;
  note: string;
  createdAt: number;
  recurringId?: number;  // set when auto-generated from a RecurringTransaction
}

export interface Category {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export interface Budget {
  id?: number;
  categoryName: string;
  month: string;         // YYYY-MM
  limit: number;
}

export interface RecurringTransaction {
  id?: number;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  dayOfMonth: number;   // 1–31 (capped to last day of month when generating)
  note: string;
  isActive: boolean;
}
