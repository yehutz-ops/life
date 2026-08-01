import { Link } from 'react-router-dom'
import { DomainConfig } from '../data/domains'
import { Item } from '../data/types'

export default function DomainCard({ domain, openCount, next }: { domain: DomainConfig; openCount: number; next?: Item }) {
  return (
    <Link to={domain.path} className="block group">
      <div className="h-full bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-5 transition-all group-hover:shadow-md group-hover:-translate-y-0.5">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-3 ${domain.classes.bg}`}>{domain.icon}</div>
        <div className="font-bold text-stone-800 dark:text-stone-100">{domain.name}</div>
        <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 mb-4">{domain.description}</div>
        <div className="text-sm text-stone-600 dark:text-stone-300">{openCount} פתוחות</div>
        <div className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">{next ? next.title : 'אין פריטים פתוחים'}</div>
      </div>
    </Link>
  )
}
