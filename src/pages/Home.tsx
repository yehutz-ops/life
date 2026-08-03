import { useMemo } from 'react'
import { useStore } from '../data/StoreContext'
import { getDomain } from '../data/domains'
import QuickCaptureBar from '../components/QuickCaptureBar'
import SquareCard from '../components/SquareCard'
import TodayStrip, { TodayEntry } from '../components/TodayStrip'
import InboxBanner from '../components/InboxBanner'
import { getGreeting, todayISO } from '../utils/date'
import { DomainId, ItemStatus } from '../data/types'

const priorityWeight = { high: 0, medium: 1, low: 2 } as const
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

export default function Home() {
  const { items, inboxEntries, brandContentItems, brands } = useStore()
  const today = todayISO()
  const pendingInbox = inboxEntries.filter((e) => e.status === 'pending')

  function openCount(domainIds: DomainId[]) {
    return items.filter((it) => domainIds.includes(it.domain) && it.kind !== 'event' && isActive(it.status)).length
  }

  const timedToday = useMemo(
    () =>
      items
        .filter((it) => it.date === today && it.startTime)
        .sort((a, b) => a.startTime!.localeCompare(b.startTime!))
        .slice(0, 4),
    [items, today],
  )

  const untimedDue = useMemo(
    () =>
      items
        .filter((it) => isActive(it.status) && it.kind !== 'event' && !it.startTime && it.date && it.date <= today)
        .sort((a, b) => a.date!.localeCompare(b.date!) || priorityWeight[a.priority] - priorityWeight[b.priority])
        .slice(0, 4),
    [items, today],
  )

  // פריטי תוכן (מותגים) שדורשים תשומת לב היום — לא הפכו למשימה כפולה ב-Items, רק מוצגים כאן מתוך רשומת התוכן עצמה.
  const contentToday = useMemo(() => brandContentItems.filter((c) => c.date === today && !c.published), [brandContentItems, today])

  const todayEntries: TodayEntry[] = useMemo(() => {
    const fromItems: TodayEntry[] = [...timedToday, ...untimedDue].map((it) => ({
      id: it.id,
      title: it.title,
      meta: it.startTime ? `${it.startTime} · ${getDomain(it.domain).name}` : getDomain(it.domain).name,
      accentHex: getDomain(it.domain).homeAccent?.hex ?? '#78716c',
    }))
    const fromContent: TodayEntry[] = contentToday.map((c) => {
      const brand = brands.find((b) => b.id === c.brandId)
      const parts = [brand?.name ?? 'מותג']
      if (c.time) parts.push(c.time)
      if (c.awaitingApproval) parts.push('ממתין לאישור')
      return {
        id: c.id,
        title: c.title,
        meta: parts.join(' · '),
        accentHex: getDomain('work').homeAccent?.hex ?? '#78716c',
        to: `/work/brands/${c.brandId}?tab=content&item=${c.id}`,
      }
    })
    return [...fromItems, ...fromContent].slice(0, 4)
  }, [timedToday, untimedDue, contentToday, brands])

  return (
    <div className="space-y-8 pb-24">
      <div className="text-center pt-6 pb-2">
        <div className="text-xs font-medium tracking-wide text-stone-400 dark:text-stone-500 uppercase animate-enter">
          Life Control Center
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 dark:text-stone-100 mt-3 animate-enter" style={{ animationDelay: '60ms' }}>
          {getGreeting()}, יהודה
        </h1>
        <p className="text-stone-400 dark:text-stone-500 text-sm sm:text-base mt-2 animate-enter" style={{ animationDelay: '120ms' }}>
          מה תרצה לסדר היום?
        </p>
      </div>

      <div className="max-w-2xl mx-auto w-full animate-enter" style={{ animationDelay: '180ms' }}>
        <QuickCaptureBar />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 animate-enter" style={{ animationDelay: '240ms' }}>
        {HOME_DOMAINS.map(({ id, mergedWith }) => {
          const domain = getDomain(id)
          const count = openCount([id, ...(mergedWith ?? [])])
          return <SquareCard key={id} domain={domain} stat={count > 0 ? `${count} פתוחות` : 'אין פריטים פתוחים'} />
        })}
      </div>

      <TodayStrip entries={todayEntries} />

      <InboxBanner count={pendingInbox.length} />
    </div>
  )
}
