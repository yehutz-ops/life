import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useConfirm } from '../data/ConfirmContext'
import { BrandContact, BrandDocument, BrandDocCategory, BrandProduct } from '../data/brandTypes'
import { ShipmentStatus } from '../data/shipmentTypes'
import { MediaAsset, MediaAssetCategory, ContentRule, ContentRuleType } from '../data/contentStudioTypes'
import { todayISO } from '../utils/date'

type GroupKey = 'overview' | 'products' | 'content' | 'campaigns' | 'contacts' | 'shipments' | 'documents' | 'media' | 'library' | 'rules' | 'promotion' | 'tasks'
const GROUP_KEYS: GroupKey[] = ['overview', 'products', 'content', 'campaigns', 'contacts', 'shipments', 'documents', 'media', 'library', 'rules', 'promotion', 'tasks']

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'overview', label: 'סקירה' },
  { key: 'products', label: 'מוצרים' },
  { key: 'content', label: 'תוכן ותוכנית שבועית' },
  { key: 'campaigns', label: 'קמפיינים והשקות' },
  { key: 'contacts', label: 'אנשי קשר' },
  { key: 'shipments', label: 'הזמנות ומשלוחים' },
  { key: 'documents', label: 'מסמכים' },
  { key: 'media', label: 'מדיה ושיתופי פעולה' },
  { key: 'library', label: 'ספריית תוכן' },
  { key: 'rules', label: 'כללי תוכן' },
  { key: 'promotion', label: 'תוכנית קידום' },
  { key: 'tasks', label: 'משימות ותפעול' },
]

const MEDIA_CATEGORY_LABEL: Record<MediaAssetCategory, string> = {
  raw_media: 'חומר גלם',
  brand_asset: 'נכסי מותג',
  inspiration: 'השראה / רפרנסים',
  previous_content: 'תוכן קודם',
}

const RULE_TYPE_LABEL: Record<ContentRuleType, string> = {
  tone: 'טון דיבור',
  words_to_avoid: 'מילים להימנע מהן',
  claims: 'טענות אסורות',
  price_rules: 'כללי מחיר',
  promotion_rules: 'כללי קידום מכירות',
  visual_rules: 'כללים ויזואליים',
  other: 'אחר',
}

// תווית עברית ידידותית למפתחות ידועים; מפתח לא מוכר מוצג כמו שהוא (כדי להישאר גנרי לכל מותג עתידי).
const FIELD_LABELS: Record<string, string> = {
  full_name: 'שם מלא',
  country_of_origin: 'מדינת מקור',
  founding_year: 'שנת הקמה',
  brand_story: 'סיפור המותג',
  why_we_work_with_this_brand: 'למה עובדים עם המותג',
  business_status: 'מצב עסקי',
  status_in_israel: 'מצב בישראל',
  launch_status: 'מצב השקה',
  current_period_goals: 'מטרות התקופה הנוכחית',
  target_audience_general: 'קהל יעד',
  positioning: 'מיצוב',
  marketing_language: 'שפה שיווקית',
  brand_character: 'אופי המותג',
  advantages: 'יתרונות',
  barriers: 'חסמים',
  price_range: 'טווח מחירים',
  common_bottle_size_ml: 'גודל בקבוק נפוץ',
  retail_partner: 'שותף קמעונאי',
  fragrance_family: 'משפחת ריח',
  target_audience: 'קהל יעד',
  what_makes_it_special: 'מה מיוחד בו',
  key_message: 'מסר מרכזי',
  what_to_avoid_saying: 'מה לא לומר',
  portfolio_role: 'תפקיד בפורטפוליו',
  marketing_priority: 'עדיפות שיווקית',
  price: 'מחיר',
  stock_quantity: 'כמות מלאי',
  website: 'אתר',
  description: 'תיאור המותג',
  notes: 'הערות',
  priority: 'עדיפות',
  sku: 'SKU',
  barcode: 'ברקוד',
  sds_url: 'SDS/MSDS',
  dg_classification: 'סיווג חומ"ס',
  fragrance_profile: 'פרופיל ריח',
  marketing_angle: 'זווית שיווקית',
  main_audience: 'קהל יעד עיקרי',
  key_messages: 'מסרים מרכזיים',
  tone_of_voice: 'טון דיבור',
  important_products: 'מוצרים חשובים',
  current_objectives: 'מטרות נוכחיות',
  things_to_emphasize: 'דברים להדגיש',
  things_to_avoid: 'דברים להימנע מהם',
  current_campaign: 'קמפיין נוכחי',
  monthly_content_objective: 'יעד תוכן חודשי',
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, ' ')
}

function isEmptyValue(v: unknown): boolean {
  return v === null || v === undefined || v === '' || (Array.isArray(v) && v.length === 0)
}

