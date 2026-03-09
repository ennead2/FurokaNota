import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'ダッシュボード', icon: '📊' },
  { to: '/transactions', label: '収支一覧', icon: '📋' },
  { to: '/budget', label: '予算設定', icon: '🎯' },
  { to: '/recurring', label: '定期支出・収入', icon: '🔁' },
  { to: '/receipt', label: 'レシートOCR', icon: '📷' },
  { to: '/settings', label: '設定', icon: '⚙️' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white flex flex-col
        transform transition-transform duration-200 ease-in-out
        md:static md:z-auto md:w-56 md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      <div className="px-6 py-5 border-b border-slate-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-emerald-400">FurokaNota</h1>
          <p className="text-xs text-slate-400 mt-0.5">流れ × ノート</p>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onClose}
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
