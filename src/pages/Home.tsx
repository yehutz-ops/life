import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { domainList } from '../data/domains'
import { Card, FilterChip } from '../components/ui'
import ItemRow from '../components/ItemRow'
import DomainCard from '../components/DomainCard'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { formatFullHebrewDate, getGreeting, todayISO } from '../utils/date'
import { DomainId, ItemStatus } from '../data/types'

const priorityWeight = { high: 0, medium: 1, low: 2 } as const
const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'

export default function Home() {
  const { items, inboxEntries, brandContentItems, brands } = useStore()
  const [focusDomain, setFocusDomain] = useState<DomainId | null>(null)

  const pendingInbox = inboxEntries.filter((e) => e.status === 'pending')
  const today = todayISO()

  function domainStats(domainId: DomainId) {
    const domainItems = items.filter((it) => it.domain === domainId && it.kind !== 'event')
    const open = domainItems.filter((it) => isActive(it.status))
    const next = [...open].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))[0]
    return { openCount: open.length, next }
  }

  const todayScoped = items.filter((it) => !focusDomain || it.domain === focusDomain)

  const timedToday = useMemo(
    () =>
      todayScoped
        .filter((it) => it.date === today && it.startTime)
        .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
        .slice(0, 3),
    [items, focusDomain],
  )

  const untimedDue = useMemo(
    () =>
      todayScoped
        .filter((it) => isActive(it.status) && it.kind !== 'event' && !it.startTime && it.date && it.date <= today)
        .sort(
          (a, b) => a.date!.localeCompare(b.date!) || priorityWeight[a.priority] - priorityWeight[b.priority],
        )
        .slice(0, 3),
    [items, focusDomain],
  )

  // פריטי תוכן (מותגים) שדורשים תשומת לב היום — לא הפכו למשימה כפולה ב-Items, רק מוצגים כאן מתוך רשומת התוכן עצמה.
  const contentToday = useMemo(
    () =>
      brandContentItems.filter((c) => c.date === today && !c.published && (!focusDomain || focusDomain === 'work')),
    [brandContentItems, focusDomain],
  )

  return (
    <div className="space-y-10 pb-24">
      <div className="text-center pt-4">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {getGreeting()}, יהודה · {formatFullHebrewDate()}
        </p>
        <h1 className="font-elegant text-3xl text-stone-800 dark:text-stone-100 mt-2">Life Control Center</h1>
        <p className="text-stone-400 dark:text-stone-500 text-sm mt-1">מרכז השליטה שלך</p>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <QuickCaptureBar />
        {pendingInbox.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <span className="text-stone-500 dark:text-stone-400">
              📥 {pendingInbox.length} פריטים ממתינים לסידור בתיבת הכניסה
            </span>
            <Link to="/inbox" className="font-medium text-amber-800 dark:text-amber-400 underline">
              לסדר עכשיו
            </Link>
          </div>
        )}
      </div>

      <div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domainList.map((d) => {
            const stats = domainStats(d.id)
            return <DomainCard key={d.id} domain={d} openCount={stats.openCount} next={stats.next} />
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
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
        <div className="flex items-center justify-center gap-3 text-sm -mt-6">
          <span className="font-medium text-amber-800 dark:text-amber-400">
            מצב פוקוס: {domainList.find((d) => d.id === focusDomain)?.name}
          </span>
          <button onClick={() => setFocusDomain(null)} className="text-xs text-stone-500 dark:text-stone-400 underline">
            חזרה לכל התחומים
          </button>
        </div>
      )}

      <Card className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">היום שלי</h2>
          <Link to="/calendar" className="text-xs font-medium text-amber-800 dark:text-amber-400 underline">
            ליומן המלא
          </Link>
        </div>
        {timedToday.length === 0 && untimedDue.length === 0 && contentToday.length === 0 && (
          <p className="text-sm text-stone-400 dark:text-stone-500 py-2">אין כלום שדורש תשומת לב היום 🎉</p>
        )}
        <ul className="divide-y divide-stone-50 dark:divide-stone-800">
          {timedToday.map((it) => (
            <ItemRow key={it.id} item={it} hoverActions />
          ))}
          {untimedDue.map((it) => (
            <ItemRow key={it.id} item={it} hoverActions />
          ))}
          {contentToday.map((c) => {
            const brand = brands.find((b) => b.id === c.brandId)
            return (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">📣 {c.title}</span>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {brand?.name ?? 'מותג'} {c.time ? `· ${c.time}` : ''} · {c.awaitingApproval ? 'ממתין לאישור' : c.status}
                  </div>
                </div>
                <Link to={`/work/brands/${c.brandId}?tab=content&item=${c.id}`} className="text-xs font-medium text-amber-800 dark:text-amber-400 underline shrink-0">
                  לתוכן
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}
