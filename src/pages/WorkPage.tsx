import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { workBrandsCategory, workHubCategories, classifyWorkItem } from '../data/workHubCategories'
import { workCategoryIcons, BriefcaseIcon } from '../components/hub/hubIcons'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubCategoryGrid from '../components/hub/HubCategoryGrid'
import HubCategoryCard from '../components/hub/HubCategoryCard'
import HubSummaryPanel from '../components/hub/HubSummaryPanel'
import QuickCaptureBar from '../components/QuickCaptureBar'
import SearchField from '../components/hub/SearchField'
import { todayISO } from '../utils/date'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'

export default function WorkPage() {
  const { items, brands, brandContentItems, brandCampaigns } = useStore()
  const [query, setQuery] = useState('')
  const today = todayISO()
  const q = query.trim()

  const workItems = useMemo(() => items.filter((it) => it.domain === 'work'), [items])
  const activeWork = workItems.filter((it) => isActive(it.status))
  const nonBrandActive = activeWork.filter((it) => !it.brandId)

  function countCategory(id: string) {
    return nonBrandActive.filter((it) => classifyWorkItem(it) === id).length
  }

  const brandOpenCount = activeWork.filter((it) => it.brandId).length
  const contentAwaitingCount = brandContentItems.filter((c) => !c.published).length
  const meetingsUpcomingCount = nonBrandActive.filter((it) => classifyWorkItem(it) === 'meetings' && (!it.date || it.date >= today)).length

  const statById: Record<string, string> = {
    content: `${contentAwaitingCount} ממתינים לפרסום`,
    collaborations: `${countCategory('collaborations')} פתוחות`,
    shipments: `${countCategory('shipments')} פתוחות`,
    suppliers: `${countCategory('suppliers')} פתוחות`,
    campaigns: `${brandCampaigns.length} קמפיינים`,
    meetings: `${meetingsUpcomingCount} קרובות`,
    operations: `${countCategory('operations')} פתוחות`,
  }

  const matchesQuery = (title: string) => !q || title.includes(q)

  const openShipments = useMemo(
    () => nonBrandActive.filter((it) => classifyWorkItem(it) === 'shipments' && matchesQuery(it.title)).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [nonBrandActive, q],
  )

  const contentAwaitingApproval = useMemo(
    () => brandContentItems.filter((c) => c.awaitingApproval && matchesQuery(c.title)).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [brandContentItems, q],
  )

  const todayTasks = useMemo(
    () => workItems.filter((it) => isActive(it.status) && it.kind !== 'event' && it.date === today && matchesQuery(it.title)),
    [workItems, today, q],
  )

  const upcomingMeetings = useMemo(
    () =>
      nonBrandActive
        .filter((it) => classifyWorkItem(it) === 'meetings' && (!it.date || it.date >= today) && matchesQuery(it.title))
        .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [nonBrandActive, today, q],
  )

  return (
    <DomainHubLayout
      name="עבודה"
      icon={BriefcaseIcon}
      searchSlot={<SearchField value={query} onChange={setQuery} placeholder="חפש בתוך עבודה..." />}
    >
      <QuickCaptureBar />

      <HubCategoryGrid>
        <HubCategoryCard
          name={workBrandsCategory.name}
          description={workBrandsCategory.description}
          stat={`${brandOpenCount} פתוחות`}
          imageSrc={workBrandsCategory.imageSrc}
          accentHex={workBrandsCategory.accentHex}
          ringClass={workBrandsCategory.ringClass}
          to={workBrandsCategory.route}
          icon={workCategoryIcons.brands}
        />
        {workHubCategories.map((c) => (
          <HubCategoryCard
            key={c.id}
            name={c.name}
            description={c.description}
            stat={statById[c.id]}
            imageSrc={c.imageSrc}
            accentHex={c.accentHex}
            ringClass={c.ringClass}
            to={c.route}
            icon={workCategoryIcons[c.id]}
          />
        ))}
      </HubCategoryGrid>

      <div className="grid sm:grid-cols-2 gap-4">
        <HubSummaryPanel
          title="משלוחים פתוחים"
          items={openShipments}
          emptyText="אין כרגע משלוחים פתוחים"
          viewAllHref="/work/shipments"
          renderItem={(it) => (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-stone-800 dark:text-stone-100 truncate">{it.title}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{it.date ?? 'ללא תאריך'}</span>
            </div>
          )}
        />
        <HubSummaryPanel
          title="תוכן שממתין לאישור"
          items={contentAwaitingApproval}
          emptyText="אין כרגע תוכן שממתין לאישור"
          viewAllHref="/work/content"
          renderItem={(c) => {
            const brand = brands.find((b) => b.id === c.brandId)
            return (
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-stone-800 dark:text-stone-100 truncate">{c.title}</span>
                <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{brand?.name ?? 'מותג'}</span>
              </div>
            )
          }}
        />
        <HubSummaryPanel
          title="משימות עבודה להיום"
          items={todayTasks}
          emptyText="אין משימות עבודה מתוזמנות להיום"
          viewAllHref="/tasks"
          renderItem={(it) => (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-stone-800 dark:text-stone-100 truncate">{it.title}</span>
              {it.startTime && <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{it.startTime}</span>}
            </div>
          )}
        />
        <HubSummaryPanel
          title="פגישות קרובות"
          items={upcomingMeetings}
          emptyText="אין פגישות קרובות"
          viewAllHref="/work/meetings"
          renderItem={(it) => (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-stone-800 dark:text-stone-100 truncate">{it.title}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                {it.date ?? 'ללא תאריך'}
                {it.startTime ? ` · ${it.startTime}` : ''}
              </span>
            </div>
          )}
        />
      </div>
    </DomainHubLayout>
  )
}