// רינדור גנרי לאובייקט שדות — כדי לא לבנות מסך ייעודי לכל שדה בכל מותג עתידי.
function FieldList({ fields, skip = [] }: { fields: Record<string, unknown>; skip?: string[] }) {
  const entries = Object.entries(fields).filter(([k, v]) => !skip.includes(k) && !isEmptyValue(v) && typeof v !== 'object')
  const objectEntries = Object.entries(fields).filter(([k, v]) => !skip.includes(k) && !isEmptyValue(v) && typeof v === 'object' && !Array.isArray(v))
  const arrayEntries = Object.entries(fields).filter(([k, v]) => !skip.includes(k) && !isEmptyValue(v) && Array.isArray(v))

  return (
    <dl className="space-y-2.5 text-sm">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-stone-400 dark:text-stone-500">{fieldLabel(k)}</dt>
          <dd className="text-stone-700 dark:text-stone-200">{String(v)}</dd>
        </div>
      ))}
      {arrayEntries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-stone-400 dark:text-stone-500">{fieldLabel(k)}</dt>
          <dd className="text-stone-700 dark:text-stone-200">
            <ul className="list-disc pr-5 space-y-0.5">
              {(v as unknown[]).map((item, i) => (
                <li key={i}>{typeof item === 'object' ? JSON.stringify(item) : String(item)}</li>
              ))}
            </ul>
          </dd>
        </div>
      ))}
      {objectEntries.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-stone-400 dark:text-stone-500">{fieldLabel(k)}</dt>
          <dd className="text-stone-700 dark:text-stone-200 pr-2 border-r-2 border-stone-100 dark:border-stone-800">
            <FieldList fields={v as Record<string, unknown>} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

const BRAND_EDIT_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם המותג', type: 'text', required: true },
  {
    key: 'priority',
    label: 'עדיפות',
    type: 'select',
    options: [
      { value: 'high', label: 'גבוהה' },
      { value: 'medium', label: 'בינונית' },
      { value: 'low', label: 'נמוכה' },
    ],
  },
  { key: 'country_of_origin', label: 'מדינת מקור', type: 'text', secondary: true },
  { key: 'website', label: 'אתר', type: 'text', secondary: true },
  { key: 'description', label: 'תיאור המותג', type: 'textarea', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
  { key: 'main_audience', label: 'קהל יעד עיקרי', type: 'text', secondary: true },
  { key: 'positioning', label: 'מיצוב', type: 'text', secondary: true },
  { key: 'key_messages', label: 'מסרים מרכזיים', type: 'textarea', secondary: true },
  { key: 'tone_of_voice', label: 'טון דיבור', type: 'text', secondary: true },
  { key: 'important_products', label: 'מוצרים חשובים', type: 'text', secondary: true },
  { key: 'current_objectives', label: 'מטרות נוכחיות', type: 'textarea', secondary: true },
  { key: 'things_to_emphasize', label: 'דברים להדגיש', type: 'textarea', secondary: true },
  { key: 'things_to_avoid', label: 'דברים להימנע מהם', type: 'textarea', secondary: true },
  { key: 'current_campaign', label: 'קמפיין נוכחי', type: 'text', secondary: true },
  { key: 'monthly_content_objective', label: 'יעד תוכן חודשי', type: 'text', secondary: true },
]

const PRODUCT_EDIT_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם המוצר', type: 'text', required: true },
  { key: 'price', label: 'מחיר', type: 'number' },
  { key: 'sku', label: 'SKU', type: 'text', secondary: true },
  { key: 'barcode', label: 'ברקוד', type: 'text', secondary: true },
  { key: 'sds_url', label: 'קישור ל-SDS/MSDS', type: 'text', secondary: true },
  { key: 'dg_classification', label: 'סיווג חומ"ס', type: 'text', secondary: true },
  { key: 'launch_status', label: 'מצב השקה', type: 'text', secondary: true },
  {
    key: 'priority',
    label: 'עדיפות מוצר',
    type: 'select',
    secondary: true,
    options: [
      { value: 'high', label: 'גבוהה' },
      { value: 'medium', label: 'בינונית' },
      { value: 'low', label: 'נמוכה' },
    ],
  },
  { key: 'fragrance_profile', label: 'פרופיל ריח', type: 'textarea', secondary: true },
  { key: 'marketing_angle', label: 'זווית שיווקית', type: 'textarea', secondary: true },
  { key: 'target_audience', label: 'קהל יעד', type: 'text', secondary: true },
]

