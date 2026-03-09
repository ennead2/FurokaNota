import {
  LineChart,
  Line,
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

export function TrendLine({ transactions }: Props) {
  const now = new Date();
  const data = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    // Use local time methods to avoid UTC offset shifting the month (e.g. JST+9)
    const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = `${d.getFullYear()}/${d.getMonth() + 1}`;
    const monthTx = transactions.filter(t => t.date.startsWith(monthStr));
    const income = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    data.push({ month: label, income, expense, balance: income - expense });
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={v => `¥${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={60} />
        <Tooltip formatter={(val) => `¥${Number(val).toLocaleString('ja-JP')}`} />
        <Legend />
        <Line type="monotone" dataKey="income" name="収入" stroke="#34d399" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="expense" name="支出" stroke="#f87171" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="balance" name="収支差" stroke="#818cf8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
