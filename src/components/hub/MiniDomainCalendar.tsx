import { useMemo, useState } from 'react'
import { Item } from '../../data/types'
import { todayISO } from '../../utils/date'
import { kindIcon } from '../ui'
import HubSectionHeader from './HubSectionHeader'
import HubEmptyState from './HubEmptyState'

const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// גרסה קומפקטית של מבנה/סגנון היומן הכללי (CalendarPage) — אותה לוגיקת רשת חודשית + רשימת יום נבחר,
// אך מקבלת items כבר מסוננים מבחוץ (לתחום ספציפי), כדי שנוכל לעשות בה שימוש חוזר לכל Domain בעתיד.
export default function MiniDomainCalendar({ title, items }: { title: string; items: Item[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const itemsByDate = useMemo(() => {
    const map: Record<string, Item[]> = {}
    items.forEach((it) => {
      if (!it.date) return
      map[it.date] = map[it.date] || []
      map[it.date].push(it)
    })
    return map
  }, [items])

  const cells = useMemo(() => {
    const startOffset = cursor.getDay()
    const gridStart = new Date(cursor)
    gridStart.setDate(gridStart.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  function changeMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  const selectedItems = itemsByDate[selectedDate] || []

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
      <HubSectionHeader
        title={title}
        action={
          <div className="flex items-center gap-2 text-xs">
            <button onClick={() => changeMonth(-1)} className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800">
              →
            </button>
            <span className="font-medium text-stone-600 dark:text-stone-300 min-w-[70px] text-center">
              {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
            </span>
            <button onClick={() => changeMonth(1)} className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800">
              ←
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-7 text-center text-[11px] text-stone-400 dark:text-stone-500 mb-1">
        {weekdays.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 mb-4">
        {cells.map((d) => {
          const iso = toISO(d)
          const inMonth = d.getMonth() === cursor.getMonth()
          const dayItems = itemsByDate[iso] || []
          const isSelected = iso === selectedDate
          const isToday = iso === todayISO()
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={`aspect-square rounded-lg p-1 text-right flex flex-col items-start gap-0.5 border transition-colors ${
                isSelected ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50' : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'
              } ${!inMonth ? 'opacity-30' : ''}`}
            >
              <span
                className={`text-[10px] ${
                  isToday ? 'w-4 h-4 flex items-center justify-center rounded-full bg-amber-800 text-white' : 'text-stone-600 dark:text-stone-300'
                }`}
              >
                {d.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5">
                {dayItems.slice(0, 3).map((_, i) => (
                  <span key={i} className="w-1 h-1 rounded-full bg-amber-800" />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {selectedItems.length === 0 ? (
        <HubEmptyState text={`אין כלום ב-${selectedDate}`} />
      ) : (
        <ul className="divide-y divide-stone-50 dark:divide-stone-800">
          {selectedItems.map((it) => (
            <li key={it.id} className="flex items-center justify-between py-2">
              <span className="text-sm text-stone-800 dark:text-stone-100">{it.title}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500">
                {kindIcon[it.kind]}
                {it.startTime ? ` · ${it.startTime}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
