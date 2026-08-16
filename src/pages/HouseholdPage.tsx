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
import DonutChart from '../components/finance/DonutChart'
import BarChart from '../components/finance/BarChart'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const CURRENCY_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' }

function formatAmount(amount?: number, currency?: string) {
  if (amount === undefined) return null
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency) : ''
  return `${amount.toLocaleString('he-IL')}${symbol}`
}

const OTHER_CATEGORY = 'אחר'
const CATEGORY_COLORS: Record<string, string> = {
  'סופר': '#92400E',
  'חשמל': '#B45309',
  'מים': '#D97706',
  'אינטרנט': '#A8A29E',
  'ועד בית': '#78716C',
  [OTHER_CATEGORY]: '#57534E',
}
const MONTH_LABELS = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ']

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

  const categoryBreakdown = useMemo(() => {
    const totals = new Map<string, number>()
    for (const it of billItems) {
      if (it.amount === undefined || !it.date?.startsWith(thisMonth)) continue
      const cat = it.category || OTHER_CATEGORY
      totals.set(cat, (totals.get(cat) ?? 0) + it.amount)
    }
    return Array.from(totals.entries())
      .map(([name, amount]) => ({ name, amount, color: CATEGORY_COLORS[name] ?? CATEGORY_COLORS[OTHER_CATEGORY] }))
      .sort((a, b) => b.amount - a.amount)
  }, [billItems, thisMonth])

  // 5 החודשים האחרונים, כולל החודש הנוכחי — סכום גולמי של amount לכל חשבון, בלי המרת מטבע.
  const expenseTrend = useMemo(() => {
    const base = new Date(today + 'T00:00:00')
    const months = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(base.getFullYear(), base.getMonth() - (4 - i), 1)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    })
    return months.map((m) => ({
      label: MONTH_LABELS[Number(m.slice(5, 7)) - 1],
      value: billItems.filter((it) => it.amount !== undefined && it.date?.startsWith(m)).reduce((sum, it) => sum + (it.amount ?? 0), 0),
    }))
  }, [billItems, today])

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
            <HubSectionHeader title="הוצאות הבית" />

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
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">פילוח לפי קטגוריה (החודש)</div>
                {categoryBreakdown.length === 0 ? (
                  <HubEmptyState text="אין עדיין הוצאות מסווגות החודש" />
                ) : (
                  <DonutChart data={categoryBreakdown} size={120} strokeWidth={16} />
                )}
              </div>
              <div className="rounded-2xl border border-stone-100 dark:border-stone-800 p-4">
                <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">מגמת הוצאות</div>
                <BarChart data={expenseTrend} height={96} />
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
                      <li
                        key={it.id}
                        onClick={() => openEdit(it.id)}
                        className="flex items-center gap-3 py-3 cursor-pointer -mx-1 px-1 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800/60"
                      >
                        <input
                          type="checkbox"
                          checked={done}
                          onChange={() => toggleDone(it.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-amber-800 focus:ring-amber-800 shrink-0"
                          aria-label={it.title}
                        />
                        <div className={`min-w-0 flex-1 ${done ? 'opacity-50' : ''}`}>
                          <div className={`text-sm truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{it.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {it.date && <span className="text-xs text-stone-400 dark:text-stone-500">יעד: {it.date}</span>}
                            {it.category && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400">{it.category}</span>
                            )}
                          </div>
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
