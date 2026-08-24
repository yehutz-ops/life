import { useMemo, useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import MonthSelector from '../components/hub/MonthSelector'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import RadialProgress from '../components/finance/RadialProgress'
import { PersonIcon } from '../components/hub/hubIcons'
import { useConfirm } from '../data/ConfirmContext'
import {
  Influencer,
  InfluencerStatus,
  InfluencerProduct,
  InfluencerContent,
  ContentPlatform,
  ContentType,
  ContentStatus,
  ProductShipReason,
} from '../data/influencerTypes'
import { currentMonth, computeInfluencerMonthMetrics, computeInfluencerMonthlyCost, productsForMonth, contentForMonth } from '../data/influencerMetrics'

type GroupKey = 'overview' | 'agreement' | 'products' | 'content' | 'sales' | 'performance'
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'overview', label: 'סקירה' },
  { key: 'agreement', label: 'הסכם' },
  { key: 'products', label: 'מוצרים' },
  { key: 'content', label: 'תוכן' },
  { key: 'sales', label: 'מכירות' },
  { key: 'performance', label: 'ביצועים' },
]

const STATUS_LABEL: Record<InfluencerStatus, string> = { active: 'פעיל', paused: 'בהפסקה', finished: 'הסתיים' }
const STATUS_TONE: Record<InfluencerStatus, PillTone> = { active: 'calm', paused: 'warm', finished: 'neutral' }

const REASON_LABEL: Record<ProductShipReason, string> = {
  gift: 'מתנה',
  monthly_collaboration: 'שיתוף פעולה חודשי',
  content_creation: 'יצירת תוכן',
  campaign: 'קמפיין',
  other: 'אחר',
}

const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  planned: 'מתוכנן',
  waiting: 'ממתין',
  submitted: 'הוגש',
  approved: 'אושר',
  published: 'פורסם',
  late: 'באיחור',
  cancelled: 'בוטל',
}
const CONTENT_STATUS_TONE: Record<ContentStatus, PillTone> = {
  planned: 'neutral',
  waiting: 'neutral',
  submitted: 'warm',
  approved: 'warm',
  published: 'calm',
  late: 'alert',
  cancelled: 'neutral',
}
const CONTENT_TYPE_LABEL: Record<ContentType, string> = { reel: 'Reel', story: 'Story', post: 'Post', tiktok: 'TikTok', other: 'אחר' }
const CONTENT_PLATFORM_LABEL: Record<ContentPlatform, string> = { instagram: 'Instagram', tiktok: 'TikTok', other: 'אחר' }

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

const PROFILE_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם', type: 'text', required: true },
  { key: 'instagramHandle', label: 'Instagram', type: 'text' },
  { key: 'tiktokHandle', label: 'TikTok', type: 'text' },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'active', label: 'פעיל' },
      { value: 'paused', label: 'בהפסקה' },
      { value: 'finished', label: 'הסתיים' },
    ],
  },
  { key: 'followers', label: 'עוקבים', type: 'number', secondary: true },
  { key: 'contentNiche', label: 'תחום תוכן', type: 'text', secondary: true },
  { key: 'startDateWithUs', label: 'תאריך תחילת עבודה', type: 'date', secondary: true },
  { key: 'photoUrl', label: 'קישור לתמונת פרופיל', type: 'text', secondary: true },
  { key: 'phone', label: 'טלפון', type: 'text', secondary: true },
  { key: 'email', label: 'Email', type: 'text', secondary: true },
  { key: 'shippingAddress', label: 'כתובת למשלוחים', type: 'text', secondary: true },
  { key: 'internalNotes', label: 'הערות פנימיות', type: 'textarea', secondary: true },
]

