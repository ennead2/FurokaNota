import { useState } from 'react';
import { useTransactionStore } from '../../stores/transactionStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { MonthlyBar } from '../Charts/MonthlyBar';
import { CategoryPie } from '../Charts/CategoryPie';
import { TrendLine } from '../Charts/TrendLine';
import { BudgetAlerts } from './BudgetAlerts';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount);
}

export function Dashboard() {
  const { transactions } = useTransactionStore();
  const { budgets } = useBudgetStore();
  // Use local time to avoid UTC offset shifting the month (e.g. JST+9)
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [month, setMonth] = useState(today);

  const monthTx = transactions.filter(t => t.date.startsWith(month));
  const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600 font-medium">表示月</label>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-emerald-50 rounded-2xl p-4 md:p-5 border border-emerald-100">
          <p className="text-xs text-emerald-600 font-medium mb-1">収入</p>
          <p className="text-xl md:text-2xl font-bold text-emerald-700">{formatCurrency(income)}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 md:p-5 border border-red-100">
          <p className="text-xs text-red-500 font-medium mb-1">支出</p>
          <p className="text-xl md:text-2xl font-bold text-red-600">{formatCurrency(expense)}</p>
        </div>
        <div className={`rounded-2xl p-4 md:p-5 border ${balance >= 0 ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
          <p className="text-xs text-slate-500 font-medium mb-1">収支</p>
          <p className={`text-xl md:text-2xl font-bold ${balance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
            {formatCurrency(balance)}
          </p>
        </div>
      </div>

      {/* Budget alerts */}
      {budgets.some(b => b.month === month) && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3">予算状況</h3>
          <BudgetAlerts budgets={budgets} transactions={transactions} month={month} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">月次収支 (直近12ヶ月)</h3>
          <MonthlyBar transactions={transactions} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">カテゴリ別支出 ({month})</h3>
          <CategoryPie transactions={transactions} month={month} />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">収支推移 (直近12ヶ月)</h3>
        <TrendLine transactions={transactions} />
      </div>
    </div>
  );
}