const CONTACT_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם', type: 'text', required: true },
  { key: 'role', label: 'תפקיד', type: 'text' },
  { key: 'email', label: 'Email', type: 'text', secondary: true },
  { key: 'phone', label: 'טלפון', type: 'text', secondary: true },
  { key: 'whatsapp', label: 'WhatsApp', type: 'text', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const BRAND_DOC_CATEGORY_LABEL: Record<BrandDocCategory, string> = {
  sds_msds: 'SDS / MSDS',
  dangerous_goods: 'Dangerous Goods',
  regulatory: 'Regulatory',
  certificates: 'Certificates',
  invoices: 'Invoices',
  packing_lists: 'Packing Lists',
  agreements: 'Agreements',
  product_documents: 'Product Documents',
  other: 'אחר',
}

const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  preparing: 'בהכנה',
  waiting_for_quotes: 'ממתין להצעות',
  quotes_received: 'התקבלו הצעות',
  waiting_for_pickup: 'ממתין לאיסוף',
  picked_up: 'נאסף',
  in_transit: 'בדרך',
  customs: 'במכס',
  delivered: 'התקבל',
  missing_documents: 'חסרים מסמכים',
  issue: 'בעיה',
}
const SHIPMENT_STATUS_TONE: Record<ShipmentStatus, PillTone> = {
  preparing: 'neutral',
  waiting_for_quotes: 'warm',
  quotes_received: 'warm',
  waiting_for_pickup: 'warm',
  picked_up: 'calm',
  in_transit: 'calm',
  customs: 'warm',
  delivered: 'calm',
  missing_documents: 'alert',
  issue: 'alert',
}

