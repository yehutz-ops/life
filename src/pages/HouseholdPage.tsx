import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { useConfirm } from '../data/ConfirmContext'
import { HomeIcon } from '../components/hub/hubIcons'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubSectionHeader from '../components/hub/HubSectionHeader'
import HubEmptyState from '../components/hub/HubEmptyState'
import ChecklistPanel from '../components/hub/ChecklistPanel'
import TaskTileGrid from '../components/hub/TaskTileGrid'
import MiniDomainCalendar from '../components/hub/MiniDomainCalendar'
import SearchField from '../components/hub/SearchField'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { isOverdue, todayISO } from '../utils/date'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const CURRENCY_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' }

function formatAmount(amount?: number, currency?: string) {
  if (amount === undefined) return null
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency) : ''
  return `${amount.toLocaleString('he-IL')}${symbol}`
}

// נתוני הדגמה זמניים בלבד — כדי להראות איך אזור "הוצאות הבית" ייראה עם פילוח קטגוריות ומגמה,
// עד שיהיו מספיק חשבונות אמיתיים עם קטגוריות. הסכום החודשי הראשי ורשימת "הוצאות אחרונות" למטה
// ממשיכים להציג נתונים אמיתיים בלבד.
const DEMO_CATEGORIES = [
  { name: 'סופר', amount: 1240, color: '#92400E' },
  { name: 'חשמל', amount: 350, color: '#B45309' },
  { name: 'מים', amount: 180, color: '#D97706' },
  { name: 'אינטרנט', amount: 120, color: '#A8A29E' },
  { name: 'ועד בית', amount: 450, color: '#78716C' },
]
const DEMO_TOTAL = DEMO_CATEGORIES.reduce((sum, c) => sum + c.amount, 0)
const DEMO_TREND = [
  { label: 'אפר', total: 1890 },
  { label: 'מאי', total: 2100 },
  { label: 'יונ', total: 1750 },
  { label: 'יול', total: 2340 },
  { label: 'אוג', total: 2000 },
]

