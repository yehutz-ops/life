import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import HubSectionHeader from './HubSectionHeader'
import HubEmptyState from './HubEmptyState'

export default function HubSummaryPanel<T>({
  title,
  items,
  renderItem,
  emptyText,
  viewAllHref,
  maxItems = 4,
}: {
  title: string
  items: T[]
  renderItem: (item: T) => ReactNode
  emptyText: string
  viewAllHref: string
  maxItems?: number
}) {
  const shown = items.slice(0, maxItems)

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
      <HubSectionHeader title={title} />
      {shown.length === 0 ? (
        <HubEmptyState text={emptyText} />
      ) : (
        <ul className="divide-y divide-stone-50 dark:divide-stone-800">{shown.map((item, i) => <li key={i} className="py-2 first:pt-0 last:pb-0">{renderItem(item)}</li>)}</ul>
      )}
      <Link to={viewAllHref} className="block text-center text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 mt-3 pt-3 border-t border-stone-50 dark:border-stone-800">
        צפה בהכול
      </Link>
    </div>
  )
}
