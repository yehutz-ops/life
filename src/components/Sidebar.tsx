import { NavLink } from 'react-router-dom'

const coreLinks = [
  { to: '/', label: 'בית', icon: '🏠', end: true },
  { to: '/calendar', label: 'יומן', icon: '🗓️', end: false },
  { to: '/tasks', label: 'משימות', icon: '✅', end: false },
  { to: '/projects', label: 'פרויקטים', icon: '📁', end: false },
  { to: '/search', label: 'חיפוש', icon: '🔍', end: false },
  { to: '/settings', label: 'הגדרות', icon: '⚙️', end: false },
]

export default function Sidebar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
    }`

  return (
    <aside className="w-64 shrink-0 border-l border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 min-h-screen p-4 flex flex-col">
      <div className="px-2 py-3 mb-2">
        <div className="text-lg font-extrabold text-gray-900 dark:text-gray-100">🎛️ Life Control Center</div>
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">מרכז שליטה אישי</div>
      </div>

      <nav className="flex flex-col gap-1">
        {coreLinks.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-2 pt-4 text-xs text-gray-300 dark:text-gray-600">גרסת תצוגה — נתוני דוגמה</div>
    </aside>
  )
}