function ExpenseDonut() {
  const size = 120
  const r = 42
  const strokeWidth = 16
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label="פילוח הוצאות לפי קטגוריה (נתוני הדגמה)">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-100 dark:text-stone-800" />
          {DEMO_CATEGORIES.map((c) => {
            const len = (c.amount / DEMO_TOTAL) * circumference
            const dash = `${len} ${circumference - len}`
            const el = (
              <circle
                key={c.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={c.color}
                strokeWidth={strokeWidth}
                strokeDasharray={dash}
                strokeDashoffset={-offset}
              />
            )
            offset += len
            return el
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-stone-800 dark:fill-stone-100" style={{ fontSize: 15, fontWeight: 600 }}>
          {DEMO_TOTAL.toLocaleString('he-IL')}₪
        </text>
        <text x="50%" y="60%" textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
          החודש
        </text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        {DEMO_CATEGORIES.map((c) => (
          <li key={c.name} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-stone-600 dark:text-stone-300">{c.name}</span>
            <span className="text-stone-400 dark:text-stone-500">{c.amount.toLocaleString('he-IL')}₪</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExpenseTrend() {
  const max = Math.max(...DEMO_TREND.map((m) => m.total))
  return (
    <div className="flex items-end justify-between gap-2 h-24">
      {DEMO_TREND.map((m) => (
        <div key={m.label} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full rounded-t-md bg-amber-800/80 dark:bg-amber-700/70" style={{ height: `${(m.total / max) * 100}%` }} title={`${m.total.toLocaleString('he-IL')}₪`} />
          <span className="text-[10px] text-stone-400 dark:text-stone-500">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function HouseholdPage() {
  const { items, addItem, toggleDone, deleteItem } = useStore()
  const { openEdit } = useDetailModal()
  const confirm = useConfirm()
  const [query, setQuery] = useState('')
  const q = query.trim()
  const today = todayISO()

  const homeItems = useMemo(() => items.filter((it) => it.domain === 'home'), [items])
  const matches = (title: string) => !q || title.includes(q)

  const shoppingItems = useMemo(() => homeItems.filter((it) => it.listType === 'shopping' && matches(it.title)), [homeItems, q])
  const maintenanceItems = useMemo(() => homeItems.filter((it) => it.listType === 'maintenance' && matches(it.title)), [homeItems, q])
  const billItems = useMemo(
    () => homeItems.filter((it) => it.listType === 'bills' && matches(it.title)).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [homeItems, q],
  )
  // אותו קריטריון בדיוק כמו ביומן הכללי (CalendarPage): כל פריט עם תאריך שעדיין פעיל — לא רק kind: event.
  const homeCalendarItems = useMemo(() => homeItems.filter((it) => it.date && isActive(it.status)), [homeItems])

  const thisMonth = today.slice(0, 7)
  const monthlyTotals = useMemo(() => {
    const totals = new Map<string, number>()
    for (const it of billItems) {
      if (it.amount === undefined || !it.date?.startsWith(thisMonth)) continue
      const currency = it.currency ?? 'ILS'
      totals.set(currency, (totals.get(currency) ?? 0) + it.amount)
    }
    return Array.from(totals.entries())
  }, [billItems, thisMonth])

  function quickAdd(listType: 'shopping' | 'maintenance', destination: string) {
    return (title: string) => addItem({ title, kind: 'task', domain: 'home', listType, destination, priority: 'medium', status: 'open' })
  }

  async function handleDelete(id: string) {
    const item = items.find((it) => it.id === id)
    const ok = await confirm({
      title: 'למחוק את הפריט?',
      message: `"${item?.title ?? ''}" יימחק לצמיתות. אי אפשר לשחזר את זה.`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) await deleteItem(id)
  }

  return (
    <DomainHubLayout name="בית" icon={HomeIcon} searchSlot={<SearchField value={query} onChange={setQuery} placeholder="חפש בתוך בית..." />}>
      <QuickCaptureBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
            <HubSectionHeader
              title="הוצאות הבית"
              action={<span className="text-[11px] text-stone-400 dark:text-stone-500">פילוח ומגמה — נתוני הדגמה זמניים</span>}
            />

            <div className="mb-4">
              {monthlyTotals.length === 0 ? (
                <HubEmptyState text="אין עדיין הוצאות רשומות החודש" />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-stone-800 dark:text-stone-100">
                    {monthlyTotals.map(([currency, sum]) => formatAmount(sum, currency)).join(' + ')}
                  </span>
                  <span className="text-xs text-stone-400 dark:text-stone-500">סך הכול החודש (נתונים אמיתיים)</span>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">פילוח לפי קטגוריה</div>
                <ExpenseDonut />
              </div>
              <div className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">מגמת הוצאות</div>
                <ExpenseTrend />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-50 dark:border-stone-800">
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">הוצאות אחרונות</div>
              {billItems.length === 0 ? (
                <HubEmptyState text="אין כרגע חשבונות רשומים" />
              ) : (
                <ul className="divide-y divide-stone-50 dark:divide-stone-800">
                  {billItems.map((it) => {
                    const done = it.status === 'done'
                    const overdue = !done && isOverdue(it.date)
                    const amountLabel = formatAmount(it.amount, it.currency)
                    return (
                      <li key={it.id} className="flex items-center gap-3 py-3">
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleDone(it.id)}
                          className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-amber-800 focus:ring-amber-800 shrink-0"
                          aria-label={it.title}
                        />
                        <div className={`min-w-0 flex-1 ${done ? 'opacity-50' : ''}`}>
                          <div className={`text-sm truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{it.title}</div>
                          {it.date && <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">יעד: {it.date}</div>}
                        </div>
                        {amountLabel && <span className="text-sm font-medium text-stone-700 dark:text-stone-200 shrink-0">{amountLabel}</span>}
                        <span
                          className={`text-xs font-medium shrink-0 ${
                            done ? 'text-emerald-700 dark:text-emerald-400' : overdue ? 'text-amber-800 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
                          }`}
                        >
                          {done ? 'שולם' : overdue ? 'באיחור' : 'ממתין לתשלום'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <TaskTileGrid
            title="תחזוקה וארגון"
            items={maintenanceItems}
            onItemClick={openEdit}
            emptyText="אין כרגע משימות תחזוקה פתוחות"
            onAdd={quickAdd('maintenance', 'תחזוקה וארגון')}
            addPlaceholder="הוסף לתחזוקה וארגון..."
          />
        </div>

        <ChecklistPanel
          title="רשימת קניות"
          items={shoppingItems}
          onToggle={toggleDone}
          onEdit={openEdit}
          onDelete={handleDelete}
          onAdd={quickAdd('shopping', 'רשימת קניות')}
          emptyText="רשימת הקניות ריקה"
          addPlaceholder="הוסף לרשימת הקניות..."
          className="lg:col-span-1"
          variant="notepad"
        />
      </div>

      <MiniDomainCalendar title="יומן הבית" items={homeCalendarItems} />
    </DomainHubLayout>
  )
}
