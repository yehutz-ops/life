import { NavLink } from 'react-router-dom'

const coreLinks = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/calendar', label: 'יומן', icon: '🗓️', end: false },
  { to: '/tasks', label: 'משימות', icon: '✅', end: false },
  { to: '/projects', label: 'פרויקטים', icon: '📁', end: false },
  { to: '/search', label: 'חיפוש', icon: '🔍', end: false },
  { to: '/settings', label: 'הגדרות', icon: '⚙️', end: false },
]

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl text-sm font-medium transition-colors ${collapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'} ${
      isActive
        ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
        : 'text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
    }`

  return (
    <aside
      className={`shrink-0 border-l border-stone-100 dark:border-stone-800 bg-white/80 dark:bg-stone-900 backdrop-blur-sm min-h-screen p-4 flex flex-col transition-all ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex items-center justify-between px-2 py-3 mb-2">
        {!collapsed && (
          <div>
            <div className="text-lg font-elegant font-bold text-stone-900 dark:text-stone-100">Life Control Center</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">מרכז שליטה אישי</div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
          className="w-8 h-8 shrink-0 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 flex items-center justify-center text-stone-400"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {coreLinks.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass} title={collapsed ? l.label : undefined}>
            <span>{l.icon}</span>
            {!collapsed && <span>{l.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!collapsed && <div className="mt-auto px-2 pt-4 text-xs text-stone-300 dark:text-stone-600">גרסת תצוגה — נתוני דוגמה</div>}
    </aside>
  )
}
