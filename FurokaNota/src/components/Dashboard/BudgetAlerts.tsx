import type { Budget, Transaction } from '../../types';

interface Props {
  budgets: Budget[];
  transactions: Transaction[];
  month: string;
}

export function BudgetAlerts({ budgets, transactions, month }: Props) {
  const monthBudgets = budgets.filter(b => b.month === month);
  if (monthBudgets.length === 0) return null;

  const spendingByCategory: Record<string, number> = {};
  transactions
    .filter(t => t.date.startsWith(month) && t.type === 'expense')
    .forEach(t => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] ?? 0) + t.amount;
    });

  return (
    <div className="space-y-3">
      {monthBudgets.map(b => {
        const spent = spendingByCategory[b.categoryName] ?? 0;
        const pct = Math.min((spent / b.limit) * 100, 100);
        const over = spent > b.limit;
        const warn = pct >= 80;

        return (
          <div key={b.id} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">{b.categoryName}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">
                  ¥{spent.toLocaleString()} / ¥{b.limit.toLocaleString()}
                </span>
                {over && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">
                    超過!
                  </span>
                )}
                {!over && warn && (
                  <span className="text-xs bg-yellow-100 text-yellow-700 font-semibold px-2 py-0.5 rounded-full">
                    注意
                  </span>
                )}
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  over ? 'bg-red-500' : warn ? 'bg-yellow-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
