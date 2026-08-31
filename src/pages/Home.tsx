import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { getDomain } from '../data/domains'
import QuickCaptureBar from '../components/QuickCaptureBar'
import HomeDomainCard from '../components/HomeDomainCard'
import InboxBanner from '../components/InboxBanner'
import UnifiedCalendar from '../components/calendar/UnifiedCalendar'
import { itemsToCalendarEvents } from '../components/calendar/itemAdapter'
import { ChecklistIcon, CalendarIcon } from '../components/hub/hubIcons'
import { computeHomeAlerts, HomeAlert } from '../data/homeAlerts'
import { fetchHomeEmails, HomeEmail } from '../email/recentEmails'
import { getGreeting, todayISO } from '../utils/date'
import { DomainId, ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'

// חמשת התחומים המוצגים בדף הבית. "אישי" מאגד גם health ו-personalDevelopment לצורך ספירה בלבד —
// זהו חישוב תצוגה (UI) בלבד: מודל הנתונים, ה-Routes ל-/health ול-/personal-development,
// והשיוך של פריטים קיימים — לא משתנים.
const HOME_DOMAINS: { id: DomainId; mergedWith?: DomainId[] }[] = [
  { id: 'work' },
  { id: 'studies' },
  { id: 'personal', mergedWith: ['health', 'personalDevelopment'] },
  { id: 'home' },
  { id: 'finance' },
]

const ALERT_STYLE: Record<HomeAlert['severity'], { bg: string; fg: string; glyph: string }> = {
  critical: { bg: 'bg-rose-50 dark:bg-rose-950/30', fg: 'text-rose-500 dark:text-rose-400', glyph: '!' },
  warning: { bg: 'bg-amber-50 dark:bg-amber-950/30', fg: 'text-amber-600 dark:text-amber-400', glyph: '!' },
  info: { bg: 'bg-stone-100 dark:bg-stone-800', fg: 'text-stone-500 dark:text-stone-400', glyph: '₪' },
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

function PanelHead({ icon, title, badge }: { icon: ReactNode; title: string; badge?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{icon}</span>
        <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap">{title}</h2>
      </div>
      {badge}
    </div>
  )
}

function ShowAll({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 dark:text-amber-400 hover:opacity-75">
      <span>‹</span>
      <span>הצג הכל</span>
    </Link>
  )
}

function BellIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M6 9.5a6 6 0 0 1 12 0c0 3.5 1 5 1.8 5.9.4.4.1 1.1-.5 1.1H4.7c-.6 0-.9-.7-.5-1.1C5 14.5 6 13 6 9.5Z" />
      <path d="M10 19.5a2 2 0 0 0 4 0" />
    </svg>
  )
}

function MailIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="5.5" width="18" height="13" rx="1.6" />
      <path d="m3.6 6.8 8.4 6 8.4-6" />
    </svg>
  )
}

