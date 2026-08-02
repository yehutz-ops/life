import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link, Navigate } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine } from '../components/ui'

type GroupKey = 'overview' | 'products' | 'content' | 'campaigns' | 'media' | 'tasks'
const GROUP_KEYS: GroupKey[] = ['overview', 'products', 'content', 'campaigns', 'media', 'tasks']

const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'overview', label: 'סקירה' },
  { key: 'products', label: 'מוצרים' },
  { key: 'content', label: 'תוכן ותוכנית שבועית' },
  { key: 'campaigns', label: 'קמפיינים והשקות' },
  { key: 'media', label: 'מדיה ושיתופי פעולה' },
  { key: 'tasks', label: 'משימות ותפעול' },
]

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

export default function BrandDetailPage() {
  const { brandId } = useParams<{ brandId: string }>()
  const [searchParams] = useSearchParams()
  const { brands, brandProducts, brandCampaigns, brandContentItems, brandPendingActivities, brandMediaAssets, items } = useStore()
  const tabParam = searchParams.get('tab') as GroupKey | null
  const highlightContentId = searchParams.get('item')
  const [group, setGroup] = useState<GroupKey>(tabParam && GROUP_KEYS.includes(tabParam) ? tabParam : 'overview')

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
  const tasks = items.filter((it) => it.brandId === brand.id)
  const awaitingApproval = contentItems.filter((c) => c.awaitingApproval)

  const fields = brand.fields as Record<string, unknown>
  const marketingStrategy = (fields.marketingStrategy ?? {}) as Record<string, unknown>
  const weeklyPlan = (fields.weeklyPlan ?? {}) as Record<string, unknown>
  const instagramComposio = (fields.instagramComposio ?? null) as Record<string, unknown> | null
  const standingRules = (fields.standingRules ?? []) as { id: string; title: string; description?: string }[]

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link to="/work/brands" className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          ← כל המותגים
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">{brand.name}</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGroup(g.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              group === g.key
                ? 'bg-amber-800 text-white border-amber-800'
                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {group === 'overview' && (
        <Card>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">סקירה כללית ואסטרטגיה</h2>
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
      )}

      {group === 'products' && (
        <div className="space-y-4">
          {products.length === 0 && (
            <Card>
              <EmptyLine text="אין עדיין מוצרים למותג הזה" />
            </Card>
          )}
          {products.map((p) => (
            <Card key={p.id}>
              <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-3">{p.name}</h3>
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
    </div>
  )
}
