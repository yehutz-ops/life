import { Item } from '../data/types'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { DomainBadge, PriorityChip, waitingTypeIcon } from './ui'
import { daysUntilLabel, isOverdue } from '../utils/date'

export default function ItemRow({
  item,
  showDomain = true,
  starred = false,
  hoverActions = false,
}: {
  item: Item
  showDomain?: boolean
  starred?: boolean
  hoverActions?: boolean
}) {
  const { toggleDone, postponeToTomorrow } = useStore()
  const { openEdit } = useDetailModal()
  const done = item.status === 'done'
  const active = item.status !== 'done' && item.status !== 'cancelled'
  const overdue = isOverdue(item.date) && active

  return (
    <li className={`group flex items-center gap-3 py-2.5 ${hoverActions ? 'rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 -mx-2 px-2' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {starred && <span title="אחת המשימות הכי חשובות היום">⭐</span>}
          {item.kind === 'waiting' && item.waitingType && <span>{waitingTypeIcon[item.waitingType]}</span>}
          <span className={`text-sm font-medium truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>
            {item.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          {showDomain && <DomainBadge domain={item.domain} />}
          <PriorityChip priority={item.priority} />
          {item.personName && <span className="text-xs text-stone-400 dark:text-stone-500">{item.personName}</span>}
        </div>
      </div>

      <span className={`text-xs whitespace-nowrap ${overdue ? 'text-amber-800 dark:text-amber-400 font-medium' : 'text-stone-400 dark:text-stone-500'}`}>
        {item.startTime ? `${daysUntilLabel(item.date)} · ${item.startTime}` : daysUntilLabel(item.date)}
      </span>

      <div className={`flex items-center gap-1 shrink-0 ${hoverActions ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
        {item.kind !== 'event' && (
          <button
            title={done ? 'סמן כלא הושלם' : 'סמן כהושלם'}
            onClick={() => toggleDone(item.id)}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-sm"
          >
            ✓
          </button>
        )}
        {active && (item.kind === 'task' || item.kind === 'reminder') && (
          <button title="דחה למחר" onClick={() => postponeToTomorrow(item.id)} className="w-7 h-7 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">
            ⏭️
          </button>
        )}
        <button title="פתח פרטים" onClick={() => openEdit(item.id)} className="w-7 h-7 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-sm">
          🔍
        </button>
      </div>
    </li>
  )
}
