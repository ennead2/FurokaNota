import { useState, useEffect } from 'react';
import type { Category } from '../../types';
import { categoryService } from '../../services/db';
import { useBudgetStore } from '../../stores/budgetStore';
import { BudgetAlerts } from '../Dashboard/BudgetAlerts';
import { useTransactionStore } from '../../stores/transactionStore';

export function BudgetSettings() {
  const { budgets, upsertBudget, deleteBudget } = useBudgetStore();
  const { transactions } = useTransactionStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const today = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(today);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitInput, setLimitInput] = useState('');

  // Fetch expense categories once on mount
  useEffect(() => {
    categoryService.getByType('expense').then(setCategories);
  }, []);

  // Set default selection when categories first load
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].name);
    }
  }, [categories, selectedCategory]);

  const monthBudgets = budgets.filter(b => b.month === month);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory || !limitInput) return;
    await upsertBudget({
      categoryName: selectedCategory,
      month,
      limit: Number(limitInput),
    });
    setLimitInput('');
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">設定月</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Add budget form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">予算を追加</h3>
        <form onSubmit={handleAdd} className="flex gap-3 flex-wrap">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            value={limitInput}
            onChange={e => setLimitInput(e.target.value)}
            placeholder="上限金額 (円)"
            required
            className="flex-1 min-w-40 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors"
          >
            設定
          </button>
        </form>
      </div>

      {/* Current budgets */}
      {monthBudgets.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">{month} の予算一覧</h3>
          {monthBudgets.map(b => (
            <div key={b.id} className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3">
              <span className="text-sm font-medium text-slate-700">{b.categoryName}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">¥{b.limit.toLocaleString()}</span>
                <button
                  onClick={() => b.id && deleteBudget(b.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget progress */}
      {monthBudgets.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">使用状況</h3>
          <BudgetAlerts budgets={budgets} transactions={transactions} month={month} />
        </div>
      )}
    </div>
  );
}
