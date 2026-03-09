interface Props {
  month: string;
  search: string;
  onMonthChange: (m: string) => void;
  onSearchChange: (s: string) => void;
}

export function TransactionFilter({ month, search, onMonthChange, onSearchChange }: Props) {
  return (
    <div className="flex gap-3 flex-wrap">
      <input
        type="month"
        value={month}
        onChange={e => onMonthChange(e.target.value)}
        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
      <input
        type="text"
        value={search}
        onChange={e => onSearchChange(e.target.value)}
        placeholder="カテゴリ・メモで検索..."
        className="flex-1 min-w-48 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      />
    </div>
  );
}
