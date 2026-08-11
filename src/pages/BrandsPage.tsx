import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { TargetIcon, CalendarIcon, BulbIcon, CameraIcon, CompassIcon, WrenchIcon, MegaphoneIcon } from '../components/hub/hubIcons'
import { todayISO } from '../utils/date'
import { Brand, BrandCampaign } from '../data/brandTypes'
import { ContentPieceType } from '../data/contentStudioTypes'

const CONTENT_TOOLS = [
  { to: '/work/today', label: 'התוכן להיום', icon: TargetIcon },
  { to: '/work/content-calendar', label: 'לוח תוכן', icon: CalendarIcon },
  { to: '/work/ideas', label: 'מאגר רעיונות', icon: BulbIcon },
  { to: '/work/scripts', label: 'תסריטים', icon: CameraIcon },
  { to: '/work/content-analytics', label: 'אנליטיקה', icon: CompassIcon },
  { to: '/work/creative-tools', label: 'כלי יצירה', icon: WrenchIcon },
]

const ADD_BRAND_FIELDS: QuickAddField[] = [
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
]

const WEEKDAY_LABELS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const CONTENT_TYPE_LABEL: Record<ContentPieceType, string> = { reel: 'Reel', story: 'Story', post: 'Post', carousel: 'Carousel', tiktok: 'TikTok', other: 'תוכן' }
const IMAGE_FIELD_KEYS = ['logo', 'logo_url', 'image', 'image_url', 'imageUrl', 'photo', 'cover_image']

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function currentWeekDates(): string[] {
  const today = new Date(todayISO() + 'T00:00:00')
  const sunday = new Date(today)
  sunday.setDate(today.getDate() - today.getDay())
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday)
    d.setDate(sunday.getDate() + i)
    return toISO(d)
  })
}

function fieldStr(fields: Record<string, unknown>, key: string): string | undefined {
  const v = fields[key]
  return typeof v === 'string' && v.trim() ? v : undefined
}

function brandImageUrl(brand: Brand): string | undefined {
  for (const key of IMAGE_FIELD_KEYS) {
    const v = fieldStr(brand.fields, key)
    if (v) return v
  }
  return undefined
}

// קמפיין נחשב "פעיל" רק כשיש טווח תאריכים מלא שמכיל את היום — לא מנחשים סטטוס בלי תאריכים.
function isCampaignActiveByDate(c: BrandCampaign, today: string): boolean {
  return !!c.startDate && !!c.endDate && c.startDate <= today && today <= c.endDate
}

function campaignStatus(c: BrandCampaign, today: string): { label: string; tone: PillTone } | null {
  if (c.startDate && today < c.startDate) return { label: 'טרם התחיל', tone: 'neutral' }
  if (c.endDate && today > c.endDate) return { label: 'הסתיים', tone: 'neutral' }
  if (c.startDate && c.endDate) return { label: 'פעיל', tone: 'calm' }
  return null
}

function brandActiveCampaignLabel(brand: Brand, campaigns: BrandCampaign[], today: string): string | undefined {
  const marketingStrategy = (brand.fields.marketingStrategy ?? {}) as Record<string, unknown>
  const fromStrategy = fieldStr(marketingStrategy, 'current_campaign')
  if (fromStrategy) return fromStrategy
  return campaigns.find((c) => c.brandId === brand.id && isCampaignActiveByDate(c, today))?.name
}