const AGREEMENT_FIELDS: QuickAddField[] = [
  { key: 'monthlyPayment', label: 'תשלום חודשי (₪)', type: 'number' },
  { key: 'monthlyProductBudget', label: 'תקציב מוצרים חודשי (₪)', type: 'number' },
  { key: 'reelsRequired', label: 'Reels נדרשים', type: 'number' },
  { key: 'storiesRequired', label: 'Stories נדרשות', type: 'number' },
  { key: 'postsRequired', label: 'Posts נדרשים', type: 'number' },
  { key: 'tiktoksRequired', label: 'TikTok נדרשים', type: 'number', secondary: true },
  { key: 'startDate', label: 'תחילת הסכם', type: 'date', secondary: true },
  { key: 'endDate', label: 'סיום הסכם', type: 'date', secondary: true },
  { key: 'couponCode', label: 'קוד קופון', type: 'text', secondary: true },
  { key: 'discountPercentage', label: 'אחוז הנחה', type: 'number', secondary: true },
  { key: 'commissionPercentage', label: 'אחוז עמלה', type: 'number', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const PRODUCT_FIELDS: QuickAddField[] = [
  { key: 'dateSent', label: 'תאריך שליחה', type: 'date', required: true },
  { key: 'product', label: 'מוצר', type: 'text', required: true },
  { key: 'quantity', label: 'כמות', type: 'number', required: true },
  {
    key: 'reason',
    label: 'סיבה',
    type: 'select',
    required: true,
    options: [
      { value: 'gift', label: 'מתנה' },
      { value: 'monthly_collaboration', label: 'שיתוף פעולה חודשי' },
      { value: 'content_creation', label: 'יצירת תוכן' },
      { value: 'campaign', label: 'קמפיין' },
      { value: 'other', label: 'אחר' },
    ],
  },
  { key: 'brand', label: 'מותג', type: 'text', secondary: true },
  { key: 'retailValue', label: 'שווי קמעונאי (₪)', type: 'number', secondary: true },
  { key: 'actualBusinessCost', label: 'עלות עסקית בפועל (₪)', type: 'number', secondary: true },
  { key: 'shipmentStatus', label: 'סטטוס משלוח', type: 'text', secondary: true },
  { key: 'trackingNumber', label: 'מספר מעקב', type: 'text', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

export default function InfluencerDetailPage() {
  const { influencerId } = useParams<{ influencerId: string }>()
  const confirm = useConfirm()
  const {
    influencers,
    influencerProducts,
    influencerContent,
    influencerSales,
    campaigns,
    updateInfluencer,
    deleteInfluencer,
    addInfluencerProduct,
    updateInfluencerProduct,
    deleteInfluencerProduct,
    addInfluencerContent,
    updateInfluencerContent,
    deleteInfluencerContent,
    addOrUpdateInfluencerSale,
  } = useStore()

  const [group, setGroup] = useState<GroupKey>('overview')
  const [month, setMonth] = useState(currentMonth())
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [agreementModalOpen, setAgreementModalOpen] = useState(false)
  const [productModal, setProductModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [contentModal, setContentModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [saleRowForm, setSaleRowForm] = useState({ product: '', unitsSold: '', revenue: '' })

  const influencer = influencers.find((i) => i.id === influencerId)

  const CONTENT_FIELDS: QuickAddField[] = useMemo(
    () => [
      {
        key: 'platform',
        label: 'פלטפורמה',
        type: 'select',
        required: true,
        options: [
          { value: 'instagram', label: 'Instagram' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'other', label: 'אחר' },
        ],
      },
      {
        key: 'contentType',
        label: 'סוג תוכן',
        type: 'select',
        required: true,
        options: [
          { value: 'reel', label: 'Instagram Reel' },
          { value: 'story', label: 'Instagram Story' },
          { value: 'post', label: 'Instagram Post' },
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
          { value: 'planned', label: 'מתוכנן' },
          { value: 'waiting', label: 'ממתין' },
          { value: 'submitted', label: 'הוגש' },
          { value: 'approved', label: 'אושר' },
          { value: 'published', label: 'פורסם' },
          { value: 'late', label: 'באיחור' },
          { value: 'cancelled', label: 'בוטל' },
        ],
      },
      { key: 'dueDate', label: 'תאריך יעד', type: 'date', secondary: true },
      { key: 'publishDate', label: 'תאריך פרסום', type: 'date', secondary: true },
      { key: 'brand', label: 'מותג', type: 'text', secondary: true },
      { key: 'product', label: 'מוצר', type: 'text', secondary: true },
      {
        key: 'campaignId',
        label: 'קמפיין',
        type: 'select',
        secondary: true,
        options: campaigns.map((c) => ({ value: c.id, label: c.name })),
      },
      { key: 'contentUrl', label: 'קישור לתוכן', type: 'text', secondary: true },
      { key: 'views', label: 'Views', type: 'number', secondary: true },
      { key: 'reach', label: 'Reach', type: 'number', secondary: true },
      { key: 'likes', label: 'Likes', type: 'number', secondary: true },
      { key: 'comments', label: 'Comments', type: 'number', secondary: true },
      { key: 'shares', label: 'Shares', type: 'number', secondary: true },
      { key: 'saves', label: 'Saves', type: 'number', secondary: true },
    ],
    [campaigns],
  )

  // useMemo נשארים לפני ה-return המוקדם בכוונה — קריאה מותנית ל-hooks בין רינדורים שוברת את React.
  const products = useMemo(
    () => (influencer ? [...influencerProducts.filter((p) => p.influencerId === influencer.id)].sort((a, b) => b.dateSent.localeCompare(a.dateSent)) : []),
    [influencerProducts, influencer],
  )
  const content = useMemo(
    () =>
      influencer
        ? [...influencerContent.filter((c) => c.influencerId === influencer.id)].sort((a, b) => (b.dueDate ?? b.publishDate ?? '').localeCompare(a.dueDate ?? a.publishDate ?? ''))
        : [],
    [influencerContent, influencer],
  )

  if (!influencer) return <Navigate to="/work/influencers" replace />

  const sale = influencerSales.find((s) => s.influencerId === influencer.id && s.month === month)
  const monthCost = computeInfluencerMonthlyCost(influencer, influencerProducts, month)
  const metrics = computeInfluencerMonthMetrics(influencer, influencerProducts, influencerContent, sale, month)
  const productsThisMonth = productsForMonth(influencerProducts, influencer.id, month)
  const contentThisMonth = contentForMonth(influencerContent, influencer.id, month)

  async function handleSaveProfile(values: Record<string, string>) {
    await updateInfluencer(influencer!.id, {
      name: values.name?.trim(),
      instagramHandle: values.instagramHandle?.trim() || undefined,
      tiktokHandle: values.tiktokHandle?.trim() || undefined,
      status: (values.status as InfluencerStatus) || 'active',
      followers: values.followers ? Number(values.followers) : undefined,
      contentNiche: values.contentNiche?.trim() || undefined,
      startDateWithUs: values.startDateWithUs || undefined,
      photoUrl: values.photoUrl?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      email: values.email?.trim() || undefined,
      shippingAddress: values.shippingAddress?.trim() || undefined,
      internalNotes: values.internalNotes?.trim() || undefined,
    })
    setProfileModalOpen(false)
  }

  async function handleDeleteInfluencer() {
    const ok = await confirm({ title: 'מחיקת משפיען', message: `למחוק את ${influencer!.name}? הפעולה בלתי הפיכה.`, confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteInfluencer(influencer!.id)
  }

  async function handleSaveAgreement(values: Record<string, string>) {
    await updateInfluencer(influencer!.id, {
      agreement: {
        monthlyPayment: values.monthlyPayment ? Number(values.monthlyPayment) : undefined,
        monthlyProductBudget: values.monthlyProductBudget ? Number(values.monthlyProductBudget) : undefined,
        startDate: values.startDate || undefined,
        endDate: values.endDate || undefined,
        reelsRequired: values.reelsRequired ? Number(values.reelsRequired) : undefined,
        tiktoksRequired: values.tiktoksRequired ? Number(values.tiktoksRequired) : undefined,
        storiesRequired: values.storiesRequired ? Number(values.storiesRequired) : undefined,
        postsRequired: values.postsRequired ? Number(values.postsRequired) : undefined,
        couponCode: values.couponCode?.trim() || undefined,
        discountPercentage: values.discountPercentage ? Number(values.discountPercentage) : undefined,
        commissionPercentage: values.commissionPercentage ? Number(values.commissionPercentage) : undefined,
        notes: values.notes?.trim() || undefined,
      },
    })
    setAgreementModalOpen(false)
  }

  function productInitialValues(p?: InfluencerProduct): Record<string, string> {
    if (!p) return {}
    return {
      dateSent: p.dateSent,
      product: p.product,
      quantity: String(p.quantity),
      reason: p.reason,
      brand: p.brand ?? '',
      retailValue: p.retailValue !== undefined ? String(p.retailValue) : '',
      actualBusinessCost: p.actualBusinessCost !== undefined ? String(p.actualBusinessCost) : '',
      shipmentStatus: p.shipmentStatus ?? '',
      trackingNumber: p.trackingNumber ?? '',
      notes: p.notes ?? '',
    }
  }

  async function handleSaveProduct(values: Record<string, string>) {
    const data = {
      influencerId: influencer!.id,
      dateSent: values.dateSent,
      product: values.product?.trim(),
      quantity: Number(values.quantity || 1),
      reason: (values.reason as ProductShipReason) || 'other',
      brand: values.brand?.trim() || undefined,
      retailValue: values.retailValue ? Number(values.retailValue) : undefined,
      actualBusinessCost: values.actualBusinessCost ? Number(values.actualBusinessCost) : undefined,
      shipmentStatus: values.shipmentStatus?.trim() || undefined,
      trackingNumber: values.trackingNumber?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    }
    if (productModal.editingId) await updateInfluencerProduct(productModal.editingId, data)
    else await addInfluencerProduct(data)
    setProductModal({ open: false })
  }

  async function handleDeleteProduct() {
    if (!productModal.editingId) return
    const ok = await confirm({ title: 'מחיקת מוצר', message: 'למחוק את רשומת המוצר הזו?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteInfluencerProduct(productModal.editingId)
    setProductModal({ open: false })
  }

  function contentInitialValues(c?: InfluencerContent): Record<string, string> {
    if (!c) return {}
    return {
      platform: c.platform,
      contentType: c.contentType,
      status: c.status,
      dueDate: c.dueDate ?? '',
      publishDate: c.publishDate ?? '',
      brand: c.brand ?? '',
      product: c.product ?? '',
      campaignId: c.campaignId ?? '',
      contentUrl: c.contentUrl ?? '',
      views: c.views !== undefined ? String(c.views) : '',
      reach: c.reach !== undefined ? String(c.reach) : '',
      likes: c.likes !== undefined ? String(c.likes) : '',
      comments: c.comments !== undefined ? String(c.comments) : '',
      shares: c.shares !== undefined ? String(c.shares) : '',
      saves: c.saves !== undefined ? String(c.saves) : '',
    }
  }

  async function handleSaveContent(values: Record<string, string>) {
    const data = {
      influencerId: influencer!.id,
      platform: (values.platform as ContentPlatform) || 'instagram',
      contentType: (values.contentType as ContentType) || 'reel',
      status: (values.status as ContentStatus) || 'planned',
      dueDate: values.dueDate || undefined,
      publishDate: values.publishDate || undefined,
      brand: values.brand?.trim() || undefined,
      product: values.product?.trim() || undefined,
      campaignId: values.campaignId || undefined,
      contentUrl: values.contentUrl?.trim() || undefined,
      views: values.views ? Number(values.views) : undefined,
      reach: values.reach ? Number(values.reach) : undefined,
      likes: values.likes ? Number(values.likes) : undefined,
      comments: values.comments ? Number(values.comments) : undefined,
      shares: values.shares ? Number(values.shares) : undefined,
      saves: values.saves ? Number(values.saves) : undefined,
    }
    if (contentModal.editingId) await updateInfluencerContent(contentModal.editingId, data)
    else await addInfluencerContent(data)
    setContentModal({ open: false })
  }

  async function handleDeleteContent() {
    if (!contentModal.editingId) return
    const ok = await confirm({ title: 'מחיקת תוכן', message: 'למחוק את פריט התוכן הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteInfluencerContent(contentModal.editingId)
    setContentModal({ open: false })
  }

  async function handleSaveSale(values: Record<string, string>) {
    await addOrUpdateInfluencerSale(influencer!.id, month, {
      couponUses: values.couponUses ? Number(values.couponUses) : undefined,
      orders: values.orders ? Number(values.orders) : undefined,
      unitsSold: values.unitsSold ? Number(values.unitsSold) : undefined,
      revenue: values.revenue ? Number(values.revenue) : undefined,
      additionalCampaignCosts: values.additionalCampaignCosts ? Number(values.additionalCampaignCosts) : undefined,
    })
    setSaleModalOpen(false)
  }

  async function handleAddProductSaleRow() {
    if (!saleRowForm.product.trim()) return
    const newRow = { product: saleRowForm.product.trim(), unitsSold: Number(saleRowForm.unitsSold || 0), revenue: Number(saleRowForm.revenue || 0) }
    await addOrUpdateInfluencerSale(influencer!.id, month, { productSales: [...(sale?.productSales ?? []), newRow] })
    setSaleRowForm({ product: '', unitsSold: '', revenue: '' })
  }

  async function handleRemoveProductSaleRow(index: number) {
    const next = (sale?.productSales ?? []).filter((_, i) => i !== index)
    await addOrUpdateInfluencerSale(influencer!.id, month, { productSales: next })
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <BackLink to="/work/influencers" label="כל המשפיענים" />
          <div className="flex items-center gap-3 mt-1">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
              {influencer.photoUrl ? <img src={influencer.photoUrl} alt="" className="w-full h-full object-cover" /> : <PersonIcon className="w-5 h-5 text-stone-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">{influencer.name}</h1>
                <StatusPill label={STATUS_LABEL[influencer.status]} tone={STATUS_TONE[influencer.status]} />
              </div>
              {influencer.contentNiche && <p className="text-xs text-stone-400 dark:text-stone-500">{influencer.contentNiche}</p>}
            </div>
          </div>
        </div>
        <MonthSelector month={month} onChange={setMonth} />
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
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">פרופיל</h2>
              <button onClick={() => setProfileModalOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                ערוך
              </button>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">Instagram</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.instagramHandle ? `@${influencer.instagramHandle}` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">TikTok</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.tiktokHandle ? `@${influencer.tiktokHandle}` : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">עוקבים</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.followers?.toLocaleString('he-IL') ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תחום תוכן</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.contentNiche ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תחילת עבודה</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.startDateWithUs ?? '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">פרטי קשר</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">טלפון</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">Email</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">כתובת למשלוחים</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.shippingAddress ?? '—'}</dd>
              </div>
            </dl>
            {influencer.internalNotes && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">הערות פנימיות</dt>
                <dd className="text-sm text-stone-700 dark:text-stone-200">{influencer.internalNotes}</dd>
              </div>
            )}
          </Card>

          <button onClick={handleDeleteInfluencer} className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400">
            מחק משפיען
          </button>
        </div>
      )}

      {group === 'agreement' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">הסכם</h2>
            <button onClick={() => setAgreementModalOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              ערוך
            </button>
          </div>
          {!influencer.agreement ? (
            <EmptyLine text="עדיין לא הוזן הסכם למשפיען הזה" />
          ) : (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תשלום חודשי</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.agreement.monthlyPayment !== undefined ? formatILS(influencer.agreement.monthlyPayment) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תקציב מוצרים חודשי</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.agreement.monthlyProductBudget !== undefined ? formatILS(influencer.agreement.monthlyProductBudget) : '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">תקופת הסכם</dt>
                <dd className="text-stone-700 dark:text-stone-200">
                  {influencer.agreement.startDate ?? '—'} → {influencer.agreement.endDate ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">נדרש</dt>
                <dd className="text-stone-700 dark:text-stone-200">
                  {influencer.agreement.reelsRequired ? `${influencer.agreement.reelsRequired} Reels` : ''}
                  {influencer.agreement.storiesRequired ? ` · ${influencer.agreement.storiesRequired} Stories` : ''}
                  {influencer.agreement.postsRequired ? ` · ${influencer.agreement.postsRequired} Posts` : ''}
                  {influencer.agreement.tiktoksRequired ? ` · ${influencer.agreement.tiktoksRequired} TikTok` : ''}
                  {!influencer.agreement.reelsRequired && !influencer.agreement.storiesRequired && !influencer.agreement.postsRequired && !influencer.agreement.tiktoksRequired && '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">קופון</dt>
                <dd className="text-stone-700 dark:text-stone-200">{influencer.agreement.couponCode ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">הנחה / עמלה</dt>
                <dd className="text-stone-700 dark:text-stone-200">
                  {influencer.agreement.discountPercentage !== undefined ? `${influencer.agreement.discountPercentage}% הנחה` : ''}
                  {influencer.agreement.commissionPercentage !== undefined ? ` · ${influencer.agreement.commissionPercentage}% עמלה` : ''}
                  {influencer.agreement.discountPercentage === undefined && influencer.agreement.commissionPercentage === undefined && '—'}
                </dd>
              </div>
              {influencer.agreement.notes && (
                <div className="col-span-2 sm:col-span-3">
                  <dt className="text-xs text-stone-400 dark:text-stone-500">הערות</dt>
                  <dd className="text-stone-700 dark:text-stone-200">{influencer.agreement.notes}</dd>
                </div>
              )}
            </dl>
          )}
        </Card>
      )}

      {group === 'products' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between text-sm">
              <span className="text-stone-500 dark:text-stone-400">מוצרים החודש</span>
              <span className="font-semibold text-stone-800 dark:text-stone-100">
                {productsThisMonth.length} · שווי {formatILS(productsThisMonth.reduce((s, p) => s + (p.retailValue ?? 0), 0))} · עלות {formatILS(monthCost.productCost)}
              </span>
            </div>
          </Card>
          <Card className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-3">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">היסטוריית מוצרים</h3>
              <button onClick={() => setProductModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                + הוסף מוצר
              </button>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {products.length === 0 && <EmptyLine text="עדיין לא נשלחו מוצרים" />}
              {products.map((p) => (
                <li key={p.id} className="py-3 cursor-pointer" onClick={() => setProductModal({ open: true, editingId: p.id })}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                      {p.product} {p.quantity > 1 ? `×${p.quantity}` : ''}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">{p.dateSent}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    {p.brand && <span>{p.brand}</span>}
                    <span>· {REASON_LABEL[p.reason]}</span>
                    {p.actualBusinessCost !== undefined && <span>· עלות {formatILS(p.actualBusinessCost)}</span>}
                    {p.shipmentStatus && <span>· {p.shipmentStatus}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {group === 'content' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">תוכן</h3>
            <button onClick={() => setContentModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף תוכן
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {content.length === 0 && <EmptyLine text="עדיין אין תוכן רשום" />}
            {content.map((c) => {
              const campaign = c.campaignId ? campaigns.find((camp) => camp.id === c.campaignId) : undefined
              return (
                <li key={c.id} className="py-3 cursor-pointer" onClick={() => setContentModal({ open: true, editingId: c.id })}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                      {CONTENT_PLATFORM_LABEL[c.platform]} · {CONTENT_TYPE_LABEL[c.contentType]}
                    </span>
                    <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    {c.dueDate && <span>יעד {c.dueDate}</span>}
                    {c.publishDate && <span>· פורסם {c.publishDate}</span>}
                    {campaign && <span>· 🔗 {campaign.name}</span>}
                    {c.status === 'published' && c.views !== undefined && <span>· {c.views.toLocaleString('he-IL')} Views</span>}
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {group === 'sales' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">מכירות החודש</h2>
              <button onClick={() => setSaleModalOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                ערוך
              </button>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">שימושי קופון</dt>
                <dd className="text-stone-700 dark:text-stone-200">{sale?.couponUses ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">הזמנות</dt>
                <dd className="text-stone-700 dark:text-stone-200">{sale?.orders ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">יחידות שנמכרו</dt>
                <dd className="text-stone-700 dark:text-stone-200">{sale?.unitsSold ?? 0}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">הכנסה</dt>
                <dd className="text-stone-700 dark:text-stone-200">{formatILS(sale?.revenue ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-xs text-stone-400 dark:text-stone-500">ערך הזמנה ממוצע</dt>
                <dd className="text-stone-700 dark:text-stone-200">{sale?.orders ? formatILS((sale.revenue ?? 0) / sale.orders) : '—'}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-3">מכירות לפי מוצר</h3>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 mb-3">
              {(sale?.productSales ?? []).length === 0 && <EmptyLine text="אין עדיין פירוט מכירות לפי מוצר" />}
              {(sale?.productSales ?? []).map((row, i) => (
                <li key={i} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-800 dark:text-stone-100">{row.product}</span>
                  <div className="flex items-center gap-3 text-stone-500 dark:text-stone-400">
                    <span>{row.unitsSold} יח׳</span>
                    <span>{formatILS(row.revenue)}</span>
                    <button onClick={() => handleRemoveProductSaleRow(i)} className="text-stone-300 hover:text-red-500" aria-label="הסר">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={saleRowForm.product}
                onChange={(e) => setSaleRowForm((f) => ({ ...f, product: e.target.value }))}
                placeholder="מוצר"
                className="flex-1 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={saleRowForm.unitsSold}
                onChange={(e) => setSaleRowForm((f) => ({ ...f, unitsSold: e.target.value }))}
                placeholder="יחידות"
                type="number"
                className="w-20 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={saleRowForm.revenue}
                onChange={(e) => setSaleRowForm((f) => ({ ...f, revenue: e.target.value }))}
                placeholder="הכנסה"
                type="number"
                className="w-24 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-2 text-sm"
              />
              <button onClick={handleAddProductSaleRow} className="px-3 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
                +
              </button>
            </div>
          </Card>
        </div>
      )}

      {group === 'performance' && (
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">
              {influencer.name} — סיכום חודשי
            </h2>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <RadialProgress percent={Math.min(100, (metrics.roas ?? 0) * 10)} size={110}>
                <div className="text-center">
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{metrics.roas !== undefined ? metrics.roas.toFixed(2) : '—'}</div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500">ROAS</div>
                </div>
              </RadialProgress>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm flex-1 w-full">
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">תשלום מזומן</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(metrics.cashPayment)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">עלות מוצרים</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(metrics.productCost)}</dd>
                </div>
                {metrics.additionalCampaignCosts > 0 && (
                  <div>
                    <dt className="text-xs text-stone-400 dark:text-stone-500">עלויות קמפיין נוספות</dt>
                    <dd className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(metrics.additionalCampaignCosts)}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">עלות כוללת</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(metrics.totalCost)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">Views</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{metrics.totalViews.toLocaleString('he-IL')}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">הזמנות</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{metrics.orders}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">הכנסה</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(metrics.revenue)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">עלות להזמנה</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{metrics.costPerOrder !== undefined ? formatILS(metrics.costPerOrder) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">הכנסה לתוכן</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{metrics.revenuePerContent !== undefined ? formatILS(metrics.revenuePerContent) : '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">Engagement Rate</dt>
                  <dd className="text-stone-700 dark:text-stone-200 font-medium">{metrics.engagementRate !== undefined ? `${(metrics.engagementRate * 100).toFixed(1)}%` : '—'}</dd>
                </div>
              </dl>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-sm text-stone-500 dark:text-stone-400">
              התחייבות: {metrics.contentCompleted.total}/{metrics.contentRequired.total} תכנים הושלמו
            </div>
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">תוכן החודש</h3>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {contentThisMonth.length === 0 && <EmptyLine text="אין תוכן בחודש הזה" />}
              {contentThisMonth.map((c) => (
                <li key={c.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-800 dark:text-stone-100">
                    {CONTENT_PLATFORM_LABEL[c.platform]} · {CONTENT_TYPE_LABEL[c.contentType]}
                  </span>
                  <StatusPill label={CONTENT_STATUS_LABEL[c.status]} tone={CONTENT_STATUS_TONE[c.status]} />
                </li>
              ))}
            </ul>
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-3">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">מוצרים החודש</h3>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {productsThisMonth.length === 0 && <EmptyLine text="לא נשלחו מוצרים בחודש הזה" />}
              {productsThisMonth.map((p) => (
                <li key={p.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                  <span className="text-stone-800 dark:text-stone-100">{p.product}</span>
                  <span className="text-stone-500 dark:text-stone-400">{p.actualBusinessCost !== undefined ? formatILS(p.actualBusinessCost) : '—'}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <QuickAddPopover
        open={profileModalOpen}
        title="עריכת פרטי משפיען"
        fields={PROFILE_FIELDS}
        initialValues={{
          name: influencer.name,
          instagramHandle: influencer.instagramHandle ?? '',
          tiktokHandle: influencer.tiktokHandle ?? '',
          status: influencer.status,
          followers: influencer.followers !== undefined ? String(influencer.followers) : '',
          contentNiche: influencer.contentNiche ?? '',
          startDateWithUs: influencer.startDateWithUs ?? '',
          photoUrl: influencer.photoUrl ?? '',
          phone: influencer.phone ?? '',
          email: influencer.email ?? '',
          shippingAddress: influencer.shippingAddress ?? '',
          internalNotes: influencer.internalNotes ?? '',
        }}
        onClose={() => setProfileModalOpen(false)}
        onSave={handleSaveProfile}
      />

      <QuickAddPopover
        open={agreementModalOpen}
        title="עריכת הסכם"
        fields={AGREEMENT_FIELDS}
        initialValues={{
          monthlyPayment: influencer.agreement?.monthlyPayment !== undefined ? String(influencer.agreement.monthlyPayment) : '',
          monthlyProductBudget: influencer.agreement?.monthlyProductBudget !== undefined ? String(influencer.agreement.monthlyProductBudget) : '',
          reelsRequired: influencer.agreement?.reelsRequired !== undefined ? String(influencer.agreement.reelsRequired) : '',
          storiesRequired: influencer.agreement?.storiesRequired !== undefined ? String(influencer.agreement.storiesRequired) : '',
          postsRequired: influencer.agreement?.postsRequired !== undefined ? String(influencer.agreement.postsRequired) : '',
          tiktoksRequired: influencer.agreement?.tiktoksRequired !== undefined ? String(influencer.agreement.tiktoksRequired) : '',
          startDate: influencer.agreement?.startDate ?? '',
          endDate: influencer.agreement?.endDate ?? '',
          couponCode: influencer.agreement?.couponCode ?? '',
          discountPercentage: influencer.agreement?.discountPercentage !== undefined ? String(influencer.agreement.discountPercentage) : '',
          commissionPercentage: influencer.agreement?.commissionPercentage !== undefined ? String(influencer.agreement.commissionPercentage) : '',
          notes: influencer.agreement?.notes ?? '',
        }}
        onClose={() => setAgreementModalOpen(false)}
        onSave={handleSaveAgreement}
      />

      <QuickAddPopover
        open={productModal.open}
        title={productModal.editingId ? 'עריכת מוצר' : 'הוספת מוצר'}
        fields={PRODUCT_FIELDS}
        initialValues={productInitialValues(products.find((p) => p.id === productModal.editingId))}
        onClose={() => setProductModal({ open: false })}
        onSave={handleSaveProduct}
        onDelete={productModal.editingId ? handleDeleteProduct : undefined}
      />

      <QuickAddPopover
        open={contentModal.open}
        title={contentModal.editingId ? 'עריכת תוכן' : 'הוספת תוכן'}
        fields={CONTENT_FIELDS}
        initialValues={contentInitialValues(content.find((c) => c.id === contentModal.editingId))}
        onClose={() => setContentModal({ open: false })}
        onSave={handleSaveContent}
        onDelete={contentModal.editingId ? handleDeleteContent : undefined}
      />

      <QuickAddPopover
        open={saleModalOpen}
        title="עריכת מכירות חודשיות"
        fields={[
          { key: 'couponUses', label: 'שימושי קופון', type: 'number' },
          { key: 'orders', label: 'הזמנות', type: 'number' },
          { key: 'unitsSold', label: 'יחידות שנמכרו', type: 'number' },
          { key: 'revenue', label: 'הכנסה (₪)', type: 'number' },
          { key: 'additionalCampaignCosts', label: 'עלויות קמפיין נוספות (₪)', type: 'number', secondary: true },
        ]}
        initialValues={{
          couponUses: sale?.couponUses !== undefined ? String(sale.couponUses) : '',
          orders: sale?.orders !== undefined ? String(sale.orders) : '',
          unitsSold: sale?.unitsSold !== undefined ? String(sale.unitsSold) : '',
          revenue: sale?.revenue !== undefined ? String(sale.revenue) : '',
          additionalCampaignCosts: sale?.additionalCampaignCosts !== undefined ? String(sale.additionalCampaignCosts) : '',
        }}
        onClose={() => setSaleModalOpen(false)}
        onSave={handleSaveSale}
      />
    </div>
  )
}
