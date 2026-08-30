import { useMemo, useState } from 'react'
import { Item } from '../../data/types'
import { getDomain } from '../../data/domains'
import { todayISO } from '../../utils/date'

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

const HOUR_H = 34 // גובה שורת שעה בפיקסלים
const DEFAULT_START = 8
const DEFAULT_END = 18
const TIME_COL = 52

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date) {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  c.setDate(c.getDate() - c.getDay())
  return c
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

// יומן שבועי עם רשת שעות אמיתית. מקבל items כבר מסוננים מבחוץ ומציג רק אירועים עם שעת התחלה;
// פריטים מתוארכים ללא שעה מוצגים כשורת "כל היום" בראש העמודה.
export default function WeekCalendar({ items, onSelect }: { items: Item[]; onSelect: (id: string) => void }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const today = todayISO()

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)),
    [weekStart],
  )
  const dayIsos = days.map(toISO)

  const weekItems = useMemo(() => items.filter((it) => it.date && dayIsos.includes(it.date)), [items, dayIsos.join()])
  const timed = weekItems.filter((it) => it.startTime)
  const allDay = weekItems.filter((it) => !it.startTime)

  // טווח השעות נגזר מהאירועים בפועל, כדי לא להציג שעות ריקות מיותרות.
  const { startHour, endHour } = useMemo(() => {
    if (timed.length === 0) return { startHour: DEFAULT_START, endHour: DEFAULT_END }
    let min = 24
    let max = 0
    for (const it of timed) {
      const s = Math.floor(minutes(it.startTime!) / 60)
      const e = Math.ceil(minutes(it.endTime ?? it.startTime!) / 60) + (it.endTime ? 0 : 1)
      min = Math.min(min, s)
      max = Math.max(max, e)
    }
    return { startHour: Math.max(0, Math.min(min, DEFAULT_START)), endHour: Math.min(24, Math.max(max, DEFAULT_END)) }
  }, [timed])

  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const gridH = hours.length * HOUR_H

  const first = days[0]
  const last = days[6]
  const rangeLabel =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()} – ${last.getDate()} ${MONTHS[first.getMonth()]} ${first.getFullYear()}`
      : `${first.getDate()} ${MONTHS[first.getMonth()]} – ${last.getDate()} ${MONTHS[last.getMonth()]} ${first.getFullYear()}`

  function shift(weeks: number) {
    setWeekStart((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate() + weeks * 7))
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-5">
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" className="w-4 h-4 text-stone-300 dark:text-stone-600">
            <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
            <path d="M3.5 9.5h17M8 3v4M16 3v4" />
          </svg>
          <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100">היומן שלי</h2>
        </div>

        <span className="text-sm font-medium text-stone-600 dark:text-stone-300">{rangeLabel}</span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 h-7 rounded-lg border border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800"
          >
            היום
          </button>
          <button onClick={() => shift(-1)} aria-label="שבוע קודם" className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs">
            ›
          </button>
          <button onClick={() => shift(1)} aria-label="שבוע הבא" className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs">
            ‹
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[620px]">
          {/* כותרות הימים — עמודת השעות מימין (ריקה בשורה הזו) */}
          <div className="flex border-b border-stone-100 dark:border-stone-800">
            <div className="shrink-0" style={{ width: TIME_COL }} />
            {days.map((d, i) => {
              const iso = toISO(d)
              const isToday = iso === today
              return (
                <div key={iso} className={`flex-1 min-w-0 text-center py-2 border-r border-stone-100 dark:border-stone-800 ${isToday ? 'bg-amber-50/60 dark:bg-amber-950/20' : ''}`}>
                  <span className={`text-xs font-semibold ${isToday ? 'text-amber-800 dark:text-amber-400' : 'text-stone-600 dark:text-stone-300'}`}>{DAY_NAMES[i]}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500"> {d.getDate()}/{d.getMonth() + 1}</span>
                </div>
              )
            })}
          </div>

          {/* פריטים מתוארכים ללא שעה */}
          {allDay.length > 0 && (
            <div className="flex border-b border-stone-100 dark:border-stone-800">
              <div className="shrink-0 text-[10px] text-stone-300 dark:text-stone-600 flex items-start justify-center pt-1.5" style={{ width: TIME_COL }}>
                כל היום
              </div>
              {dayIsos.map((iso) => (
                <div key={iso} className="flex-1 min-w-0 border-r border-stone-100 dark:border-stone-800 p-1 space-y-1">
                  {allDay
                    .filter((it) => it.date === iso)
                    .slice(0, 2)
                    .map((it) => {
                      const hex = getDomain(it.domain).homeAccent?.hex ?? '#78716C'
                      return (
                        <button
                          key={it.id}
                          onClick={() => onSelect(it.id)}
                          title={it.title}
                          className="w-full text-right rounded-md px-1.5 py-1 text-[10px] font-medium truncate"
                          style={{ background: `${hex}1A`, color: hex }}
                        >
                          {it.title}
                        </button>
                      )
                    })}
                </div>
              ))}
            </div>
          )}

          {/* רשת השעות */}
          <div className="flex" style={{ height: gridH }}>
            <div className="shrink-0 relative" style={{ width: TIME_COL }}>
              {hours.map((h, i) => (
                <div key={h} className="absolute left-0 right-0 text-[10px] text-stone-400 dark:text-stone-500 text-center" style={{ top: i * HOUR_H - 6 }}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {dayIsos.map((iso) => {
              const isToday = iso === today
              const dayEvents = timed.filter((it) => it.date === iso)
              return (
                <div key={iso} className={`flex-1 min-w-0 relative border-r border-stone-100 dark:border-stone-800 ${isToday ? 'bg-amber-50/40 dark:bg-amber-950/10' : ''}`}>
                  {hours.map((h, i) => (
                    <div key={h} className="absolute left-0 right-0 border-t border-stone-100/80 dark:border-stone-800/60" style={{ top: i * HOUR_H }} />
                  ))}

                  {dayEvents.map((it) => {
                    const startM = minutes(it.startTime!)
                    const endM = it.endTime ? minutes(it.endTime) : startM + 60
                    const top = ((startM - startHour * 60) / 60) * HOUR_H
                    const height = Math.max(24, ((endM - startM) / 60) * HOUR_H)
                    const hex = getDomain(it.domain).homeAccent?.hex ?? '#78716C'
                    return (
                      <button
                        key={it.id}
                        onClick={() => onSelect(it.id)}
                        title={`${it.title} · ${it.startTime}${it.endTime ? ` - ${it.endTime}` : ''}`}
                        className="absolute inset-x-1 rounded-lg px-1.5 py-1 text-right overflow-hidden hover:opacity-80 transition-opacity"
                        style={{ top, height, background: `${hex}1F`, borderRight: `2px solid ${hex}` }}
                      >
                        <span className="block text-[10px] font-semibold leading-tight truncate" style={{ color: hex }}>
                          {it.title}
                        </span>
                        <span className="block text-[9px] text-stone-500 dark:text-stone-400 truncate">
                          {it.startTime}
                          {it.endTime ? ` - ${it.endTime}` : ''}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