function timeOfDay(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default function Home() {
  const { items, inboxEntries, shipments, toggleDone } = useStore()
  const { openEdit, openCreate } = useDetailModal()
  const today = todayISO()
  const pendingInbox = inboxEntries.filter((e) => e.status === 'pending')

  const [emails, setEmails] = useState<HomeEmail[] | null>(null)
  const [emailsFailed, setEmailsFailed] = useState(false)

  // המיילים נקראים ישירות מ-Gmail בכל טעינה ולא נשמרים מקומית. אם התיבות לא מוגדרות או שהקריאה
  // נכשלת — הפאנל מציג מצב ריק ושאר הדף ממשיך לעבוד כרגיל.
  useEffect(() => {
    let cancelled = false
    fetchHomeEmails(3)
      .then((list) => !cancelled && setEmails(list))
      .catch(() => !cancelled && setEmailsFailed(true))
    return () => {
      cancelled = true
    }
  }, [])

  function openCount(domainIds: DomainId[]) {
    return items.filter((it) => domainIds.includes(it.domain) && it.kind !== 'event' && isActive(it.status)).length
  }

  const todayItems = useMemo(
    () =>
      items
        .filter((it) => it.date === today && isActive(it.status))
        .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99')),
    [items, today],
  )

  const todayDone = useMemo(() => items.filter((it) => it.date === today && it.status === 'done').length, [items, today])
  const meetingsToday = todayItems.filter((it) => it.kind === 'event').length
  const tasksToday = todayItems.filter((it) => it.kind !== 'event').length
  const emailInboxCount = pendingInbox.filter((e) => e.source === 'email').length
  const overdueCount = useMemo(
    () => items.filter((it) => it.date && it.date < today && isActive(it.status) && it.kind !== 'event').length,
    [items, today],
  )
  const dailyProgress = todayItems.length + todayDone > 0 ? Math.round((todayDone / (todayItems.length + todayDone)) * 100) : 0

  const alerts = useMemo(() => computeHomeAlerts(items, shipments, today, 3), [items, shipments, today])
  const calendarItems = useMemo(() => items.filter((it) => it.date && isActive(it.status)), [items])

  const stats = [
    { value: overdueCount, label: 'באיחור' },
    { value: emailInboxCount, label: 'מיילים' },
    { value: tasksToday, label: 'משימות' },
    { value: meetingsToday, label: 'פגישות' },
  ]

  return (
    <div className="space-y-8 pb-24">
      {/* כותרת */}
      <div className="text-center pt-4 pb-2">
        <div className="text-xs font-medium tracking-wide text-stone-400 dark:text-stone-500 uppercase animate-enter">Life Control Center</div>
        <h1 className="text-3xl sm:text-[40px] font-bold text-stone-800 dark:text-stone-100 mt-3 animate-enter" style={{ animationDelay: '60ms' }}>
          <span className="inline-block align-top text-2xl -translate-y-1 me-1" aria-hidden="true">
            ✨
          </span>
          {getGreeting()}, יהודה
        </h1>
        <p className="text-stone-400 dark:text-stone-500 text-sm sm:text-base mt-2 animate-enter" style={{ animationDelay: '120ms' }}>
          מה תרצה לסדר היום?
        </p>
      </div>

      {/* שורת קליטה מהירה */}
      <div className="max-w-2xl mx-auto w-full animate-enter" style={{ animationDelay: '180ms' }}>
        <QuickCaptureBar />
      </div>

      {/* חמשת התחומים */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 animate-enter" style={{ animationDelay: '240ms' }}>
        {HOME_DOMAINS.map(({ id, mergedWith }) => {
          const domain = getDomain(id)
          const count = openCount([id, ...(mergedWith ?? [])])
          return <HomeDomainCard key={id} domain={domain} stat={count > 0 ? `${count} פתוחות` : 'אין פריטים פתוחים'} />
        })}
      </div>

      {/* התראות + היום שלי · מיילים · משימות */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* עמודה ימנית: שני פאנלים מוערמים */}
        <div className="flex flex-col gap-4">
          <Panel className="p-5">
            <PanelHead icon={<BellIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />} title="התראות" />
            {alerts.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">אין התראות פתוחות</div>
            ) : (
              <div className="space-y-1.5">
                {alerts.map((a) => {
                  const style = ALERT_STYLE[a.severity]
                  const body = (
                    <div className="flex items-center gap-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/40 px-3 py-2">
                      <span className={`w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold ${style.bg} ${style.fg}`}>{style.glyph}</span>
                      <span className="text-xs text-stone-700 dark:text-stone-200 truncate" title={a.text}>
                        {a.text}
                      </span>
                    </div>
                  )
                  if (a.to) return <Link key={a.id} to={a.to} className="block hover:opacity-80 transition-opacity">{body}</Link>
                  if (a.itemId)
                    return (
                      <button key={a.id} onClick={() => openEdit(a.itemId!)} className="block w-full text-right hover:opacity-80 transition-opacity">
                        {body}
                      </button>
                    )
                  return <div key={a.id}>{body}</div>
                })}
              </div>
            )}
          </Panel>

          <Panel className="p-5 mt-auto">
            <PanelHead icon={<CalendarIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />} title="היום שלי" />
            <div className="grid grid-cols-4 divide-x divide-x-reverse divide-stone-100 dark:divide-stone-800 text-center mb-4">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="text-2xl font-bold text-stone-800 dark:text-stone-100 leading-none">{s.value}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">התקדמות יומית</span>
              <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden" dir="ltr">
                <div className="h-full rounded-full bg-amber-800 transition-all" style={{ width: `${dailyProgress}%` }} />
              </div>
              <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 shrink-0">{dailyProgress}%</span>
            </div>
          </Panel>
        </div>

        {/* מיילים חדשים — נקראים ישירות מ-Gmail, לא נשמרים מקומית */}
        <Panel className="p-5 flex flex-col">
          <PanelHead
            icon={<MailIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />}
            title="מיילים חדשים"
            badge={
              emails && emails.length > 0 ? (
                <span className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {emails.length}
                </span>
              ) : undefined
            }
          />
          <div className="flex-1">
            {emails === null && !emailsFailed && <div className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">טוען מיילים...</div>}
            {(emailsFailed || (emails && emails.length === 0)) && (
              <div className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">אין מיילים חדשים להצגה</div>
            )}
            {emails && emails.length > 0 && (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {emails.map((m) => (
                  <li key={m.id} className="flex items-start gap-2.5 py-2.5">
                    <span
                      className="w-8 h-8 shrink-0 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 text-xs font-bold flex items-center justify-center"
                      title={m.fromAddress}
                    >
                      {m.fromName.trim().charAt(0) || '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-stone-800 dark:text-stone-100 truncate">{m.fromName}</div>
                      <div className="text-xs font-semibold text-stone-700 dark:text-stone-200 truncate">{m.subject}</div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{m.preview}</div>
                    </div>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 shrink-0">{timeOfDay(m.date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="pt-3 mt-auto">
            <ShowAll to="/inbox" />
          </div>
        </Panel>

        {/* המשימות שלי להיום */}
        <Panel className="p-5 flex flex-col">
          <PanelHead icon={<ChecklistIcon className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />} title="המשימות שלי להיום" />
          <div className="flex-1">
            {todayItems.length === 0 ? (
              <div className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">אין כלום מתוכנן להיום</div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {todayItems.slice(0, 4).map((it) => (
                  <li key={it.id} className="flex items-center gap-3 py-3 group">
                    <button
                      onClick={() => toggleDone(it.id)}
                      aria-label="סמן כהושלם"
                      title="סמן כהושלם"
                      className="w-5 h-5 shrink-0 rounded-full border-[1.5px] border-stone-300 dark:border-stone-600 hover:border-amber-800 dark:hover:border-amber-400 transition-colors"
                    />
                    <button onClick={() => openEdit(it.id)} className="flex-1 min-w-0 text-right" title={it.title}>
                      <span className="block text-sm text-stone-800 dark:text-stone-100 truncate">{it.title}</span>
                    </button>
                    <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{it.startTime ?? '—'}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="pt-3 mt-auto">
            <ShowAll to="/tasks" />
          </div>
        </Panel>
      </div>

      {/* היומן שלי — היומן המאוחד, אותו רכיב בדיוק כמו בדף /calendar ובכל domain */}
      <UnifiedCalendar
        title="היומן שלי"
        events={itemsToCalendarEvents(calendarItems, openEdit)}
        onAddEvent={(date) => openCreate(undefined, { date })}
        onToggleTask={toggleDone}
        compact
      />

      <InboxBanner count={pendingInbox.length} />
    </div>
  )
}
