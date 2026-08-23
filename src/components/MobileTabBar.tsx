import { NavLink } from 'react-router-dom'
import { coreLinks } from './navLinks'

export default function MobileTabBar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium ${
      isActive ? 'text-amber-900 dark:text-amber-300' : 'text-stone-500 dark:text-stone-400'
    }`

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 flex border-t border-stone-100 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
      {coreLinks.map((l) => (
        <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
          <span className="text-lg leading-none">{l.icon}</span>
          <span>{l.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
