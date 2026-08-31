import { useMemo, useState } from 'react'
import { CalendarEvent, DOMAIN_EVENT_COLOR, PROVENANCE_LABEL } from './types'
import { WEEKDAY_SHORT, MONTH_NAMES, toISO, startOfMonth, startOfWeek, monthGridCells, formatDayLabel } from './dateGrid'
import { todayISO } from '../../utils/date'

type ViewMode = 'month' | 'week' | 'day'

export interface UnifiedCalendarProps {
  // כל האירועים הרלוונטיים לתצוגה הזו — הקורא אחראי על הסינון (domain/all), הרכיב עצמו לא מכיר domain filter.
  events: CalendarEvent[]
  title?: string
  compact?: boolean
  onAddEvent?: (dateIso: string) => void
  addLabel?: string
  onToggleTask?: (id: string) => void
}

function AgendaRow({ event, showCheckbox, onToggle }: { event: CalendarEvent; showCheckbox?: boolean; onToggle?: (id: string) => void }) {
  const hex = DOMAIN_EVENT_COLOR[event.domain]
  const range = event.time ? (event.endTime ? `${event.time} - ${event.endTime}` : event.time) : event.kindLabel
  return (
    <div className="flex items-stretch gap-3">
      <button
        onClick={event.onOpen}
        title={event.pending ? 'נוצר אוטומטית — לחיצה לבדיקה ואישור' : undefined}
        className={`flex-1 min-w-0 flex items-start gap-2 rounded-xl border border-stone-100 dark:border-stone-800 border-l-[3px] py-2.5 px-3 text-right hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors duration-150 ${
          event.pending ? 'ring-1 ring-dashed ring-amber-400/70 dark:ring-amber-700/70' : ''
        }`}
        style={{ borderLeftColor: hex }}
      >
        {showCheckbox && (
          <span
            role="checkbox"
            aria-checked={!!event.done}
            onClick={(e) => {
              e.stopPropagation()
              onToggle?.(event.id)
            }}
            className={`w-[18px] h-[18px] mt-0.5 rounded-[5px] border-2 shrink-0 flex items-center justify-center text-[10px] transition-colors ${
              event.done ? 'bg-[#C0703A] border-[#C0703A] text-white' : 'border-stone-300 dark:border-stone-600 hover:border-[#C0703A]'
            }`}
          >
            {event.done && '✓'}
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-1.5">
            <span className={`block text-[13px] leading-[18px] font-semibold truncate ${event.done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>
              {event.title}
            </span>
            {event.pending && (
              <span className="shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400">
                לאישור
              </span>
            )}
          </span>
          {(range || event.source) && (
            <span className="block text-[11.5px] leading-[16px] text-stone-400 dark:text-stone-500 truncate mt-0.5 tabular-nums">
              {range}
              {event.source && event.source !== 'manual' ? ` · ${PROVENANCE_LABEL[event.source]}` : ''}
            </span>
          )}
        </span>
      </button>
      {event.time && <div className="w-[42px] shrink-0 text-left text-[13px] font-semibold text-stone-600 dark:text-stone-300 pt-2.5 tabular-nums">{event.time}</div>}
    </div>
  )
}

function DayCell({
  date,
  inMonth,
  isToday,
  isSelected,
  events,
  onSelect,
  maxVisible,
  compact,
}: {
  date: Date
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  events: CalendarEvent[]
  onSelect: (iso: string) => void
  maxVisible: number
  compact?: boolean
}) {
  const iso = toISO(date)
  // כשיש גלישה מפנים מקום לשורת "+N עוד" בתוך אותו גובה תא, במקום לדחוף את הרשת ולשבור את הריבוע.
  const overflowing = events.length > maxVisible
  const visible = overflowing ? events.slice(0, Math.max(1, maxVisible - 1)) : events.slice(0, maxVisible)
  const hidden = events.length - visible.length
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(iso)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(iso)
      }}
      className={`${compact ? 'min-h-[112px]' : 'aspect-[1.025] min-h-[118px]'} flex flex-col items-start gap-1 p-2.5 text-right cursor-pointer transition-colors duration-150 ${
        isSelected
          ? 'bg-[#F4E2CF] dark:bg-[#3A2A1E] ring-1 ring-inset ring-[#D9A578] dark:ring-[#7C4A2A]'
          : isToday
            ? 'bg-[#FDF6EE] dark:bg-[#241D18]'
            : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/60'
      }`}
    >
      <span
        className={`text-[15px] leading-none shrink-0 tabular-nums h-[26px] flex items-center ${!inMonth ? 'opacity-40' : ''} ${
          isToday
            ? 'w-[26px] justify-center rounded-full bg-[#8C4A2B] text-white font-bold text-[13px]'
            : isSelected
              ? 'text-[#7C3D1D] dark:text-amber-300 font-bold'
              : 'text-stone-500 dark:text-stone-400 font-medium'
        }`}
      >
        {date.getDate()}
      </span>
      <div className={`w-full space-y-1 overflow-hidden ${!inMonth ? 'opacity-40' : ''}`}>
        {visible.map((ev) => {
          const hex = DOMAIN_EVENT_COLOR[ev.domain]
          return (
            <div
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation()
                ev.onOpen()
              }}
              title={ev.pending ? `${ev.title} · ממתין לאישור` : ev.title}
              className={`w-full rounded-lg px-2 py-0.5 hover:opacity-75 transition-opacity ${
                ev.pending ? 'ring-1 ring-dashed ring-amber-400/70 dark:ring-amber-700/70' : ''
              }`}
              style={{ background: `${hex}1F` }}
            >
              <div className="flex items-center gap-1.5">
                <span className="flex-1 min-w-0 truncate text-[12px] leading-[17px] font-semibold" style={{ color: hex }}>
                  {ev.title}
                </span>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: hex }} />
              </div>
              {ev.time && (
                <div className="text-[10.5px] leading-[15px] tabular-nums opacity-70" style={{ color: hex }}>
                  {ev.time}
                </div>
              )}
            </div>
          )
        })}
        {hidden > 0 && <div className="text-[10.5px] font-medium text-stone-400 dark:text-stone-500 px-1">+{hidden} עוד</div>}
      </div>
    </div>
  )
}

// ===== היומן המאוחד =====
// רכיב תצוגה יחיד המשמש בכל האפליקציה: יומן כללי, כרטיס בדף הבית, ויומני domain. ההבדל היחיד בין
// המופעים הוא ה-events שמועברים אליו מבחוץ (כבר מסוננים/מנורמלים) — אין כאן שום מודעות ל-domain filter
// עצמו, כדי שהרכיב יישאר "שכבת תצוגה" טהורה מעל נתונים אמיתיים.
export default function UnifiedCalendar({ events, title, compact, onAddEvent, addLabel = '+ אירוע חדש', onToggleTask }: UnifiedCalendarProps) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()))
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [viewMode, setViewMode] = useState<ViewMode>('month')

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {}
    for (const ev of events) {
      map[ev.date] = map[ev.date] || []
      map[ev.date].push(ev)
    }
    for (const key of Object.keys(map)) map[key].sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99'))
    return map
  }, [events])

  const monthCells = useMemo(() => monthGridCells(cursor), [cursor])
  const weekCells = useMemo(() => {
    const start = startOfWeek(new Date(selectedDate + 'T00:00:00'))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }, [selectedDate])

  function navigate(delta: number) {
    if (viewMode === 'month') {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
      return
    }
    const base = new Date(selectedDate + 'T00:00:00')
    base.setDate(base.getDate() + delta * (viewMode === 'week' ? 7 : 1))
    setSelectedDate(toISO(base))
    setCursor(startOfMonth(base))
  }

  function goToday() {
    const t = new Date()
    setCursor(startOfMonth(t))
    setSelectedDate(toISO(t))
  }

  const today = todayISO()
  const dayEvents = (eventsByDate[selectedDate] || []) as CalendarEvent[]
  const selectedTasks = dayEvents.filter((e) => e.kindLabel === 'משימה')
  const selectedAgenda = dayEvents.filter((e) => e.kindLabel !== 'משימה')

  return (
    <div>
      {title && <div className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-3">{title}</div>}

      {/* סרגל כלים: [חודש/שבוע/יום] · [חודש+שנה] · [היום/הבא/הקודם] — סדר ה-DOM כאן קובע את סדר ה-RTL:
          הראשון ביותר מוצג בצד ימין (מתאים למה שנראה ברפרנס), האחרון בצד שמאל. */}
      <div className="grid grid-cols-3 items-center gap-2 mb-5">
        <div className="flex items-center justify-start gap-1 bg-stone-100 dark:bg-stone-800 rounded-xl p-1 w-fit">
          {(['month', 'week', 'day'] as ViewMode[]).map((vm) => (
            <button
              key={vm}
              onClick={() => setViewMode(vm)}
              className={`px-4 h-8 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
                viewMode === vm
                  ? 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-100 shadow-sm'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
              }`}
            >
              {vm === 'month' ? 'חודש' : vm === 'week' ? 'שבוע' : 'יום'}
            </button>
          ))}
        </div>

        <div className="text-center text-[24px] font-bold text-stone-800 dark:text-stone-100 truncate">
          {MONTH_NAMES[cursor.getMonth()]} {cursor.getFullYear()}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={goToday}
            className="px-4 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-[12.5px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:border-[#E4C9AC] transition-colors duration-150"
          >
            היום
          </button>
          <button
            onClick={() => navigate(1)}
            aria-label="הבא"
            className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 text-[16px] hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:border-[#E4C9AC] transition-colors duration-150"
          >
            ←
          </button>
          <button
            onClick={() => navigate(-1)}
            aria-label="הקודם"
            className="w-10 h-10 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-400 text-[16px] hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:border-[#E4C9AC] transition-colors duration-150"
          >
            →
          </button>
        </div>
      </div>

      {/* גוף: רצועת סיכום היום הנבחר (ימין) + תצוגת חודש/שבוע/יום (שמאל, רחבה) */}
      <div className={`grid grid-cols-1 gap-y-5 gap-x-14 items-start ${compact ? '' : 'xl:grid-cols-[minmax(250px,1fr)_minmax(0,3.74fr)]'}`}>
        <div className={`order-2 ${compact ? '' : 'xl:order-1 xl:sticky xl:top-6'} flex flex-col gap-4`}>
          {/* כרטיס 1 — היום הנבחר והאירועים שלו */}
          <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-5">
            <div className="text-[16px] font-bold text-stone-800 dark:text-stone-100">{formatDayLabel(selectedDate)}</div>
            {selectedDate === today && <div className="text-[13px] font-medium text-[#C0703A] dark:text-amber-400 mt-0.5">היום</div>}

            <div className="mt-3.5">
              {selectedAgenda.length === 0 ? (
                <p className="text-[12.5px] text-stone-400 dark:text-stone-500">אין אירועים ביום הזה</p>
              ) : (
                <div className="space-y-2.5">
                  {selectedAgenda.map((ev) => (
                    <AgendaRow key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* כרטיס 2 — משימות היום, כרטיס נפרד ברפרנס ולא המשך של הראשון */}
          {selectedTasks.length > 0 && (
            <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-5">
              <div className="text-[16px] font-bold text-stone-800 dark:text-stone-100 mb-3.5">משימות להיום</div>
              <div className="space-y-2.5">
                {selectedTasks.map((ev) => (
                  <AgendaRow key={ev.id} event={ev} showCheckbox onToggle={onToggleTask} />
                ))}
              </div>
            </div>
          )}

          {onAddEvent && (
            <button
              onClick={() => onAddEvent(selectedDate)}
              className={`w-full h-[52px] rounded-2xl bg-[#8C4A2B] hover:bg-[#7A3E23] text-white text-[14px] font-semibold transition-colors duration-150`}
            >
              {addLabel}
            </button>
          )}
        </div>

        <div className={`order-1 ${compact ? '' : 'xl:order-2'} min-w-0 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none overflow-hidden`}>
          {viewMode === 'day' ? (
            <div className="p-4">
              <div className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-3">{formatDayLabel(selectedDate)}</div>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 py-6 text-center">אין אירועים ביום הזה</p>
              ) : (
                <div className="space-y-2 max-w-md">
                  {dayEvents.map((ev) => (
                    <AgendaRow key={ev.id} event={ev} showCheckbox={ev.kindLabel === 'משימה'} onToggle={onToggleTask} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 text-center text-[14px] font-medium text-stone-400 dark:text-stone-500 h-[50px] items-center">
                {WEEKDAY_SHORT.map((w) => (
                  <div key={w}>{w}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-stone-100 dark:bg-stone-800 border-t border-stone-100 dark:border-stone-800">
                {(viewMode === 'month' ? monthCells : weekCells).map((d) => {
                  const iso = toISO(d)
                  return (
                    <DayCell
                      key={iso}
                      date={d}
                      inMonth={viewMode === 'week' || d.getMonth() === cursor.getMonth()}
                      isToday={iso === today}
                      isSelected={iso === selectedDate}
                      events={eventsByDate[iso] || []}
                      onSelect={setSelectedDate}
                      maxVisible={compact ? 1 : viewMode === 'week' ? 4 : 2}
                      compact={compact}
                    />
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
