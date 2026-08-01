import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { domainList } from '../data/domains'
import { Card, FilterChip } from '../components/ui'
import ItemRow from '../components/ItemRow'
import DomainCard from '../components/DomainCard'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { formatFullHebrewDate, getGreeting, todayISO } from '../utils/date'
import { DomainId } from '../data/types'

const priorityWeight = { high: 0, medium: 1, low: 2 } as const

export default function Home() {
  const { items } = useStore()
  const [focusDomain, setFocusDomain] = useState<DomainId | null>(null)

  const inboxItems = items.filter((it) => !it.domain)
  const today = todayISO()

  function domainStats(domainId: DomainId) {
    const domainItems = items.filter((it) => it.domain === domainId && it.kind !== 'event')
    const open = domainItems.filter((it) => it.status === 'open')
    const next = [...open].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))[0]
    return { openCount: open.length, next }
  }

  const todayScoped = items.filter((it) => it.domain && (!focusDomain || it.domain === focusDomain))

  const timedToday = useMemo(
    () =>
      todayScoped
        .filter((it) => it.date === today && it.time)
        .sort((a, b) => a.time!.localeCompare(b.time!))
        .slice(0, 3),
    [items, focusDomain],
  )

  const untimedDue = useMemo(
    () =>
      todayScoped
        .filter((it) => it.status === 'open' && it.kind !== 'event' && !it.time && it.date && it.date <= today)
        .sort(
          (a, b) => a.date!.localeCompare(b.date!) || priorityWeight[a.priority ?? 'low'] - priorityWeight[b.priority ?? 'low'],
        )
        .slice(0, 3),
    [items, focusDomain],
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
        {inboxItems.length > 0 && (
          <div className="flex items-center justify-center gap-2 mt-4 text-sm">
            <span className="text-stone-500 dark:text-stone-400">
              📥 {inboxItems.length} פריטים ממתינים לסידור בתיבת הכניסה
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
        {timedToday.length === 0 && untimedDue.length === 0 && (
          <p className="text-sm text-stone-400 dark:text-stone-500 py-2">אין כלום שדורש תשומת לב היום 🎉</p>
        )}
        <ul className="divide-y divide-stone-50 dark:divide-stone-800">
          {timedToday.map((it) => (
            <ItemRow key={it.id} item={it} hoverActions />
          ))}
          {untimedDue.map((it) => (
            <ItemRow key={it.id} item={it} hoverActions />
          ))}
        </ul>
      </Card>
    </div>
  )
}
