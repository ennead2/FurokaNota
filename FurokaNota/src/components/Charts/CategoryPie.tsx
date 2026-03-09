import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from 'recharts';
import { useEffect, useState } from 'react';
import type { Transaction, Category } from '../../types';
import { categoryService } from '../../services/db';

interface Props {
  transactions: Transaction[];
  month: string;
}

const FALLBACK_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6',
  '#a855f7', '#ec4899', '#06b6d4', '#84cc16', '#f59e0b',
];

const RADIAN = Math.PI / 180;

function renderLabel(props: PieLabelRenderProps) {
  const cx = Number(props.cx ?? 0);
  const cy = Number(props.cy ?? 0);
  const midAngle = Number(props.midAngle ?? 0);
  const outerRadius = Number(props.outerRadius ?? 0);
  const name = String(props.name ?? '');
  const percent = Number(props.percent ?? 0);

  // Hide label and line for very small slices
  if (percent < 0.04) return null;

  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);

  // Line start: pie edge, end: just before the text
  const x1 = cx + (outerRadius + 4) * cos;
  const y1 = cy + (outerRadius + 4) * sin;
  const x2 = cx + (outerRadius + 22) * cos;
  const y2 = cy + (outerRadius + 22) * sin;

  // Text anchor point
  const tx = cx + (outerRadius + 28) * cos;
  const ty = cy + (outerRadius + 28) * sin;
  const label = name.length > 6 ? name.slice(0, 6) + '…' : name;

  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={1} />
      <text
        x={tx}
        y={ty}
        fill="#475569"
        textAnchor={tx > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={11}
      >
        {`${label} ${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
}

export function CategoryPie({ transactions, month }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryService.getAll().then(setCategories);
  }, []);

  const monthTx = transactions.filter(t => t.date.startsWith(month) && t.type === 'expense');

  const categoryTotals: Record<string, number> = {};
  for (const t of monthTx) {
    categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + t.amount;
  }

  const data = Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));

  function getColor(name: string, idx: number) {
    const cat = categories.find(c => c.name === name);
    return cat?.color ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
  }

  if (data.length === 0) {
    return <p className="text-center text-slate-400 py-10 text-sm">この月の支出データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart margin={{ top: 50, right: 90, bottom: 30, left: 90 }} style={{ overflow: 'visible' }}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={renderLabel}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={getColor(entry.name, index)} />
          ))}
        </Pie>
        <Tooltip formatter={(val, name) => [`¥${Number(val).toLocaleString('ja-JP')}`, name]} />
      </PieChart>
    </ResponsiveContainer>
  );
}
