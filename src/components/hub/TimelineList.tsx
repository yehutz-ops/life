import { Item } from '../../data/types'
import HubEmptyState from './HubEmptyState'

const WEEKDAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

function compactDateLabel(iso: string, today: string) {
  const diff = Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === -1) return 'אתמול'
  if (diff < -1) return `לפני ${Math.abs(diff)} ימים`
  return `${WEEKDAY_LETTERS[new Date(iso + 'T00:00:00').getDay()]}׳`
}

function TimelineRow({ item, today, onToggle, onEdit }: { item: Item; today: string; onToggle: (id: string) => void; onEdit: (id: string) => void }) {
  const done = item.status === 'done'
  return (
    <li className="group flex items-center gap-3 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-800 shrink-0" />
      <span className="text-xs text-stone-400 dark:text-stone-500 w-16 shrink-0">
        {compactDateLabel(item.date!, today)}
        {item.startTime ? ` · ${item.startTime}` : ''}
      </span>
      <span className={`text-sm flex-1 min-w-0 truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{item.title}</span>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(item.id)}
          title="סמן כהושלם"
          aria-label="סמן כהושלם"
          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
        >
          ✓
        </button>
        <button
          onClick={() => onEdit(item.id)}
          title="עריכה"
          aria-label="עריכה"
          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
        >
          ✎
        </button>
      </div>
    </li>
  )
}

// רשימה קומפקטית ("Timeline") לפריטים הקרובים בזמן — משמשת גם ב"היום בעבודה" וגם (בעתיד) בכל
// אזור דומה. items כבר מגיעים מסוננים וממוינים מבחוץ; הרכיב הזה רק מציג.
export default function TimelineList({
  items,
  today,
  onToggle,
  onEdit,
  emptyText,
}: {
  items: Item[]
  today: string
  onToggle: (id: string) => void
  onEdit: (id: string) => void
  emptyText: string
}) {
  if (items.length === 0) return <HubEmptyState text={emptyText} />
  return (
    <ul className="divide-y divide-stone-100/70 dark:divide-stone-800/70">
      {items.map((it) => (
        <TimelineRow key={it.id} item={it} today={today} onToggle={onToggle} onEdit={onEdit} />
      ))}
    </ul>
  )
}
