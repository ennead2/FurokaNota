import { useState, useEffect } from 'react';
import type { Category, RecurringTransaction } from '../../types';
import { categoryService } from '../../services/db';
import { useRecurringStore } from '../../stores/recurringStore';
import { useTransactionStore } from '../../stores/transactionStore';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

const EMPTY_FORM = {
  name: '',
  type: 'expense' as 'income' | 'expense',
  amount: '',
  category: '',
  dayOfMonth: '1',
  note: '',
};

export function RecurringSettings() {
  const { recurringTransactions, addRecurring, updateRecurring, deleteRecurring, toggleActive } =
    useRecurringStore();
  const { fetchAll: refetchTransactions } = useTransactionStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  // Keep category in sync when type changes
  useEffect(() => {
    const filtered = categories.filter(c => c.type === form.type);
    if (filtered.length > 0 && !filtered.find(c => c.name === form.category)) {
      setForm(f => ({ ...f, category: filtered[0].name }));
    }
  }, [form.type, categories]);

  const filteredCategories = categories.filter(c => c.type === form.type);

  function openAdd() {
    const defaultCat = categories.filter(c => c.type === 'expense')[0]?.name ?? '';
    setForm({ ...EMPTY_FORM, category: defaultCat });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(r: RecurringTransaction) {
    setForm({
      name: r.name,
      type: r.type,
      amount: String(r.amount),
      category: r.category,
      dayOfMonth: String(r.dayOfMonth),
      note: r.note,
    });
    setEditingId(r.id ?? null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Omit<RecurringTransaction, 'id'> = {
      name: form.name,
      type: form.type,
      amount: Number(form.amount),
      category: form.category,
      dayOfMonth: Number(form.dayOfMonth),
      note: form.note,
      isActive: true,
    };

    if (editingId !== null) {
      await updateRecurring(editingId, data);
    } else {
      await addRecurring(data);
    }
    // Refresh transactions in case auto-generation runs next mount
    await refetchTransactions();
    closeForm();
  }

  async function handleDelete(id: number) {
    if (!confirm('この定期項目を削除しますか？\n（生成済みのトランザクションは残ります）')) return;
    await deleteRecurring(id);
    await refetchTransactions();
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          設定した項目は毎月指定日に自動でトランザクションが生成されます。
        </p>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors whitespace-nowrap"
        >
          + 追加
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-slate-800 mb-5">
              {editingId !== null ? '定期項目を編集' : '定期項目を追加'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 収入/支出 toggle */}
              <div className="flex rounded-lg overflow-hidden border border-slate-200">
                {(['expense', 'income'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, type: t }))}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      form.type === t
                        ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'expense' ? '支出' : '収入'}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">項目名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="家賃、電気代、給与 など"
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">金額 (円)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0"
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">毎月何日</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={form.dayOfMonth}
                    onChange={e => setForm(f => ({ ...f, dayOfMonth: e.target.value }))}
                    required
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">カテゴリ</label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  required
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  {filteredCategories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">メモ</label>
                <input
                  type="text"
                  value={form.note}
                  onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                  placeholder="任意のメモ"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List */}
      {recurringTransactions.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          定期項目がありません。「+ 追加」から登録してください。
        </div>
      ) : (
        <div className="space-y-3">
          {recurringTransactions.map(r => (
            <div
              key={r.id}
              className={`bg-white rounded-xl border px-4 py-4 flex items-center gap-4 transition-opacity ${
                r.isActive ? 'border-slate-200' : 'border-slate-100 opacity-50'
              }`}
            >
              {/* Type indicator */}
              <div
                className={`w-1.5 h-12 rounded-full flex-shrink-0 ${
                  r.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'
                }`}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{r.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {r.category}　毎月 {r.dayOfMonth} 日
                  {r.note && `　${r.note}`}
                </p>
              </div>

              {/* Amount */}
              <span
                className={`text-base font-bold whitespace-nowrap ${
                  r.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
              </span>

              {/* Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Toggle switch */}
                <button
                  onClick={() => r.id !== undefined && toggleActive(r.id, !r.isActive)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    r.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={r.isActive ? '無効にする' : '有効にする'}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      r.isActive ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <button
                  onClick={() => openEdit(r)}
                  className="text-xs text-slate-400 hover:text-slate-700 px-1"
                >
                  編集
                </button>
                <button
                  onClick={() => r.id !== undefined && handleDelete(r.id)}
                  className="text-xs text-slate-400 hover:text-red-500 px-1"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      {recurringTransactions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-600">
          アプリを開いた際に、有効な定期項目の当月分がまだ生成されていない場合は自動で追加されます。
          生成されたトランザクションは「収支一覧」で確認・編集できます。
        </div>
      )}
    </div>
  );
}