export default function BrandDetailPage() {
  const { brandId } = useParams<{ brandId: string }>()
  const [searchParams] = useSearchParams()
  const confirm = useConfirm()
  const {
    brands,
    brandProducts,
    brandCampaigns,
    brandContentItems,
    brandPendingActivities,
    brandMediaAssets,
    brandContacts,
    brandDocuments,
    shipments,
    items,
    contentMediaAssets,
    contentRules,
    promotionPlans,
    contentPieces,
    updateBrand,
    deleteBrand,
    addBrandProduct,
    updateBrandProduct,
    deleteBrandProduct,
    addBrandContact,
    updateBrandContact,
    deleteBrandContact,
    addBrandDocument,
    deleteBrandDocument,
    addContentMediaAsset,
    deleteContentMediaAsset,
    addContentRule,
    deleteContentRule,
    addOrUpdatePromotionPlan,
  } = useStore()
  const tabParam = searchParams.get('tab') as GroupKey | null
  const highlightContentId = searchParams.get('item')
  const [group, setGroup] = useState<GroupKey>(tabParam && GROUP_KEYS.includes(tabParam) ? tabParam : 'overview')
  const [editOpen, setEditOpen] = useState(false)
  const [productModal, setProductModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [contactModal, setContactModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [docOpen, setDocOpen] = useState(false)
  const [libraryFilter, setLibraryFilter] = useState<MediaAssetCategory | 'all'>('all')
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [ruleOpen, setRuleOpen] = useState(false)
  const [promotionOpen, setPromotionOpen] = useState(false)

  const brand = brands.find((b) => b.id === brandId)

  useEffect(() => {
    if (!highlightContentId || group !== 'content') return
    const el = document.getElementById(`content-${highlightContentId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightContentId, group])

  if (!brand) return <Navigate to="/work/brands" replace />

  const products = brandProducts.filter((p) => p.brandId === brand.id)
  const campaigns = brandCampaigns.filter((c) => c.brandId === brand.id)
  const contentItems = [...brandContentItems.filter((c) => c.brandId === brand.id)].sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  const pendingActivities = brandPendingActivities.filter((a) => a.brandId === brand.id)
  const mediaAssets = brandMediaAssets.filter((m) => m.brandId === brand.id)
  const contacts = brandContacts.filter((c) => c.brandId === brand.id)
  const documents = brandDocuments.filter((d) => d.brandId === brand.id)
  const brandShipments = [...shipments.filter((s) => s.brandId === brand.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const tasks = items.filter((it) => it.brandId === brand.id)
  const awaitingApproval = contentItems.filter((c) => c.awaitingApproval)
  const libraryAssets = contentMediaAssets.filter((m) => m.brandId === brand.id && (libraryFilter === 'all' || m.category === libraryFilter))
  const brandRules = contentRules.filter((r) => r.brandId === brand.id)
  const promotionPlan = promotionPlans.find((p) => p.brandId === brand.id)

  // "השבוע" = ראשון עד שבת נוכחי, לחישוב "הושלם/נותר" חי מתוך פיסות תוכן שכבר פורסמו.
  const weekStart = new Date(todayISO() + 'T00:00:00')
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekStartISO = weekStart.toISOString().slice(0, 10)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekEndISO = weekEnd.toISOString().slice(0, 10)
  const publishedThisWeek = contentPieces.filter(
    (c) => c.brandId === brand.id && c.status === 'published' && c.publishDate && c.publishDate >= weekStartISO && c.publishDate <= weekEndISO,
  )
  const weeklyCompleted = {
    reel: publishedThisWeek.filter((c) => c.contentType === 'reel').length,
    story: publishedThisWeek.filter((c) => c.contentType === 'story').length,
    carousel: publishedThisWeek.filter((c) => c.contentType === 'carousel').length,
    post: publishedThisWeek.filter((c) => c.contentType === 'post').length,
    tiktok: publishedThisWeek.filter((c) => c.contentType === 'tiktok').length,
  }

  const fields = brand.fields as Record<string, unknown>
  const marketingStrategy = (fields.marketingStrategy ?? {}) as Record<string, unknown>
  const weeklyPlan = (fields.weeklyPlan ?? {}) as Record<string, unknown>
  const instagramComposio = (fields.instagramComposio ?? null) as Record<string, unknown> | null
  const standingRules = (fields.standingRules ?? []) as { id: string; title: string; description?: string }[]

  async function handleSaveBrand(values: Record<string, string>) {
    const marketingKeys = [
      'main_audience',
      'positioning',
      'key_messages',
      'tone_of_voice',
      'important_products',
      'current_objectives',
      'things_to_emphasize',
      'things_to_avoid',
      'current_campaign',
      'monthly_content_objective',
    ]
    const nextMarketing: Record<string, unknown> = { ...marketingStrategy }
    marketingKeys.forEach((k) => {
      if (values[k]?.trim()) nextMarketing[k] = values[k].trim()
    })
    await updateBrand(brand!.id, {
      name: values.name?.trim(),
      fields: {
        ...fields,
        priority: values.priority || fields.priority,
        country_of_origin: values.country_of_origin?.trim() || fields.country_of_origin,
        website: values.website?.trim() || fields.website,
        description: values.description?.trim() || fields.description,
        notes: values.notes?.trim() || fields.notes,
        marketingStrategy: nextMarketing,
      },
    })
    setEditOpen(false)
  }

  function productInitialValues(p?: BrandProduct): Record<string, string> {
    if (!p) return {}
    const f = p.fields as Record<string, unknown>
    return {
      name: p.name,
      price: f.price !== undefined ? String(f.price) : '',
      sku: (f.sku as string) ?? '',
      barcode: (f.barcode as string) ?? '',
      sds_url: (f.sds_url as string) ?? '',
      dg_classification: (f.dg_classification as string) ?? '',
      launch_status: (f.launch_status as string) ?? '',
      priority: (f.priority as string) ?? '',
      fragrance_profile: (f.fragrance_profile as string) ?? '',
      marketing_angle: (f.marketing_angle as string) ?? '',
      target_audience: (f.target_audience as string) ?? '',
    }
  }

  async function handleSaveProduct(values: Record<string, string>) {
    const data = {
      brandId: brand!.id,
      name: values.name?.trim(),
      fields: {
        price: values.price ? Number(values.price) : undefined,
        sku: values.sku?.trim() || undefined,
        barcode: values.barcode?.trim() || undefined,
        sds_url: values.sds_url?.trim() || undefined,
        dg_classification: values.dg_classification?.trim() || undefined,
        launch_status: values.launch_status?.trim() || undefined,
        priority: values.priority || undefined,
        fragrance_profile: values.fragrance_profile?.trim() || undefined,
        marketing_angle: values.marketing_angle?.trim() || undefined,
        target_audience: values.target_audience?.trim() || undefined,
      },
    }
    if (productModal.editingId) await updateBrandProduct(productModal.editingId, data)
    else await addBrandProduct(data)
    setProductModal({ open: false })
  }

  async function handleDeleteBrand() {
    const ok = await confirm({ title: 'מחיקת מותג', message: `למחוק את ${brand!.name}? הפעולה בלתי הפיכה.`, confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteBrand(brand!.id)
  }

  async function handleDeleteProduct() {
    if (!productModal.editingId) return
    const ok = await confirm({ title: 'מחיקת מוצר', message: 'למחוק את המוצר הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteBrandProduct(productModal.editingId)
    setProductModal({ open: false })
  }

  function contactInitialValues(c?: BrandContact): Record<string, string> {
    if (!c) return {}
    return { name: c.name, role: c.role ?? '', email: c.email ?? '', phone: c.phone ?? '', whatsapp: c.whatsapp ?? '', notes: c.notes ?? '' }
  }

  async function handleSaveContact(values: Record<string, string>) {
    const data = {
      brandId: brand!.id,
      name: values.name?.trim(),
      role: values.role?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      whatsapp: values.whatsapp?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    }
    if (contactModal.editingId) await updateBrandContact(contactModal.editingId, data)
    else await addBrandContact(data)
    setContactModal({ open: false })
  }

  async function handleDeleteContact() {
    if (!contactModal.editingId) return
    const ok = await confirm({ title: 'מחיקת איש קשר', message: 'למחוק את איש הקשר הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteBrandContact(contactModal.editingId)
    setContactModal({ open: false })
  }

  async function handleAddDocument(values: Record<string, string>) {
    await addBrandDocument({
      brandId: brand!.id,
      category: (values.category as BrandDocCategory) || 'other',
      name: values.name?.trim(),
      url: values.url?.trim() || undefined,
      relatedProductId: values.relatedProductId || undefined,
      notes: values.notes?.trim() || undefined,
    })
    setDocOpen(false)
  }

  async function handleAddLibraryAsset(values: Record<string, string>) {
    const data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'> = {
      brandId: brand!.id,
      category: (values.category as MediaAssetCategory) || 'raw_media',
      name: values.name?.trim(),
      url: values.url?.trim() || undefined,
      productId: values.productId || undefined,
      source: values.source?.trim() || undefined,
      whyILike: values.whyILike?.trim() || undefined,
      tags: values.tags?.trim() ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
      notes: values.notes?.trim() || undefined,
    }
    await addContentMediaAsset(data)
    setLibraryOpen(false)
  }

  async function handleAddRule(values: Record<string, string>) {
    const data: Omit<ContentRule, 'id' | 'createdAt' | 'updatedAt'> = {
      brandId: brand!.id,
      ruleType: (values.ruleType as ContentRuleType) || 'other',
      text: values.text?.trim(),
    }
    await addContentRule(data)
    setRuleOpen(false)
  }

  async function handleSavePromotion(values: Record<string, string>) {
    await addOrUpdatePromotionPlan(brand!.id, {
      priority: (values.priority as 'high' | 'medium' | 'low') || 'medium',
      weeklyReels: values.weeklyReels ? Number(values.weeklyReels) : undefined,
      weeklyStories: values.weeklyStories ? Number(values.weeklyStories) : undefined,
      weeklyCarousels: values.weeklyCarousels ? Number(values.weeklyCarousels) : undefined,
      weeklyPosts: values.weeklyPosts ? Number(values.weeklyPosts) : undefined,
      weeklyTiktoks: values.weeklyTiktoks ? Number(values.weeklyTiktoks) : undefined,
      notes: values.notes?.trim() || undefined,
    })
    setPromotionOpen(false)
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <BackLink to="/work/brands" label="כל המותגים" />
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">{brand.name}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <FilterChip key={g.key} active={group === g.key} onClick={() => setGroup(g.key)}>
            {g.label}
          </FilterChip>
        ))}
      </div>

      {group === 'overview' && (
        <div className="space-y-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">סקירה כללית ואסטרטגיה</h2>
              <button onClick={() => setEditOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                ערוך
              </button>
            </div>
            <FieldList
              fields={fields}
              skip={['id', 'name', 'marketingStrategy', 'weeklyPlan', 'kpiReview', 'instagramComposio', 'standingRules', 'missingInformation', 'unrelated_incident_note']}
            />
            {Object.keys(marketingStrategy).length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">אסטרטגיית שיווק</h3>
                <FieldList fields={marketingStrategy} />
              </div>
            )}
            {standingRules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">כללי עבודה קבועים</h3>
                <ul className="text-sm text-stone-600 dark:text-stone-300 space-y-1.5">
                  {standingRules.map((r) => (
                    <li key={r.id}>
                      <span className="font-medium">{r.title}</span>
                      {r.description && <span className="text-stone-400 dark:text-stone-500"> — {r.description}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <button onClick={handleDeleteBrand} className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400">
            מחק מותג
          </button>
        </div>
      )}

      {group === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setProductModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף מוצר
            </button>
          </div>
          {products.length === 0 && (
            <Card>
              <EmptyLine text="אין עדיין מוצרים למותג הזה" />
            </Card>
          )}
          {products.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">{p.name}</h3>
                <button onClick={() => setProductModal({ open: true, editingId: p.id })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                  ערוך
                </button>
              </div>
              <FieldList fields={p.fields as Record<string, unknown>} skip={['id', 'brand_id', 'name']} />
            </Card>
          ))}
        </div>
      )}

      {group === 'content' && (
        <div className="space-y-4">
          {Object.keys(weeklyPlan).length > 0 && (
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">תוכנית שבועית</h3>
              <FieldList fields={weeklyPlan} skip={['id', 'brand_id']} />
            </Card>
          )}
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-0">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">לוח תוכן</h3>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {contentItems.length === 0 && <EmptyLine text="אין עדיין פריטי תוכן" />}
              {contentItems.map((c) => (
                <li key={c.id} id={`content-${c.id}`} className={`py-3 ${highlightContentId === c.id ? 'bg-amber-50 dark:bg-amber-950/40 -mx-5 px-5 rounded-lg' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{c.title}</span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 whitespace-nowrap">
                      {c.date ?? 'ללא תאריך'}
                      {c.time ? ` · ${c.time}` : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    {c.format && <span>{c.format}</span>}
                    {c.priority && <span>· עדיפות {c.priority}</span>}
                    <span
                      className={
                        c.published
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : c.awaitingApproval
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-stone-400 dark:text-stone-500'
                      }
                    >
                      · {c.published ? 'פורסם' : c.awaitingApproval ? 'ממתין לאישור' : c.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {group === 'campaigns' && (
        <div className="space-y-4">
          {campaigns.length === 0 && (
            <Card>
              <EmptyLine text="אין עדיין קמפיינים" />
            </Card>
          )}
          {campaigns.map((c) => (
            <Card key={c.id}>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">{c.name}</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-3">
                {c.startDate} → {c.endDate}
              </p>
              <FieldList fields={c.fields as Record<string, unknown>} skip={['id', 'brand_id', 'name', 'start_date', 'end_date']} />
            </Card>
          ))}
        </div>
      )}

      {group === 'contacts' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">אנשי קשר</h3>
            <button onClick={() => setContactModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף איש קשר
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {contacts.length === 0 && <EmptyLine text="עדיין אין אנשי קשר" />}
            {contacts.map((c) => (
              <li key={c.id} className="py-3 cursor-pointer" onClick={() => setContactModal({ open: true, editingId: c.id })}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{c.name}</span>
                  {c.role && <span className="text-xs text-stone-400 dark:text-stone-500">{c.role}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                  {c.email && <span>{c.email}</span>}
                  {c.phone && <span>· {c.phone}</span>}
                  {c.whatsapp && <span>· WhatsApp {c.whatsapp}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'shipments' && (
        <Card className="!p-0 overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">הזמנות ומשלוחים</h3>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {brandShipments.length === 0 && <EmptyLine text="אין עדיין משלוחים מול הספק הזה" />}
            {brandShipments.map((s) => (
              <li key={s.id} className="py-3">
                <Link to={`/work/shipments/${s.id}`} className="block">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                      #{s.id.slice(-6)} {s.goodsType ? `· ${s.goodsType}` : ''}
                    </span>
                    <StatusPill label={SHIPMENT_STATUS_LABEL[s.status]} tone={SHIPMENT_STATUS_TONE[s.status]} />
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    {s.shipmentValue !== undefined && <span>{s.shipmentValue} {s.currency}</span>}
                    {s.selectedForwarderId && <span>· {s.selectedForwarderId}</span>}
                    <span>· עודכן {s.updatedAt.slice(0, 10)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'documents' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">מסמכים</h3>
            <button onClick={() => setDocOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף מסמך
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {documents.length === 0 && <EmptyLine text="עדיין אין מסמכים" />}
            {documents.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-stone-800 dark:text-stone-100">{d.name}</span>
                  <span className="text-stone-400 dark:text-stone-500"> — {BRAND_DOC_CATEGORY_LABEL[d.category]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-amber-800 dark:text-amber-400 hover:underline">
                      פתח
                    </a>
                  )}
                  <button onClick={() => deleteBrandDocument(d.id)} className="text-stone-300 hover:text-red-500" aria-label="מחק">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'media' && (
        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-0">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-1">חומרי מדיה</h3>
              <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">מניפסט בלבד — הקבצים עצמם נשארו במקומם המקורי ולא הועתקו.</p>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {mediaAssets.length === 0 && <EmptyLine text="אין קבצי מדיה רשומים" />}
              {mediaAssets.map((m) => (
                <li key={m.id} className="py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-stone-800 dark:text-stone-100 truncate">{m.fileName}</span>
                    <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">{m.fileType}</span>
                  </div>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                    {m.originalFolder && <span>{m.originalFolder} · </span>}
                    <span className="text-amber-700 dark:text-amber-400">{m.availabilityStatus}</span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          {instagramComposio && (
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">סטטוס אינטגרציות (מידע בלבד — לא מחובר בפועל בשלב הזה)</h3>
              <FieldList fields={instagramComposio} skip={['id', 'brand_id']} />
            </Card>
          )}
        </div>
      )}

      {group === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-2">
              <FilterChip active={libraryFilter === 'all'} onClick={() => setLibraryFilter('all')}>
                הכול
              </FilterChip>
              {(Object.keys(MEDIA_CATEGORY_LABEL) as MediaAssetCategory[]).map((c) => (
                <FilterChip key={c} active={libraryFilter === c} onClick={() => setLibraryFilter(c)}>
                  {MEDIA_CATEGORY_LABEL[c]}
                </FilterChip>
              ))}
            </div>
            <button onClick={() => setLibraryOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף לספרייה
            </button>
          </div>
          <Card className="!p-0 overflow-hidden">
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {libraryAssets.length === 0 && <EmptyLine text="עדיין אין חומרים בספרייה" />}
              {libraryAssets.map((m) => (
                <li key={m.id} className="py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{m.name}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {m.url && (
                        <a href={m.url} target="_blank" rel="noreferrer" className="text-xs text-amber-800 dark:text-amber-400 hover:underline">
                          פתח
                        </a>
                      )}
                      <button onClick={() => deleteContentMediaAsset(m.id)} className="text-stone-300 hover:text-red-500" aria-label="מחק">
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                    <span>{MEDIA_CATEGORY_LABEL[m.category]}</span>
                    {m.source && <span>· {m.source}</span>}
                    {m.whyILike && <span>· {m.whyILike}</span>}
                    {m.tags && m.tags.length > 0 && <span>· {m.tags.join(', ')}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {group === 'rules' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">כללי תוכן</h3>
            <button onClick={() => setRuleOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף כלל
            </button>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500 px-5 pb-3">
            אין להמציא מבצע, מלאי מוגבל, מחיר מיוחד, בלעדיות או עובדות על מוצר — אלא אם המידע מופיע בנתוני המוצר/מותג או שאושר במפורש.
          </p>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {brandRules.length === 0 && <EmptyLine text="עדיין אין כללים שמורים" />}
            {brandRules.map((r) => (
              <li key={r.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-xs text-stone-400 dark:text-stone-500">{RULE_TYPE_LABEL[r.ruleType]}</span>
                  <div className="text-stone-800 dark:text-stone-100">{r.text}</div>
                </div>
                <button onClick={() => deleteContentRule(r.id)} className="text-stone-300 hover:text-red-500 shrink-0" aria-label="מחק">
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'promotion' && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">תוכנית קידום שבועית</h2>
            <button onClick={() => setPromotionOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              ערוך
            </button>
          </div>
          {!promotionPlan ? (
            <EmptyLine text="עדיין לא הוגדרה תוכנית קידום למותג הזה" />
          ) : (
            <>
              <div className="mb-4">
                <StatusPill
                  label={promotionPlan.priority === 'high' ? 'עדיפות גבוהה' : promotionPlan.priority === 'medium' ? 'עדיפות בינונית' : 'עדיפות נמוכה'}
                  tone={promotionPlan.priority === 'high' ? 'alert' : promotionPlan.priority === 'medium' ? 'warm' : 'neutral'}
                />
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                {[
                  ['Reels', promotionPlan.weeklyReels, weeklyCompleted.reel],
                  ['Stories', promotionPlan.weeklyStories, weeklyCompleted.story],
                  ['Carousels', promotionPlan.weeklyCarousels, weeklyCompleted.carousel],
                  ['Posts', promotionPlan.weeklyPosts, weeklyCompleted.post],
                  ['TikTok', promotionPlan.weeklyTiktoks, weeklyCompleted.tiktok],
                ]
                  .filter(([, target]) => target !== undefined)
                  .map(([label, target, done]) => (
                    <div key={label as string}>
                      <dt className="text-xs text-stone-400 dark:text-stone-500">{label}</dt>
                      <dd className="text-stone-700 dark:text-stone-200 font-medium">
                        {done as number}/{target as number} השבוע
                      </dd>
                    </div>
                  ))}
              </dl>
              {promotionPlan.notes && (
                <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800 text-sm text-stone-700 dark:text-stone-200">{promotionPlan.notes}</div>
              )}
            </>
          )}
        </Card>
      )}

      {group === 'tasks' && (
        <div className="space-y-4">
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 pb-0">
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">משימות</h3>
            </div>
            <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
              {tasks.length === 0 && <EmptyLine text="אין משימות פתוחות" />}
              {tasks.map((t) => (
                <li key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                  <span className={`text-sm ${t.status === 'done' ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>
                    {t.title}
                  </span>
                  {t.contentItemId && <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">🔗 קשור לתוכן</span>}
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-3">מחכה לאישור</h3>
            {pendingActivities.length === 0 && awaitingApproval.length === 0 && <EmptyLine text="אין כרגע כלום שממתין לאישור" />}
            <ul className="space-y-2">
              {awaitingApproval.map((c) => (
                <li key={c.id} className="text-sm text-stone-700 dark:text-stone-200">
                  📣 {c.title} — פריט תוכן ממתין לאישור{c.date ? ` (${c.date})` : ''}
                </li>
              ))}
              {pendingActivities.map((a) => (
                <li key={a.id} className="text-sm text-stone-700 dark:text-stone-200">
                  ⏳ {a.description}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <QuickAddPopover
        open={editOpen}
        title="עריכת מותג ואסטרטגיה"
        fields={BRAND_EDIT_FIELDS}
        initialValues={{
          name: brand.name,
          priority: (fields.priority as string) ?? '',
          country_of_origin: (fields.country_of_origin as string) ?? '',
          website: (fields.website as string) ?? '',
          description: (fields.description as string) ?? '',
          notes: (fields.notes as string) ?? '',
          main_audience: (marketingStrategy.main_audience as string) ?? '',
          positioning: (marketingStrategy.positioning as string) ?? '',
          key_messages: (marketingStrategy.key_messages as string) ?? '',
          tone_of_voice: (marketingStrategy.tone_of_voice as string) ?? '',
          important_products: (marketingStrategy.important_products as string) ?? '',
          current_objectives: (marketingStrategy.current_objectives as string) ?? '',
          things_to_emphasize: (marketingStrategy.things_to_emphasize as string) ?? '',
          things_to_avoid: (marketingStrategy.things_to_avoid as string) ?? '',
          current_campaign: (marketingStrategy.current_campaign as string) ?? '',
          monthly_content_objective: (marketingStrategy.monthly_content_objective as string) ?? '',
        }}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveBrand}
      />

      <QuickAddPopover
        open={productModal.open}
        title={productModal.editingId ? 'עריכת מוצר' : 'הוספת מוצר'}
        fields={PRODUCT_EDIT_FIELDS}
        initialValues={productInitialValues(products.find((p) => p.id === productModal.editingId))}
        onClose={() => setProductModal({ open: false })}
        onSave={handleSaveProduct}
        onDelete={productModal.editingId ? handleDeleteProduct : undefined}
      />

      <QuickAddPopover
        open={contactModal.open}
        title={contactModal.editingId ? 'עריכת איש קשר' : 'הוספת איש קשר'}
        fields={CONTACT_FIELDS}
        initialValues={contactInitialValues(contacts.find((c) => c.id === contactModal.editingId))}
        onClose={() => setContactModal({ open: false })}
        onSave={handleSaveContact}
        onDelete={contactModal.editingId ? handleDeleteContact : undefined}
      />

      <QuickAddPopover
        open={docOpen}
        title="הוספת מסמך"
        fields={[
          { key: 'category', label: 'קטגוריה', type: 'select', required: true, options: (Object.keys(BRAND_DOC_CATEGORY_LABEL) as BrandDocCategory[]).map((c) => ({ value: c, label: BRAND_DOC_CATEGORY_LABEL[c] })) },
          { key: 'name', label: 'שם המסמך', type: 'text', required: true },
          { key: 'url', label: 'קישור', type: 'text', secondary: true },
          { key: 'relatedProductId', label: 'מוצר קשור', type: 'select', secondary: true, options: products.map((p) => ({ value: p.id, label: p.name })) },
          { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
        ]}
        onClose={() => setDocOpen(false)}
        onSave={handleAddDocument}
      />

      <QuickAddPopover
        open={libraryOpen}
        title="הוספה לספריית תוכן"
        fields={[
          {
            key: 'category',
            label: 'קטגוריה',
            type: 'select',
            required: true,
            options: (Object.keys(MEDIA_CATEGORY_LABEL) as MediaAssetCategory[]).map((c) => ({ value: c, label: MEDIA_CATEGORY_LABEL[c] })),
          },
          { key: 'name', label: 'שם', type: 'text', required: true },
          { key: 'url', label: 'קישור / קובץ', type: 'text' },
          { key: 'productId', label: 'מוצר קשור', type: 'select', secondary: true, options: products.map((p) => ({ value: p.id, label: p.name })) },
          { key: 'source', label: 'מקור', type: 'text', secondary: true },
          { key: 'whyILike', label: 'למה זה מוצא חן בעיניי', type: 'textarea', secondary: true },
          { key: 'tags', label: 'תגיות (מופרדות בפסיקים)', type: 'text', secondary: true },
          { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
        ]}
        onClose={() => setLibraryOpen(false)}
        onSave={handleAddLibraryAsset}
      />

      <QuickAddPopover
        open={ruleOpen}
        title="הוספת כלל תוכן"
        fields={[
          {
            key: 'ruleType',
            label: 'סוג כלל',
            type: 'select',
            required: true,
            options: (Object.keys(RULE_TYPE_LABEL) as ContentRuleType[]).map((t) => ({ value: t, label: RULE_TYPE_LABEL[t] })),
          },
          { key: 'text', label: 'הכלל', type: 'textarea', required: true },
        ]}
        onClose={() => setRuleOpen(false)}
        onSave={handleAddRule}
      />

      <QuickAddPopover
        open={promotionOpen}
        title="עריכת תוכנית קידום"
        fields={[
          {
            key: 'priority',
            label: 'עדיפות',
            type: 'select',
            options: [
              { value: 'high', label: 'גבוהה' },
              { value: 'medium', label: 'בינונית' },
              { value: 'low', label: 'נמוכה' },
            ],
          },
          { key: 'weeklyReels', label: 'Reels לשבוע', type: 'number' },
          { key: 'weeklyStories', label: 'Stories לשבוע', type: 'number' },
          { key: 'weeklyCarousels', label: 'Carousels לשבוע', type: 'number', secondary: true },
          { key: 'weeklyPosts', label: 'Posts לשבוע', type: 'number', secondary: true },
          { key: 'weeklyTiktoks', label: 'TikTok לשבוע', type: 'number', secondary: true },
          { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
        ]}
        initialValues={{
          priority: promotionPlan?.priority ?? 'medium',
          weeklyReels: promotionPlan?.weeklyReels !== undefined ? String(promotionPlan.weeklyReels) : '',
          weeklyStories: promotionPlan?.weeklyStories !== undefined ? String(promotionPlan.weeklyStories) : '',
          weeklyCarousels: promotionPlan?.weeklyCarousels !== undefined ? String(promotionPlan.weeklyCarousels) : '',
          weeklyPosts: promotionPlan?.weeklyPosts !== undefined ? String(promotionPlan.weeklyPosts) : '',
          weeklyTiktoks: promotionPlan?.weeklyTiktoks !== undefined ? String(promotionPlan.weeklyTiktoks) : '',
          notes: promotionPlan?.notes ?? '',
        }}
        onClose={() => setPromotionOpen(false)}
        onSave={handleSavePromotion}
      />
    </div>
  )
}
