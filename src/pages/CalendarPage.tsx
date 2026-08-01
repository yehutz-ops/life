import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { getDomain } from '../data/domains'
import { Card, kindIcon } from '../components/ui'
import { todayISO } from '../utils/date'
import { Item } from '../data/types'

const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const { items } = useStore()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const itemsByDate = useMemo(() => {
    const map: Record<string, Item[]> = {}
    items
      .filter((it) => it.domain && it.date && it.status !== 'done')
      .forEach((it) => {
        map[it.date!] = map[it.date!] || []
        map[it.date!].push(it)
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
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">יומן</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">כל האירועים והמשימות מכל תחומי החיים, במקום אחד</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => changeMonth(-1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            → הקודם
          </button>
          <div className="font-bold text-gray-900 dark:text-gray-100">
            {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button onClick={() => changeMonth(1)} className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
            הבא ←
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-xs text-gray-400 dark:text-gray-500 mb-2">
          {weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
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
                className={`aspect-square rounded-xl p-1.5 text-right flex flex-col items-start gap-1 border transition-colors ${
                  isSelected ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/50' : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                } ${!inMonth ? 'opacity-30' : ''}`}
              >
                <span
                  className={`text-xs ${
                    isToday ? 'w-5 h-5 flex items-center justify-center rounded-full bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayItems.slice(0, 4).map((it, i) => (
                    <span key={i} className={`w-1.5 h-1.5 rounded-full ${getDomain(it.domain!).classes.dot}`} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">{selectedItems.length ? `מה קורה ב-${selectedDate}` : 'אין כלום ביום הנבחר'}</h2>
        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
          {selectedItems.map((it) => {
            const d = getDomain(it.domain!)
            return (
              <li key={it.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${d.classes.dot}`} />
                  <span className="text-sm text-gray-800 dark:text-gray-100">{it.title}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    · {kindIcon[it.kind]}
                    {it.time ? ` · ${it.time}` : ''}
                  </span>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${d.classes.chip}`}>{d.name}</span>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
