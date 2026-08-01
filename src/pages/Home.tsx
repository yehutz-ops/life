import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { domainList, getDomain } from '../data/domains'
import { Card, CardTitle, DomainBadge, FilterChip, ProgressBar, EmptyLine } from '../components/ui'
import ItemRow from '../components/ItemRow'
import { formatFullHebrewDate, getGreeting, isOverdue, todayISO } from '../utils/date'
import { useQuickAdd } from '../data/QuickAddContext'
import { DomainId, Item } from '../data/types'

const priorityWeight = { high: 0, medium: 1, low: 2 } as const

export default function Home() {
  const { items, projects } = useStore()
  const { open: openQuickAdd } = useQuickAdd()
  const [focusDomain, setFocusDomain] = useState<DomainId | null>(null)

  const inFocus = (it: Item) => !focusDomain || it.domain === focusDomain
  const classified = items.filter((it) => it.domain)
  const inboxItems = items.filter((it) => !it.domain)

  const openNonEvent = classified.filter((it) => it.status === 'open' && it.kind !== 'event' && inFocus(it))

  const topItems = useMemo(() => {
    return [...openNonEvent]
      .filter((it) => it.priority)
      .sort(
        (a, b) =>
          priorityWeight[a.priority!] - priorityWeight[b.priority!] || (a.date ?? '9999').localeCompare(b.date ?? '9999'),
      )
      .slice(0, 3)
  }, [items, focusDomain])
  const topIds = new Set(topItems.map((it) => it.id))

  const today = todayISO()
  const todaysItems = classified.filter((it) => it.date === today && inFocus(it))
  const timedToday = [...todaysItems].filter((it) => it.time).sort((a, b) => a.time!.localeCompare(b.time!))
  const untimedToday = todaysItems.filter((it) => !it.time)

  const overdue = openNonEvent.filter((it) => isOverdue(it.date))
  const myFollowups = openNonEvent.filter((it) => it.kind === 'waiting' && it.waitingType === 'my_followup')
  const otherPending = openNonEvent.filter((it) => it.kind === 'waiting' && it.waitingType === 'other_pending')
  const myApprovals = openNonEvent.filter((it) => it.kind === 'waiting' && it.waitingType === 'my_approval')

  const activeProjects = projects.filter((p) => p.status !== 'done' && (!focusDomain || p.domain === focusDomain))

  const upcoming = useMemo(
    () =>
      classified
        .filter((it) => it.date && it.date >= today && inFocus(it) && it.status !== 'done')
        .sort((a, b) => (a.date! + (a.time ?? '')).localeCompare(b.date! + (b.time ?? '')))
        .slice(0, 6),
    [items, focusDomain],
  )

  function domainStats(domainId: DomainId) {
    const domainItems = classified.filter((it) => it.domain === domainId && it.kind !== 'event')
    const open = domainItems.filter((it) => it.status === 'open')
    const next = [...open].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))[0]
    const progress = domainItems.length ? Math.round(((domainItems.length - open.length) / domainItems.length) * 100) : 0
    return { openCount: open.length, next, progress }
  }

  const visibleDomains = focusDomain ? domainList.filter((d) => d.id === focusDomain) : domainList

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{getGreeting()} 👋</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">{formatFullHebrewDate()}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={!focusDomain} onClick={() => setFocusDomain(null)}>
          הכול
        </FilterChip>
        {domainList.map((d) => (
          <FilterChip key={d.id} active={focusDomain === d.id} onClick={() => setFocusDomain(d.id)}>
            {d.icon} {d.name}
          </FilterChip>
        ))}
      </div>
      {focusDomain && (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium text-indigo-700 dark:text-indigo-300">מצב פוקוס: {getDomain(focusDomain).name}</span>
          <button onClick={() => setFocusDomain(null)} className="text-xs text-gray-500 dark:text-gray-400 underline">
            חזרה לכל התחומים
          </button>
        </div>
      )}

      <Card className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-sm font-bold text-gray-800 dark:text-gray-100">מה צריך לזכור?</div>
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">הקלד או הקלט משפט חופשי — הוא יישמר בתיבת הכניסה</div>
        </div>
        <button onClick={openQuickAdd} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
          🎤 + הוספה מהירה
        </button>
      </Card>

      {inboxItems.length > 0 && (
        <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 rounded-2xl px-5 py-3">
          <span className="text-sm text-amber-800 dark:text-amber-300">📥 יש לך {inboxItems.length} פריטים בתיבת הכניסה שממתינים לסידור</span>
          <Link to="/inbox" className="text-xs font-medium text-amber-900 dark:text-amber-200 underline">
            לסדר עכשיו
          </Link>
        </div>
      )}

      {topItems.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-bold">⭐ הכי חשוב היום:</span> {topItems.map((it) => it.title).join(' · ')}
        </div>
      )}

      <Card>
        <CardTitle>סדר היום שלי</CardTitle>
        {timedToday.length === 0 && untimedToday.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-500">אין כלום מתוכנן להיום</p>}
        {timedToday.length > 0 && (
          <ul className="divide-y divide-gray-50 dark:divide-gray-800 mb-2">
            {timedToday.map((it) => (
              <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
            ))}
          </ul>
        )}
        {untimedToday.length > 0 && (
          <>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-3 mb-1">להשלמה היום</div>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {untimedToday.map((it) => (
                <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
              ))}
            </ul>
          </>
        )}
      </Card>

      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">דחוף ומחכה לטיפול</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardTitle hint={`${overdue.length}`}>⏰ עבר את התאריך</CardTitle>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {overdue.map((it) => (
                <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
              ))}
              {overdue.length === 0 && <EmptyLine text="הכול בזמן 🎉" />}
            </ul>
          </Card>
          <Card>
            <CardTitle hint={`${myFollowups.length}`}>📞 אני צריך לחזור אליהם</CardTitle>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {myFollowups.map((it) => (
                <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
              ))}
              {myFollowups.length === 0 && <EmptyLine text="אין מעקבים פתוחים" />}
            </ul>
          </Card>
          <Card>
            <CardTitle hint={`${otherPending.length}`}>⏳ מחכים לתגובה של מישהו אחר</CardTitle>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {otherPending.map((it) => (
                <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
              ))}
              {otherPending.length === 0 && <EmptyLine text="אין כלום שממתין למישהו אחר" />}
            </ul>
          </Card>
          <Card>
            <CardTitle hint={`${myApprovals.length}`}>✅ מחכה לאישור/החלטה שלי</CardTitle>
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {myApprovals.map((it) => (
                <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
              ))}
              {myApprovals.length === 0 && <EmptyLine text="אין כלום שממתין להחלטה שלך" />}
            </ul>
          </Card>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">תחומי החיים</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleDomains.map((d) => {
            const stats = domainStats(d.id)
            return (
              <Link key={d.id} to={d.path} className="block">
                <Card className={`h-full hover:shadow-md transition-shadow ${d.classes.bg} border-0`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">{d.icon}</span>
                    <span className={`font-bold ${d.classes.text}`}>{d.name}</span>
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-1">{stats.openCount} פתוחות</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 truncate">{stats.next ? `הבא: ${stats.next.title}` : 'אין פריטים פתוחים'}</div>
                  <ProgressBar value={stats.progress} colorClass={d.classes.bar} />
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      <Card>
        <CardTitle hint={`${activeProjects.length} פעילים`}>פרויקטים פעילים</CardTitle>
        <ul className="space-y-4">
          {activeProjects.map((p) => {
            const d = getDomain(p.domain)
            return (
              <li key={p.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100">{p.name}</span>
                  {p.status === 'stuck' && <span className="text-xs font-medium text-red-500">תקוע</span>}
                </div>
                <div className="flex items-center gap-2 mt-1 mb-2">
                  <DomainBadge domain={p.domain} />
                  <span className="text-xs text-gray-400 dark:text-gray-500">{p.nextStep}</span>
                </div>
                <ProgressBar value={p.progress} colorClass={d.classes.bar} />
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{p.dueDate ? `יעד: ${p.dueDate}` : 'תאריך יעד: טרם נקבע'}</div>
              </li>
            )
          })}
          {activeProjects.length === 0 && <EmptyLine text="אין פרויקטים פעילים בתחום הזה" />}
        </ul>
      </Card>

      <Card>
        <CardTitle hint="הקרובים ביותר">יומן קרוב</CardTitle>
        <ul className="divide-y divide-gray-50 dark:divide-gray-800">
          {upcoming.map((it) => (
            <ItemRow key={it.id} item={it} starred={topIds.has(it.id)} />
          ))}
          {upcoming.length === 0 && <EmptyLine text="אין כלום קרוב" />}
        </ul>
        <Link to="/calendar" className="inline-block mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline">
          לצפייה ביומן המלא ←
        </Link>
      </Card>
    </div>
  )
}
