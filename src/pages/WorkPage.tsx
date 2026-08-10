import { useMemo } from 'react'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { BriefcaseIcon } from '../components/hub/hubIcons'
import { workAreas } from '../data/workAreas'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubSectionHeader from '../components/hub/HubSectionHeader'
import HubCategoryGrid from '../components/hub/HubCategoryGrid'
import HubCategoryCard from '../components/hub/HubCategoryCard'
import TimelineList from '../components/hub/TimelineList'
import MiniDomainCalendar from '../components/hub/MiniDomainCalendar'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { todayISO } from '../utils/date'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const SITE_ACCENT_HEX = '#92400E'
const SITE_ACCENT_RING = 'focus-visible:ring-[#92400E]'

// סיווג זמני, פשוט מאוד, רק כדי לתת נתון אמיתי אחד לכל כרטיס — לא מערכת סיווג מלאה.
// פריטים עם brandId נספרים תחת "קידום מותגים" ולא נכנסים לסיווג הזה כלל.
function classify(text: string): 'import-shipping' | 'more' {
  if (/משלוח|ספק|יבוא|DHL/i.test(text)) return 'import-shipping'
  return 'more'
}

export default function WorkPage() {
  const { items, toggleDone, influencers, campaigns } = useStore()
  const { openEdit } = useDetailModal()
  const today = todayISO()

  const workItems = useMemo(() => items.filter((it) => it.domain === 'work'), [items])
  const activeWork = workItems.filter((it) => isActive(it.status))
  const nonBrandActive = activeWork.filter((it) => !it.brandId && !it.personName)

  const brandOpenCount = activeWork.filter((it) => it.brandId).length
  const importShippingCount = nonBrandActive.filter((it) => classify(`${it.title} ${it.notes ?? ''}`) === 'import-shipping').length
  const moreCount = nonBrandActive.filter((it) => classify(`${it.title} ${it.notes ?? ''}`) === 'more').length
  const activeInfluencersCount = influencers.filter((i) => i.status === 'active').length
  const activeCampaignsCount = campaigns.filter((c) => c.status === 'active').length

  const statByAreaId: Record<string, string> = {
    'brand-promotion': `${brandOpenCount} פתוחות`,
    'content-ideas': 'עדיין אין רעיונות',
    'import-shipping': `${importShippingCount} פתוחות`,
    influencers: `${activeInfluencersCount} פעילים`,
    campaigns: `${activeCampaignsCount} פעילים`,
    more: `${moreCount} פתוחות`,
  }

  // "היום בעבודה" — עד 5 הפריטים הקרובים בזמן (כולל באיחור), אותו עיקרון בדיוק כמו "מה קרוב" באישי.
  const todayTimeline = useMemo(() => {
    const todayMs = new Date(today + 'T00:00:00').getTime()
    return workItems
      .filter((it) => isActive(it.status) && it.date)
      .sort((a, b) => {
        const da = Math.abs(new Date(a.date! + 'T00:00:00').getTime() - todayMs)
        const db = Math.abs(new Date(b.date! + 'T00:00:00').getTime() - todayMs)
        return da - db || a.date!.localeCompare(b.date!) || (a.startTime ?? '').localeCompare(b.startTime ?? '')
      })
      .slice(0, 5)
      .sort((a, b) => a.date!.localeCompare(b.date!) || (a.startTime ?? '').localeCompare(b.startTime ?? ''))
  }, [workItems, today])

  const calendarItems = useMemo(() => workItems.filter((it) => it.date && isActive(it.status)), [workItems])

  return (
    <DomainHubLayout name="עבודה" icon={BriefcaseIcon}>
      <QuickCaptureBar />

      <div>
        <HubSectionHeader title="היום בעבודה" />
        <TimelineList items={todayTimeline} today={today} onToggle={toggleDone} onEdit={openEdit} emptyText="אין כרגע כלום קרוב" />
      </div>

      <HubCategoryGrid>
        {workAreas.map((area) => {
          const Icon = area.icon
          return (
            <HubCategoryCard
              key={area.id}
              name={area.name}
              description={area.description}
              stat={statByAreaId[area.id]}
              imageSrc={area.imageSrc}
              accentHex={SITE_ACCENT_HEX}
              ringClass={SITE_ACCENT_RING}
              to={area.to}
              icon={Icon}
            />
          )
        })}
      </HubCategoryGrid>

      <MiniDomainCalendar title="יומן עבודה" items={calendarItems} />
    </DomainHubLayout>
  )
}
