import { useMemo, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { getWorkCategory, classifyWorkItem, WorkCategoryId } from '../data/workHubCategories'
import { workCategoryIcons } from '../components/hub/hubIcons'
import HubEmptyState from '../components/hub/HubEmptyState'
import { DomainBadge, PriorityChip } from '../components/ui'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const VALID_IDS: WorkCategoryId[] = ['content', 'collaborations', 'shipments', 'suppliers', 'campaigns', 'meetings', 'operations']

export default function WorkCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { items, brands, brandContentItems, brandCampaigns } = useStore()
  const [query, setQuery] = useState('')

  if (!categoryId || !VALID_IDS.includes(categoryId as WorkCategoryId)) return <Navigate to="/work" replace />
  const category = getWorkCategory(categoryId as WorkCategoryId)
  const Icon = workCategoryIcons[category.id]
  const q = query.trim()

  const workItems = useMemo(() => items.filter((it) => it.domain === 'work'), [items])

  const classifiedItems = useMemo(
    () =>
      workItems
        .filter((it) => !it.brandId && classifyWorkItem(it) === category.id)
        .filter((it) => !q || it.title.includes(q))
        .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [workItems, category.id, q],
  )

  const contentForCategory = useMemo(
    () => (category.id === 'content' ? brandContentItems.filter((c) => !q || c.title.includes(q)).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')) : []),
    [brandContentItems, category.id, q],
  )

  const campaignsForCategory = useMemo(
    () => (category.id === 'campaigns' ? brandCampaigns.filter((c) => !q || c.name.includes(q)) : []),
    [brandCampaigns, category.id, q],
  )

  const isDataOnItems = category.id !== 'content' && category.id !== 'campaigns'
  const hasResults = isDataOnItems ? classifiedItems.length > 0 : category.id === 'content' ? contentForCategory.length > 0 : campaignsForCategory.length > 0

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/work"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
            aria-label="חזרה לעבודה"
            title="חזרה לעבודה"
          >
            ←
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: category.accentHex }}>
              <Icon className="w-4.5 h-4.5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">{category.name}</h1>
              <p className="text-xs text-stone-400 dark:text-stone-500">{category.description}</p>
            </div>
          </div>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`חפש ב${category.name}...`}
          className="w-full sm:w-64 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 px-3.5 py-2 text-sm placeholder:text-stone-400"
        />
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
        {!hasResults && <HubEmptyState text={category.emptyText} />}

        {isDataOnItems && classifiedItems.length > 0 && (
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {classifiedItems.map((it) => (
              <li key={it.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${it.status === 'done' ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>
                    {it.title}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <DomainBadge domain={it.domain} />
                    <PriorityChip priority={it.priority} />
                    {it.personName && <span className="text-xs text-stone-400 dark:text-stone-500">{it.personName}</span>}
                  </div>
                </div>
                <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0 whitespace-nowrap">
                  {it.date ?? 'ללא תאריך'}
                  {it.startTime ? ` · ${it.startTime}` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}

        {category.id === 'content' && contentForCategory.length > 0 && (
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {contentForCategory.map((c) => {
              const brand = brands.find((b) => b.id === c.brandId)
              return (
                <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{c.title}</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      {brand?.name ?? 'מותג'} {c.format ? `· ${c.format}` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-xs shrink-0 whitespace-nowrap ${
                      c.published ? 'text-emerald-700 dark:text-emerald-400' : c.awaitingApproval ? 'text-amber-700 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {c.published ? 'פורסם' : c.awaitingApproval ? 'ממתין לאישור' : c.status}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {category.id === 'campaigns' && campaignsForCategory.length > 0 && (
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {campaignsForCategory.map((c) => {
              const brand = brands.find((b) => b.id === c.brandId)
              return (
                <li key={c.id} className="py-3">
                  <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{c.name}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {brand?.name ?? 'מותג'} {c.startDate ? `· ${c.startDate} → ${c.endDate ?? ''}` : ''}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
