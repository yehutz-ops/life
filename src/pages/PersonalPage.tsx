import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { PersonIcon, BookIcon, QuoteIcon, NewsIcon, BulbIcon, TargetIcon } from '../components/hub/hubIcons'
import { knowledgeCategories, KnowledgeCategoryId } from '../data/personalKnowledgeCategories'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubSectionHeader from '../components/hub/HubSectionHeader'
import HubEmptyState from '../components/hub/HubEmptyState'
import UnifiedCalendar from '../components/calendar/UnifiedCalendar'
import { itemsToCalendarEvents } from '../components/calendar/itemAdapter'
import SearchField from '../components/hub/SearchField'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { ProgressBar } from '../components/ui'
import { todayISO } from '../utils/date'
import { DomainId, Item, ItemStatus } from '../data/types'

const KNOWLEDGE_ICONS: Record<KnowledgeCategoryId, (props: { className?: string }) => JSX.Element> = {
  library: BookIcon,
  quotes: QuoteIcon,
  articles: NewsIcon,
  ideas: BulbIcon,
}

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const PERSONAL_SCOPE: DomainId[] = ['personal', 'health', 'personalDevelopment']
const WEEKDAY_LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']

function compactDateLabel(iso: string, today: string) {
  const diff = Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === -1) return 'אתמול'
  if (diff < -1) return `לפני ${Math.abs(diff)} ימים`
  return `${WEEKDAY_LETTERS[new Date(iso + 'T00:00:00').getDay()]}׳`
}

