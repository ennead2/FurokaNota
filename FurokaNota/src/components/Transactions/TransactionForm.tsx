import { useState, useEffect } from 'react';
import type { Transaction, Category } from '../../types';
import { categoryService } from '../../services/db';

interface Props {
  initial?: Partial<Transaction>;
  onSubmit: (t: Omit<Transaction, 'id'>) => void;
  onCancel: () => void;
}

export function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [type, setType] = useState<'income' | 'expense'>(initial?.type ?? 'expense');
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(initial?.amount?.toString() ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  useEffect(() => {
    // Don't reset before categories are loaded from DB
    if (categories.length === 0) return;
    const filtered = categories.filter(c => c.type === type);
    if (!filtered.find(c => c.name === category)) {
      setCategory(filtered[0]?.name ?? '');
    }
  }, [type, categories, category]);

  const filtered = categories.filter(c => c.type === type);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      date,
      type,
      amount: Number(amount),
      category,
      note,
      createdAt: Date.now(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            type === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setType('expense')}
        >
          支出
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            type === 'income'
              ? 'bg-emerald-500 text-white'
              : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          onClick={() => setType('income')}
        >
          収入
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">日付</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">金額 (円)</label>
        <input
          type="number"
          min={1}
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          required
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          {filtered.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="任意のメモ"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </form>
  );
}
