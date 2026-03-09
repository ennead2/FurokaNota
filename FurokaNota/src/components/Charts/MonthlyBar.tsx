import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Transaction } from '../../types';

interface Props {
  transactions: Transaction[];
}

function formatYen(value: number) {
  return `¥${value.toLocaleString('ja-JP')}`;
}

export function MonthlyBar({ transactions }: Props) {
  // Build last 12 months summary
  const months: { month: string; income: number; expense: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Use local time methods to avoid UTC offset shifting the month (e.g. JST+9)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getMonth() + 1}月`;
    const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    months.push({ month: label, income, expense });
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={months} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tickFormatter={formatYen} tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(val) => formatYen(Number(val))} />
        <Legend />
        <Bar dataKey="income" name="収入" fill="#34d399" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="支出" fill="#f87171" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