function TimelineRow({ item, today, onToggle, onEdit }: { item: Item; today: string; onToggle: (id: string) => void; onEdit: (id: string) => void }) {
  const done = item.status === 'done'
  return (
    <li className="group flex items-center gap-3 py-2">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-800 shrink-0" />
      <span className="text-xs text-stone-400 dark:text-stone-500 w-16 shrink-0">
        {compactDateLabel(item.date!, today)}
        {item.startTime ? ` · ${item.startTime}` : ''}
      </span>
      <span className={`text-sm flex-1 min-w-0 truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{item.title}</span>
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onToggle(item.id)}
          title="סמן כהושלם"
          aria-label="סמן כהושלם"
          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
        >
          ✓
        </button>
        <button
          onClick={() => onEdit(item.id)}
          title="עריכה"
          aria-label="עריכה"
          className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
        >
          ✎
        </button>
      </div>
    </li>
  )
}

function EditorialTile({
  to,
  icon: Icon,
  title,
  preview,
}: {
  to: string
  icon: (props: { className?: string }) => JSX.Element
  title: string
  preview: string
}) {
  return (
    <Link
      to={to}
      className="group block rounded-2xl border border-stone-200/60 dark:border-stone-800 overflow-hidden bg-white dark:bg-stone-900 transition-all duration-150 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950"
    >
      <div className="h-16 bg-gradient-to-br from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center">
        <Icon className="w-5 h-5 text-stone-400 dark:text-stone-500 transition-transform duration-150 group-hover:scale-110" />
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{title}</div>
        <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{preview}</div>
      </div>
    </Link>
  )
}

export default function PersonalPage() {
  const { items, projects, toggleDone } = useStore()
  const { openEdit, openCreate } = useDetailModal()
  const [query, setQuery] = useState('')
  const q = query.trim()
  const today = todayISO()

  const scopedItems = useMemo(() => items.filter((it) => PERSONAL_SCOPE.includes(it.domain)), [items])
  const matches = (title: string) => !q || title.includes(q)

  const timelineItems = useMemo(() => {
    const todayMs = new Date(today + 'T00:00:00').getTime()
    return scopedItems
      .filter((it) => isActive(it.status) && it.date && matches(it.title))
      .sort((a, b) => {
        const da = Math.abs(new Date(a.date! + 'T00:00:00').getTime() - todayMs)
        const db = Math.abs(new Date(b.date! + 'T00:00:00').getTime() - todayMs)
        return da - db || a.date!.localeCompare(b.date!) || (a.startTime ?? '').localeCompare(b.startTime ?? '')
      })
      .slice(0, 5)
      .sort((a, b) => a.date!.localeCompare(b.date!) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
    // ממיינים פעם ראשונה לפי קרבה לזמן (כדי לבחור את 5 הפריטים הרלוונטיים ביותר, לא רק את הישנים ביותר),
    // ואז שוב כרונולוגית כדי שהרשימה המוצגת תיקרא ברצף טבעי מהעבר להווה ולעתיד.
  }, [scopedItems, q, today])

  const calendarItems = useMemo(() => scopedItems.filter((it) => it.date && isActive(it.status)), [scopedItems])

  const knowledgeCounts = useMemo(() => {
    const map: Record<string, number> = {}
    for (const it of items) {
      if (it.domain !== 'personal' || !it.listType) continue
      map[it.listType] = (map[it.listType] ?? 0) + 1
    }
    return map
  }, [items])

  const devProject = useMemo(() => projects.find((p) => p.domain === 'personalDevelopment'), [projects])
  const devItems = useMemo(
    () => scopedItems.filter((it) => it.domain === 'personalDevelopment' && isActive(it.status) && matches(it.title)),
    [scopedItems, q],
  )

  const personalProjects = useMemo(() => projects.filter((p) => p.domain === 'personal'), [projects])

  return (
    <DomainHubLayout name="אישי" icon={PersonIcon} searchSlot={<SearchField value={query} onChange={setQuery} placeholder="חפש בתוך אישי..." />}>
      <QuickCaptureBar />

      <div className="space-y-6">
        <div>
          <HubSectionHeader title="מה קרוב" />
          {timelineItems.length === 0 ? (
            <HubEmptyState text="אין כרגע כלום קרוב" />
          ) : (
            <ul className="divide-y divide-stone-100/70 dark:divide-stone-800/70">
              {timelineItems.map((it) => (
                <TimelineRow key={it.id} item={it} today={today} onToggle={toggleDone} onEdit={openEdit} />
              ))}
            </ul>
          )}
        </div>

        <div>
          <HubSectionHeader title="ידע ותרבות" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {knowledgeCategories.map((c) => {
              const count = knowledgeCounts[c.listType] ?? 0
              return (
                <EditorialTile
                  key={c.id}
                  to={`/personal/${c.id}`}
                  icon={KNOWLEDGE_ICONS[c.id]}
                  title={c.name}
                  preview={count > 0 ? `${count} פריטים` : c.emptyText}
                />
              )
            })}
          </div>
        </div>

        <div className="pt-5 border-t border-stone-100 dark:border-stone-800">
          <HubSectionHeader title="התפתחות אישית" action={<TargetIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />} />
          {devProject && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-stone-800 dark:text-stone-100">{devProject.name}</span>
                <span className="text-stone-400 dark:text-stone-500">{devProject.progress}%</span>
              </div>
              <ProgressBar value={devProject.progress} colorClass="bg-amber-800" />
              {devProject.nextStep && <div className="text-xs text-stone-400 dark:text-stone-500 mt-1.5">{devProject.nextStep}</div>}
            </div>
          )}
          {devItems.length === 0 && !devProject ? (
            <HubEmptyState text="עדיין אין יעדים, הרגלים או דברים ללמידה במעקב" />
          ) : (
            <ul className="divide-y divide-stone-100/70 dark:divide-stone-800/70">
              {devItems.map((it) => (
                <TimelineRow key={it.id} item={it} today={today} onToggle={toggleDone} onEdit={openEdit} />
              ))}
            </ul>
          )}
        </div>

        <div className="pt-5 border-t border-stone-100 dark:border-stone-800">
          <HubSectionHeader title="הדברים שלי" />
          <div className="grid sm:grid-cols-3 gap-5">
            <div>
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">פרויקטים אישיים</div>
              {personalProjects.length === 0 ? (
                <HubEmptyState text="אין עדיין פרויקטים אישיים" />
              ) : (
                <ul className="space-y-2">
                  {personalProjects.map((p) => (
                    <li key={p.id} className="text-sm text-stone-800 dark:text-stone-100">
                      {p.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">מקומות וחוויות</div>
              <HubEmptyState text="עדיין לא נבנה כאן כלום" />
            </div>
            <div>
              <div className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-2">Wishlist</div>
              <HubEmptyState text="הרשימה ריקה" />
            </div>
          </div>
        </div>

        <UnifiedCalendar
          title="יומן אישי"
          events={itemsToCalendarEvents(calendarItems, openEdit)}
          onAddEvent={(date) => openCreate('personal', { date })}
          onToggleTask={toggleDone}
          compact
        />
      </div>
    </DomainHubLayout>
  )
}