export default function BrandsPage() {
  const { brands, brandProducts, brandContentItems, brandCampaigns, brandPendingActivities, contentPieces, addBrand } = useStore()
  const [addOpen, setAddOpen] = useState(false)
  const today = todayISO()
  const weekDates = useMemo(() => currentWeekDates(), [])
  const weekEnd = weekDates[6]

  function brandName(brandId: string): string {
    return brands.find((b) => b.id === brandId)?.name ?? '—'
  }
  function productCountOf(brandId: string): number {
    return brandProducts.filter((p) => p.brandId === brandId).length
  }
  function contentCountOf(brandId: string): number {
    return brandContentItems.filter((c) => c.brandId === brandId).length
  }

  const focusBrand = useMemo(() => {
    if (brands.length === 0) return undefined
    const highPriority = brands.find((b) => fieldStr(b.fields, 'priority') === 'high')
    return highPriority ?? [...brands].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  }, [brands])

  const approvalItems = useMemo(() => {
    const fromContent = brandContentItems
      .filter((c) => c.awaitingApproval)
      .map((c) => ({ id: c.id, title: c.title, brand: brandName(c.brandId), kind: 'תוכן' }))
    const fromPieces = contentPieces
      .filter((c) => c.status === 'waiting_approval')
      .map((c) => ({ id: c.id, title: c.creativeIdea || CONTENT_TYPE_LABEL[c.contentType], brand: brandName(c.brandId), kind: CONTENT_TYPE_LABEL[c.contentType] }))
    const fromPending = brandPendingActivities.map((a) => ({ id: a.id, title: a.description, brand: brandName(a.brandId), kind: 'פעילות' }))
    return [...fromContent, ...fromPieces, ...fromPending]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandContentItems, contentPieces, brandPendingActivities, brands])

  const upcomingThisWeekCount = useMemo(() => {
    const fromContent = brandContentItems.filter((c) => c.date && c.date >= today && c.date <= weekEnd && !c.published).length
    const fromPieces = contentPieces.filter((c) => {
      const d = c.publishDate || c.scheduledDate || c.dueDate
      return d && d >= today && d <= weekEnd && c.status !== 'published'
    }).length
    return fromContent + fromPieces
  }, [brandContentItems, contentPieces, today, weekEnd])

  const systemActiveCampaign = useMemo(() => {
    const byDate = brandCampaigns.find((c) => isCampaignActiveByDate(c, today))
    if (byDate) return byDate.name
    return focusBrand ? brandActiveCampaignLabel(focusBrand, brandCampaigns, today) : undefined
  }, [brandCampaigns, focusBrand, today])

  const weekBoard = useMemo(() => {
    const map: Record<string, { label: string; brand: string }[]> = {}
    weekDates.forEach((d) => (map[d] = []))
    brandContentItems.forEach((c) => {
      if (c.date && map[c.date]) map[c.date].push({ label: c.format || 'תוכן', brand: brandName(c.brandId) })
    })
    contentPieces.forEach((c) => {
      const d = c.publishDate || c.scheduledDate || c.dueDate
      if (d && map[d]) map[d].push({ label: CONTENT_TYPE_LABEL[c.contentType], brand: brandName(c.brandId) })
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandContentItems, contentPieces, weekDates, brands])

  async function handleAddBrand(values: Record<string, string>) {
    await addBrand({
      name: values.name?.trim(),
      domain: 'work',
      fields: {
        priority: values.priority || undefined,
        country_of_origin: values.country_of_origin?.trim() || undefined,
        website: values.website?.trim() || undefined,
        description: values.description?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      },
    })
    setAddOpen(false)
  }

  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">קידום מותגים</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">כל המותגים, הקמפיינים והתוכן במקום אחד</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl border border-amber-800 text-amber-800 dark:text-amber-400 dark:border-amber-700 text-sm font-medium">
            + הוסף מותג
          </button>
          <Link to="/work/brands/import" className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            ייבוא חבילת מותג
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {CONTENT_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-500 dark:text-stone-400 hover:border-amber-300 dark:hover:border-amber-800 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {tool.label}
            </Link>
          )
        })}
      </div>

      {/* 1. השבוע בקידום — רצועה קומפקטית, לא כרטיס גדול */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'עולה השבוע', value: String(upcomingThisWeekCount) },
          { label: 'מחכה לאישור', value: String(approvalItems.length) },
          { label: 'קמפיין פעיל', value: systemActiveCampaign ?? '—' },
          { label: 'מותג בפוקוס', value: focusBrand?.name ?? '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 px-4 py-3">
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-0.5">{s.label}</div>
            <div className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">{s.value}</div>
          </div>
        ))}
      </div>

      {/* 2. המותגים שלי — גלריה ויזואלית */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">המותגים שלי</h2>
        {brands.length === 0 ? (
          <Card>
            <EmptyLine text="עדיין אין מותגים במערכת. אפשר להוסיף מותג ידנית או לייבא חבילת מותג מקובץ JSON." />
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {brands.map((b) => {
              const imageUrl = brandImageUrl(b)
              const status = fieldStr(b.fields, 'launch_status') ?? fieldStr(b.fields, 'business_status')
              const activeCampaign = brandActiveCampaignLabel(b, brandCampaigns, today)
              return (
                <Link
                  key={b.id}
                  to={`/work/brands/${b.id}`}
                  className="group relative block aspect-[4/3] rounded-3xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#92400E]"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                      style={{ background: 'linear-gradient(160deg, #92400E, #1C1A18)' }}
                    >
                      <span className="text-5xl font-extrabold text-white/85">{b.name.charAt(0)}</span>
                    </div>
                  )}

                  {activeCampaign && (
                    <span className="absolute top-3 right-3 text-[10px] font-medium px-2 py-1 rounded-full bg-white/90 text-emerald-700 backdrop-blur-sm">קמפיין פעיל</span>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <div className="font-bold text-base leading-tight truncate">{b.name}</div>
                    {status && <p className="text-[11px] text-white/75 truncate mt-0.5">{status}</p>}
                    <div className="flex items-center gap-1.5 mt-2 text-[11px] text-white/90">
                      <span className="w-5 h-[3px] rounded-full shrink-0" style={{ background: '#92400E' }} />
                      <span>
                        {productCountOf(b.id)} מוצרים · {contentCountOf(b.id)} תכנים
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. מותג בפוקוס */}
      {focusBrand && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400">מותג בפוקוס</span>
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">{focusBrand.name}</h2>
            </div>
            <Link to={`/work/brands/${focusBrand.id}`} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline shrink-0">
              לעמוד המותג ←
            </Link>
          </div>
          <FocusBrandDetails
            brand={focusBrand}
            campaigns={brandCampaigns.filter((c) => c.brandId === focusBrand.id)}
            products={brandProducts.filter((p) => p.brandId === focusBrand.id)}
            contentItems={brandContentItems.filter((c) => c.brandId === focusBrand.id)}
            contentPieces={contentPieces.filter((c) => c.brandId === focusBrand.id)}
            pendingActivities={brandPendingActivities.filter((a) => a.brandId === focusBrand.id)}
            today={today}
            weekEnd={weekEnd}
          />
        </Card>
      )}

      {/* 4. תוכנית קידום שבועית */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">תוכנית קידום שבועית</h2>
        <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-4">
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((d, i) => {
              const isToday = d === today
              const items = weekBoard[d] ?? []
              return (
                <div key={d} className="min-w-0">
                  <div className={`text-center text-xs font-medium mb-2 pb-2 border-b ${isToday ? 'text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800' : 'text-stone-400 dark:text-stone-500 border-stone-100 dark:border-stone-800'}`}>
                    {WEEKDAY_LABELS[i]}׳ {Number(d.slice(8, 10))}
                  </div>
                  <div className="space-y-1">
                    {items.length === 0 ? (
                      <div className="text-center text-[11px] text-stone-300 dark:text-stone-600">—</div>
                    ) : (
                      items.map((it, idx) => (
                        <div key={idx} className="text-[10px] leading-tight px-1.5 py-1 rounded-lg bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 truncate" title={`${it.label} · ${it.brand}`}>
                          {it.label}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 5. מחכה לאישור */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">מחכה לאישור</h3>
          <Link to="/work/today" className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
            הצג הכל
          </Link>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {approvalItems.length === 0 && <EmptyLine text="אין כרגע כלום שממתין לאישור" />}
          {approvalItems.slice(0, 4).map((item) => (
            <li key={item.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
              <span className="text-stone-800 dark:text-stone-100 truncate">{item.title}</span>
              <span className="text-xs text-stone-400 dark:text-stone-500 shrink-0">
                {item.kind} · {item.brand}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 6. קמפיינים והשקות */}
      <div>
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">קמפיינים והשקות</h2>
        {brandCampaigns.length === 0 ? (
          <Card>
            <EmptyLine text="עדיין אין קמפיינים רשומים" />
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {brandCampaigns.map((c) => {
              const status = campaignStatus(c, today)
              return (
                <div key={c.id} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">{c.name}</span>
                    {status && <StatusPill label={status.label} tone={status.tone} />}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <MegaphoneIcon className="w-3.5 h-3.5" /> {brandName(c.brandId)}
                    </span>
                    {c.startDate && (
                      <span className="inline-flex items-center gap-1">
                        ·
                        <span dir="ltr">
                          {c.startDate}
                          {c.endDate ? ` → ${c.endDate}` : ''}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 7. ביצועים */}
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3">
          <CompassIcon className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">נתוני ביצועים יופיעו כאן לאחר חיבור Instagram</p>
      </div>

      <QuickAddPopover open={addOpen} title="הוספת מותג" fields={ADD_BRAND_FIELDS} onClose={() => setAddOpen(false)} onSave={handleAddBrand} />
    </div>
  )
}

function FocusBrandDetails({
  brand,
  campaigns,
  products,
  contentItems,
  contentPieces,
  pendingActivities,
  today,
  weekEnd,
}: {
  brand: Brand
  campaigns: BrandCampaign[]
  products: { id: string; name: string; fields: Record<string, unknown> }[]
  contentItems: { id: string; date?: string; title: string; published: boolean }[]
  contentPieces: { id: string; publishDate?: string; scheduledDate?: string; dueDate?: string; status: string; contentType: ContentPieceType }[]
  pendingActivities: { id: string; description: string }[]
  today: string
  weekEnd: string
}) {
  const activeCampaign = brandActiveCampaignLabel(brand, campaigns, today)
  const priorityProducts = products.filter((p) => fieldStr(p.fields, 'priority') === 'high')
  const shownProducts = (priorityProducts.length > 0 ? priorityProducts : products).slice(0, 3)

  const plannedThisWeek = contentItems.filter((c) => c.date && c.date >= today && c.date <= weekEnd && !c.published).length + contentPieces.filter((c) => {
    const d = c.publishDate || c.scheduledDate || c.dueDate
    return d && d >= today && d <= weekEnd && c.status !== 'published'
  }).length

  const nextContent = [...contentItems.filter((c) => c.date && c.date >= today && !c.published)].sort((a, b) => a.date!.localeCompare(b.date!))[0]
  const nextAction = nextContent?.title ?? pendingActivities[0]?.description

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
      <div>
        <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">קמפיין פעיל</dt>
        <dd className="text-stone-700 dark:text-stone-200 font-medium">{activeCampaign ?? 'אין קמפיין פעיל כרגע'}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">מוצרים בעדיפות</dt>
        <dd className="text-stone-700 dark:text-stone-200 font-medium">{shownProducts.length > 0 ? shownProducts.map((p) => p.name).join(', ') : '—'}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">מתוכנן השבוע</dt>
        <dd className="text-stone-700 dark:text-stone-200 font-medium">{plannedThisWeek > 0 ? `${plannedThisWeek} פריטים` : '—'}</dd>
      </div>
      <div>
        <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">פעולה הבאה</dt>
        <dd className="text-stone-700 dark:text-stone-200 font-medium truncate">{nextAction ?? '—'}</dd>
      </div>
    </div>
  )
}
