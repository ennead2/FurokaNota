import { useState } from 'react';
import type { Transaction } from '../../types';
import { TransactionForm } from './TransactionForm';
import { useTransactionStore } from '../../stores/transactionStore';
import { exportTransactionsToCSV, parseTransactionsFromCSV } from '../../services/export';
import { TransactionFilter } from './TransactionFilter';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

export function TransactionList() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactionStore();

  const today = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(today);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = transactions.filter(t => {
    const matchMonth = month ? t.date.startsWith(month) : true;
    const q = search.toLowerCase();
    const matchSearch = q
      ? t.category.toLowerCase().includes(q) || t.note.toLowerCase().includes(q)
      : true;
    return matchMonth && matchSearch;
  });

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const rows = await parseTransactionsFromCSV(file);
      for (const row of rows) {
        await addTransaction(row);
      }
      alert(`${rows.length} 件インポートしました`);
    } catch {
      alert('CSVの読み込みに失敗しました');
    }
    e.target.value = '';
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <TransactionFilter
          month={month}
          search={search}
          onMonthChange={setMonth}
          onSearchChange={setSearch}
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => exportTransactionsToCSV(filtered)}
            className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            CSV出力
          </button>
          <label className="px-3 py-2 text-sm bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer">
            CSVインポート
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
          </label>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            + 追加
          </button>
        </div>
      </div>

      {/* Form modal */}
      {(showForm || editing) && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="font-semibold text-slate-800 mb-4">
              {editing ? '収支を編集' : '収支を追加'}
            </h3>
            <TransactionForm
              initial={editing ?? undefined}
              onSubmit={async (t) => {
                if (editing?.id) {
                  await updateTransaction(editing.id, t);
                } else {
                  await addTransaction(t);
                }
                setShowForm(false);
                setEditing(null);
              }}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="text-center text-slate-400 py-12">データがありません</p>
        )}
        {filtered.map(t => (
          <div
            key={t.id}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-4"
          >
            <div className={`w-2 h-10 rounded-full ${t.type === 'income' ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{t.category}</p>
              {t.note && <p className="text-xs text-slate-400 truncate">{t.note}</p>}
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap">{t.date}</span>
            <span className={`font-semibold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
              {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => { setEditing(t); setShowForm(false); }}
                className="text-slate-400 hover:text-slate-700 p-1 text-xs"
              >
                編集
              </button>
              <button
                onClick={() => {
                  if (confirm('削除しますか？')) deleteTransaction(t.id!);
                }}
                className="text-slate-400 hover:text-red-500 p-1 text-xs"
              >
                削除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
