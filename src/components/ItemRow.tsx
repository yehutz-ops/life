import { Item } from '../data/types'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { DomainBadge, PriorityChip, waitingTypeIcon } from './ui'
import { daysUntilLabel, isOverdue } from '../utils/date'

export default function ItemRow({ item, showDomain = true, starred = false }: { item: Item; showDomain?: boolean; starred?: boolean }) {
  const { toggleDone, postponeToTomorrow } = useStore()
  const { open } = useDetailModal()
  const done = item.status === 'done'
  const overdue = isOverdue(item.date) && !done

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {starred && <span title="אחת המשימות הכי חשובות היום">⭐</span>}
          {item.kind === 'waiting' && item.waitingType && <span>{waitingTypeIcon[item.waitingType]}</span>}
          <span className={`text-sm font-medium truncate ${done ? 'line-through text-gray-400 dark:text-gray-600' : 'text-gray-800 dark:text-gray-100'}`}>
            {item.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {showDomain && <DomainBadge domain={item.domain} />}
          <PriorityChip priority={item.priority} />
          {item.personName && <span className="text-xs text-gray-400 dark:text-gray-500">{item.personName}</span>}
        </div>
      </div>

      <span className={`text-xs whitespace-nowrap ${overdue ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
        {item.time ? `${daysUntilLabel(item.date)} · ${item.time}` : daysUntilLabel(item.date)}
      </span>

      <div className="flex items-center gap-1 shrink-0">
        {(item.kind === 'task' || item.kind === 'reminder' || item.kind === 'waiting') && (
          <button
            title={done ? 'סמן כלא הושלם' : 'סמן כהושלם'}
            onClick={() => toggleDone(item.id)}
            className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
          >
            ✓
          </button>
        )}
        {!done && (item.kind === 'task' || item.kind === 'reminder') && (
          <button title="דחה למחר" onClick={() => postponeToTomorrow(item.id)} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
            ⏭️
          </button>
        )}
        <button title="פתח פרטים" onClick={() => open(item.id)} className="w-7 h-7 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm">
          🔍
        </button>
      </div>
    </li>
  )
}
