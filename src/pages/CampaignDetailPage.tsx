import { useState } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useConfirm } from '../data/ConfirmContext'
import { CampaignPlatform, CampaignStatus, CampaignCreative } from '../data/campaignTypes'
import { computeCampaignMetrics, computeCreativeROAS } from '../data/campaignMetrics'

type GroupKey = 'overview' | 'creatives'
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'overview', label: 'סקירה' },
  { key: 'creatives', label: 'קריאייטיבים' },
]

const STATUS_LABEL: Record<CampaignStatus, string> = { draft: 'טיוטה', active: 'פעיל', paused: 'בהפסקה', completed: 'הושלם' }
const STATUS_TONE: Record<CampaignStatus, PillTone> = { draft: 'neutral', active: 'calm', paused: 'warm', completed: 'neutral' }
const PLATFORM_LABEL: Record<CampaignPlatform, string> = { meta: 'Meta', instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', other: 'אחר' }

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

const EDIT_CAMPAIGN_FIELDS: QuickAddField[] = [
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
    required: true,
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
  { key: 'spend', label: 'הוצאה בפועל (₪)', type: 'number', secondary: true },
  { key: 'impressions', label: 'Impressions', type: 'number', secondary: true },
  { key: 'reach', label: 'Reach', type: 'number', secondary: true },
  { key: 'frequency', label: 'Frequency', type: 'number', secondary: true },
  { key: 'clicks', label: 'Clicks', type: 'number', secondary: true },
  { key: 'addToCart', label: 'Add To Cart', type: 'number', secondary: true },
  { key: 'purchases', label: 'Purchases', type: 'number', secondary: true },
  { key: 'revenue', label: 'Revenue (₪)', type: 'number', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const CREATIVE_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם', type: 'text', required: true },
  { key: 'format', label: 'פורמט', type: 'text' },
  { key: 'product', label: 'מוצר', type: 'text' },
  { key: 'mediaRef', label: 'קישור למדיה', type: 'text', secondary: true },
  { key: 'copy', label: 'טקסט הקריאייטיב', type: 'textarea', secondary: true },
  { key: 'spend', label: 'הוצאה (₪)', type: 'number', secondary: true },
  { key: 'impressions', label: 'Impressions', type: 'number', secondary: true },
  { key: 'clicks', label: 'Clicks', type: 'number', secondary: true },
  { key: 'purchases', label: 'Purchases', type: 'number', secondary: true },
  { key: 'revenue', label: 'Revenue (₪)', type: 'number', secondary: true },
]

export default function CampaignDetailPage() {
  const { campaignId } = useParams<{ campaignId: string }>()
  const confirm = useConfirm()
  const { campaigns, campaignCreatives, influencerContent, influencers, updateCampaign, deleteCampaign, addCampaignCreative, updateCampaignCreative, deleteCampaignCreative } = useStore()

  const [group, setGroup] = useState<GroupKey>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [creativeModal, setCreativeModal] = useState<{ open: boolean; editingId?: string }>({ open: false })

  const campaign = campaigns.find((c) => c.id === campaignId)

  if (!campaign) return <Navigate to="/work/campaigns" replace />

  const creatives = campaignCreatives.filter((cr) => cr.campaignId === campaign.id)
  const linkedContent = influencerContent.filter((c) => c.campaignId === campaign.id)
  const metrics = computeCampaignMetrics(campaign)

  async function handleSaveCampaign(values: Record<string, string>) {
    await updateCampaign(campaign!.id, {
      name: values.name?.trim(),
      platform: (values.platform as CampaignPlatform) || 'other',
      status: (values.status as CampaignStatus) || 'draft',
      goal: values.goal?.trim() || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      budget: values.budget ? Number(values.budget) : undefined,
      spend: values.spend ? Number(values.spend) : undefined,
      impressions: values.impressions ? Number(values.impressions) : undefined,
      reach: values.reach ? Number(values.reach) : undefined,
      frequency: values.frequency ? Number(values.frequency) : undefined,
      clicks: values.clicks ? Number(values.clicks) : undefined,
      addToCart: values.addToCart ? Number(values.addToCart) : undefined,
      purchases: values.purchases ? Number(values.purchases) : undefined,
      revenue: values.revenue ? Number(values.revenue) : undefined,
      notes: values.notes?.trim() || undefined,
    })
    setEditOpen(false)
  }

  async function handleDeleteCampaign() {
    const ok = await confirm({ title: 'מחיקת קמפיין', message: `למחוק את "${campaign!.name}"? הפעולה בלתי הפיכה.`, confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteCampaign(campaign!.id)
  }

  function creativeInitialValues(cr?: CampaignCreative): Record<string, string> {
    if (!cr) return {}
    return {
      name: cr.name,
      format: cr.format ?? '',
      product: cr.product ?? '',
      mediaRef: cr.mediaRef ?? '',
      copy: cr.copy ?? '',
      spend: cr.spend !== undefined ? String(cr.spend) : '',
      impressions: cr.impressions !== undefined ? String(cr.impressions) : '',
      clicks: cr.clicks !== undefined ? String(cr.clicks) : '',
      purchases: cr.purchases !== undefined ? String(cr.purchases) : '',
      revenue: cr.revenue !== undefined ? String(cr.revenue) : '',
    }
  }

  async function handleSaveCreative(values: Record<string, string>) {
    const data = {
      campaignId: campaign!.id,
      name: values.name?.trim(),
      format: values.format?.trim() || undefined,
      product: values.product?.trim() || undefined,
      mediaRef: values.mediaRef?.trim() || undefined,
      copy: values.copy?.trim() || undefined,
      spend: values.spend ? Number(values.spend) : undefined,
      impressions: values.impressions ? Number(values.impressions) : undefined,
      clicks: values.clicks ? Number(values.clicks) : undefined,
      purchases: values.purchases ? Number(values.purchases) : undefined,
      revenue: values.revenue ? Number(values.revenue) : undefined,
    }
    if (creativeModal.editingId) await updateCampaignCreative(creativeModal.editingId, data)
    else await addCampaignCreative(data)
    setCreativeModal({ open: false })
  }

  async function handleDeleteCreative() {
    if (!creativeModal.editingId) return
    const ok = await confirm({ title: 'מחיקת קריאייטיב', message: 'למחוק את הקריאייטיב הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteCampaignCreative(creativeModal.editingId)
    setCreativeModal({ open: false })
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <BackLink to="/work/campaigns" label="כל הקמפיינים" />
        <div className="flex items-center gap-2 mt-1">
          <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">{campaign.name}</h1>
          <StatusPill label={STATUS_LABEL[campaign.status]} tone={STATUS_TONE[campaign.status]} />
        </div>
        <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{PLATFORM_LABEL[campaign.platform]}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <FilterChip key={g.key} active={group === g.key} onClick={() => setGroup(g.key)}>
            {g.label}
          </FilterChip>
        ))}
      </div>

      {group === 'overview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">פרטי קמפיין</h2>
              <button onClick={() => setEditOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                ערוך
              </button>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">מטרה</dt>
                <dd className="text-stone-700 dark:text-stone-200">{campaign.goal ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תקופה</dt>
                <dd className="text-stone-700 dark:text-stone-200">
                  {campaign.startDate ?? '—'} → {campaign.endDate ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תקציב</dt>
                <dd className="text-stone-700 dark:text-stone-200">{campaign.budget !== undefined ? formatILS(campaign.budget) : '—'}</dd>
              </div>
              {campaign.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-stone-400 dark:text-stone-500">הערות</dt>
                  <dd className="text-stone-700 dark:text-stone-200">{campaign.notes}</dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">תוצאות</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              {[
                ['הוצאה', campaign.spend !== undefined ? formatILS(campaign.spend) : '—'],
                ['Impressions', campaign.impressions?.toLocaleString('he-IL') ?? '—'],
                ['Reach', campaign.reach?.toLocaleString('he-IL') ?? '—'],
                ['Frequency', campaign.frequency !== undefined ? campaign.frequency.toFixed(1) : '—'],
                ['Clicks', campaign.clicks?.toLocaleString('he-IL') ?? '—'],
                ['CTR', metrics.ctr !== undefined ? `${(metrics.ctr * 100).toFixed(2)}%` : '—'],
                ['CPC', metrics.cpc !== undefined ? formatILS(metrics.cpc) : '—'],
                ['CPM', metrics.cpm !== undefined ? formatILS(metrics.cpm) : '—'],
                ['Add To Cart', campaign.addToCart?.toLocaleString('he-IL') ?? '—'],
                ['Purchases', campaign.purchases?.toLocaleString('he-IL') ?? '—'],
                ['Conversion Rate', metrics.conversionRate !== undefined ? `${(metrics.conversionRate * 100).toFixed(2)}%` : '—'],
                ['Cost Per Purchase', metrics.costPerPurchase !== undefined ? formatILS(metrics.costPerPurchase) : '—'],
                ['Revenue', campaign.revenue !== undefined ? formatILS(campaign.revenue) : '—'],
                ['ROAS', metrics.roas !== undefined ? metrics.roas.toFixed(2) : '—'],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">{label}</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">תוכן משפיענים מקושר</h3>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {linkedContent.length === 0 && <EmptyLine text="עדיין לא קושר תוכן משפיענים לקמפיין הזה" />}
              {linkedContent.map((c) => {
                const influencer = influencers.find((i) => i.id === c.influencerId)
                return (
                  <li key={c.id} className="py-2.5 text-sm text-stone-700 dark:text-stone-200">
                    {influencer ? (
                      <Link to={`/work/influencers/${influencer.id}`} className="font-medium hover:underline">
                        {influencer.name}
                      </Link>
                    ) : (
                      'משפיען לא ידוע'
                    )}
                    <span className="text-stone-400 dark:text-stone-500"> — {c.contentType} · {c.status}</span>
                  </li>
                )
              })}
            </ul>
          </Card>

          <button onClick={handleDeleteCampaign} className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400">
            מחק קמפיין
          </button>
        </div>
      )}

      {group === 'creatives' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">קריאייטיבים</h3>
            <button onClick={() => setCreativeModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף קריאייטיב
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {creatives.length === 0 && <EmptyLine text="עדיין אין קריאייטיבים לקמפיין הזה" />}
            {creatives.map((cr) => {
              const roas = computeCreativeROAS(cr)
              return (
                <li key={cr.id} className="py-3 cursor-pointer" onClick={() => setCreativeModal({ open: true, editingId: cr.id })}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{cr.name}</span>
                    {roas !== undefined && <span className="text-xs text-stone-500 dark:text-stone-400">ROAS {roas.toFixed(1)}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    {cr.format && <span>{cr.format}</span>}
                    {cr.spend !== undefined && <span>· הוצאה {formatILS(cr.spend)}</span>}
                    {cr.revenue !== undefined && <span>· הכנסה {formatILS(cr.revenue)}</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      <QuickAddPopover
        open={editOpen}
        title="עריכת קמפיין"
        fields={EDIT_CAMPAIGN_FIELDS}
        initialValues={{
          name: campaign.name,
          platform: campaign.platform,
          status: campaign.status,
          goal: campaign.goal ?? '',
          startDate: campaign.startDate ?? '',
          endDate: campaign.endDate ?? '',
          budget: campaign.budget !== undefined ? String(campaign.budget) : '',
          spend: campaign.spend !== undefined ? String(campaign.spend) : '',
          impressions: campaign.impressions !== undefined ? String(campaign.impressions) : '',
          reach: campaign.reach !== undefined ? String(campaign.reach) : '',
          frequency: campaign.frequency !== undefined ? String(campaign.frequency) : '',
          clicks: campaign.clicks !== undefined ? String(campaign.clicks) : '',
          addToCart: campaign.addToCart !== undefined ? String(campaign.addToCart) : '',
          purchases: campaign.purchases !== undefined ? String(campaign.purchases) : '',
          revenue: campaign.revenue !== undefined ? String(campaign.revenue) : '',
          notes: campaign.notes ?? '',
        }}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveCampaign}
      />

      <QuickAddPopover
        open={creativeModal.open}
        title={creativeModal.editingId ? 'עריכת קריאייטיב' : 'הוספת קריאייטיב'}
        fields={CREATIVE_FIELDS}
        initialValues={creativeInitialValues(creatives.find((cr) => cr.id === creativeModal.editingId))}
        onClose={() => setCreativeModal({ open: false })}
        onSave={handleSaveCreative}
        onDelete={creativeModal.editingId ? handleDeleteCreative : undefined}
      />
    </div>
  )
}
