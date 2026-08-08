import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { householdHubCategories, SITE_ACCENT_HEX, SITE_ACCENT_RING } from '../data/householdHubCategories'
import { HomeIcon, ShoppingBagIcon, WrenchIcon, ReceiptIcon } from '../components/hub/hubIcons'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubCategoryGrid from '../components/hub/HubCategoryGrid'
import HubCategoryCard from '../components/hub/HubCategoryCard'
import HubSectionHeader from '../components/hub/HubSectionHeader'
import HubEmptyState from '../components/hub/HubEmptyState'
import ChecklistPanel from '../components/hub/ChecklistPanel'
import SearchField from '../components/hub/SearchField'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { isOverdue } from '../utils/date'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const CURRENCY_SYMBOL: Record<string, string> = { ILS: '₪', USD: '$', EUR: '€' }

function formatAmount(amount?: number, currency?: string) {
  if (amount === undefined) return null
  const symbol = currency ? (CURRENCY_SYMBOL[currency] ?? currency) : ''
  return `${amount.toLocaleString('he-IL')}${symbol}`
}

export default function HouseholdPage() {
  const { items, addItem, toggleDone } = useStore()
  const [query, setQuery] = useState('')
  const { hash } = useLocation()
  const q = query.trim()

  useEffect(() => {
    if (!hash) return
    document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [hash])

  const homeItems = useMemo(() => items.filter((it) => it.domain === 'home'), [items])
  const matches = (title: string) => !q || title.includes(q)

  const shoppingItems = useMemo(() => homeItems.filter((it) => it.listType === 'shopping' && matches(it.title)), [homeItems, q])
  const maintenanceItems = useMemo(() => homeItems.filter((it) => it.listType === 'maintenance' && matches(it.title)), [homeItems, q])
  const billItems = useMemo(
    () => homeItems.filter((it) => it.listType === 'bills' && matches(it.title)).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [homeItems, q],
  )

  const shoppingOpenCount = shoppingItems.filter((it) => isActive(it.status)).length
  const maintenanceOpenCount = maintenanceItems.filter((it) => isActive(it.status)).length
  const billsOpenCount = billItems.filter((it) => isActive(it.status)).length

  function quickAdd(listType: 'shopping' | 'maintenance', destination: string) {
    return (title: string) =>
      addItem({ title, kind: 'task', domain: 'home', listType, destination, priority: 'medium', status: 'open' })
  }

  return (
    <DomainHubLayout name="בית" icon={HomeIcon} searchSlot={<SearchField value={query} onChange={setQuery} placeholder="חפש בתוך בית..." />}>
      <QuickCaptureBar />

      <HubCategoryGrid>
        <HubCategoryCard
          name="רשימת קניות"
          description="הפתק על המקרר"
          stat={shoppingOpenCount > 0 ? `${shoppingOpenCount} פתוחות` : 'הרשימה ריקה'}
          imageSrc="/hub-images/household/shopping.jpg"
          accentHex={SITE_ACCENT_HEX}
          ringClass={SITE_ACCENT_RING}
          to="/household#shopping"
          icon={ShoppingBagIcon}
        />
        <HubCategoryCard
          name="תחזוקה וארגון"
          description="תיקונים, בעלי מקצוע וסידורי בית"
          stat={maintenanceOpenCount > 0 ? `${maintenanceOpenCount} פתוחות` : 'אין משימות פתוחות'}
          imageSrc="/hub-images/household/maintenance.jpg"
          accentHex={SITE_ACCENT_HEX}
          ringClass={SITE_ACCENT_RING}
          to="/household#maintenance"
          icon={WrenchIcon}
        />
        <HubCategoryCard
          name="חשבונות הבית"
          description="תשלומים ומעקב חשבונות"
          stat={billsOpenCount > 0 ? `${billsOpenCount} ממתינים לתשלום` : 'אין חשבונות ממתינים'}
          imageSrc="/hub-images/household/bills.jpg"
          accentHex={SITE_ACCENT_HEX}
          ringClass={SITE_ACCENT_RING}
          to="/household#bills"
          icon={ReceiptIcon}
        />
      </HubCategoryGrid>

      <div id="shopping" className="scroll-mt-6">
        <ChecklistPanel
          title="רשימת קניות"
          items={shoppingItems}
          onToggle={toggleDone}
          onAdd={quickAdd('shopping', 'רשימת קניות')}
          emptyText="רשימת הקניות ריקה"
          addPlaceholder="הוסף לרשימת הקניות..."
        />
      </div>

      <div id="maintenance" className="scroll-mt-6">
        <ChecklistPanel
          title="תחזוקה וארגון"
          items={maintenanceItems}
          onToggle={toggleDone}
          onAdd={quickAdd('maintenance', 'תחזוקה וארגון')}
          emptyText="אין כרגע משימות תחזוקה פתוחות"
          addPlaceholder="הוסף לתחזוקה וארגון..."
        />
      </div>

      <div id="bills" className="scroll-mt-6 bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
        <HubSectionHeader title="חשבונות הבית" />
        {billItems.length === 0 ? (
          <HubEmptyState text="אין כרגע חשבונות פתוחים" />
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
    </DomainHubLayout>
  )
}
