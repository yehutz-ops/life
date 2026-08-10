import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { MegaphoneIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import MonthSelector from '../components/hub/MonthSelector'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { CampaignPlatform, CampaignStatus } from '../data/campaignTypes'
import { campaignActiveInMonth, computeCampaignMetrics } from '../data/campaignMetrics'
import { currentMonth } from '../data/influencerMetrics'

const STATUS_LABEL: Record<CampaignStatus, string> = { draft: 'טיוטה', active: 'פעיל', paused: 'בהפסקה', completed: 'הושלם' }
const STATUS_TONE: Record<CampaignStatus, PillTone> = { draft: 'neutral', active: 'calm', paused: 'warm', completed: 'neutral' }
const PLATFORM_LABEL: Record<CampaignPlatform, string> = { meta: 'Meta', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', other: 'אחר' }

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

const ADD_CAMPAIGN_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם הקמפיין', type: 'text', required: true },
  {
    key: 'platform',
    label: 'פלטפורמה',
    type: 'select',
    required: true,
    options: [
      { value: 'meta', label: 'Meta' },
      { value: 'instagram', label: 'Instagram' },
      { value: 'facebook', label: 'Facebook' },
      { value: 'tiktok', label: 'TikTok' },
      { value: 'other', label: 'אחר' },
    ],
  },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'draft', label: 'טיוטה' },
      { value: 'active', label: 'פעיל' },
      { value: 'paused', label: 'בהפסקה' },
      { value: 'completed', label: 'הושלם' },
    ],
  },
  { key: 'goal', label: 'מטרה', type: 'text', secondary: true },
  { key: 'startDate', label: 'תאריך התחלה', type: 'date', secondary: true },
  { key: 'endDate', label: 'תאריך סיום', type: 'date', secondary: true },
  { key: 'budget', label: 'תקציב (₪)', type: 'number', secondary: true },
]

export default function CampaignsPage() {
  const { campaigns, influencerContent, addCampaign } = useStore()
  const [month, setMonth] = useState(currentMonth())
  const [addOpen, setAddOpen] = useState(false)

  const campaignsThisMonth = useMemo(() => campaigns.filter((c) => campaignActiveInMonth(c, month)), [campaigns, month])

  const kpis = useMemo(() => {
    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length
    const spend = campaignsThisMonth.reduce((s, c) => s + (c.spend ?? 0), 0)
    const impressions = campaignsThisMonth.reduce((s, c) => s + (c.impressions ?? 0), 0)
    const reach = campaignsThisMonth.reduce((s, c) => s + (c.reach ?? 0), 0)
    const clicks = campaignsThisMonth.reduce((s, c) => s + (c.clicks ?? 0), 0)
    const purchases = campaignsThisMonth.reduce((s, c) => s + (c.purchases ?? 0), 0)
    const revenue = campaignsThisMonth.reduce((s, c) => s + (c.revenue ?? 0), 0)
    const roas = computeCampaignMetrics({ spend, impressions, clicks, purchases, revenue }).roas
    return { activeCampaigns, spend, impressions, reach, clicks, purchases, revenue, roas }
  }, [campaigns, campaignsThisMonth])

  async function handleAddCampaign(values: Record<string, string>) {
    await addCampaign({
      name: values.name?.trim(),
      platform: (values.platform as CampaignPlatform) || 'other',
      status: (values.status as CampaignStatus) || 'draft',
      goal: values.goal?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      budget: values.budget ? Number(values.budget) : undefined,
    })
    setAddOpen(false)
  }

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
            <MegaphoneIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">ניהול קמפיינים</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} onChange={setMonth} />
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            + הוסף קמפיין
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'קמפיינים פעילים', value: String(kpis.activeCampaigns) },
          { label: 'הוצאת פרסום חודשית', value: formatILS(kpis.spend) },
          { label: 'חשיפות', value: kpis.impressions.toLocaleString('he-IL') },
          { label: 'Reach', value: kpis.reach.toLocaleString('he-IL') },
          { label: 'קליקים', value: kpis.clicks.toLocaleString('he-IL') },
          { label: 'רכישות', value: kpis.purchases.toLocaleString('he-IL') },
          { label: 'הכנסה', value: formatILS(kpis.revenue) },
          { label: 'ROAS', value: kpis.roas !== undefined ? kpis.roas.toFixed(1) : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-3.5">
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">{s.label}</div>
            <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{s.value}</div>
          </div>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">קמפיינים</h3>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {campaigns.length === 0 && <EmptyLine text="עדיין אין קמפיינים במערכת" />}
          {campaigns.map((c) => {
            const linkedContentCount = influencerContent.filter((ic) => ic.campaignId === c.id).length
            const metrics = computeCampaignMetrics(c)
            return (
              <li key={c.id} className="py-3">
                <Link to={`/work/campaigns/${c.id}`} className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{c.name}</span>
                    <StatusPill label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    <span>{PLATFORM_LABEL[c.platform]}</span>
                    {c.budget !== undefined && <span>· תקציב {formatILS(c.budget)}</span>}
                    {c.spend !== undefined && <span>· הוצאה {formatILS(c.spend)}</span>}
                    {c.revenue !== undefined && <span>· הכנסה {formatILS(c.revenue)}</span>}
                    {metrics.roas !== undefined && <span>· ROAS {metrics.roas.toFixed(1)}</span>}
                    {linkedContentCount > 0 && <span>· {linkedContentCount} תכני משפיענים</span>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </Card>

      <QuickAddPopover open={addOpen} title="הוספת קמפיין" fields={ADD_CAMPAIGN_FIELDS} initialValues={{ status: 'draft' }} onClose={() => setAddOpen(false)} onSave={handleAddCampaign} />
    </div>
  )
}
