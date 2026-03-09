import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'ダッシュボード', icon: '📊' },
  { to: '/transactions', label: '収支一覧', icon: '📋' },
  { to: '/budget', label: '予算設定', icon: '🎯' },
  { to: '/recurring', label: '定期支出・収入', icon: '🔁' },
  { to: '/receipt', label: 'レシートOCR', icon: '📷' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

export function Sidebar() {
  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-emerald-400">FurokaNota</h1>
        <p className="text-xs text-slate-400 mt-0.5">流れ × ノート</p>
      </div>
      <nav className="flex-1 py-4">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-emerald-700 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800'
              }`
            }
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
