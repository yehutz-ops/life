import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { UsersIcon } from '../components/hub/hubIcons'
import { Card, FilterChip, EmptyLine } from '../components/ui'
import StatusPill from '../components/hub/StatusPill'
import MonthSelector from '../components/hub/MonthSelector'
import InfluencerCard from '../components/influencers/InfluencerCard'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { InfluencerStatus } from '../data/influencerTypes'
import { currentMonth, computeInfluencerMonthMetrics, computeInfluencerAlerts } from '../data/influencerMetrics'

function safeDiv(a: number, b: number): number | undefined {
  return b > 0 ? a / b : undefined
}

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

const ADD_INFLUENCER_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם', type: 'text', required: true, placeholder: 'לדוגמה: עמית כהן' },
  { key: 'instagramHandle', label: 'Instagram', type: 'text', placeholder: 'ללא @' },
  { key: 'tiktokHandle', label: 'TikTok', type: 'text', placeholder: 'ללא @' },
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
  { key: 'photoUrl', label: 'קישור לתמונת פרופיל', type: 'text', secondary: true },
]

type SortKey = 'name' | 'followers' | 'totalCost' | 'content' | 'views' | 'orders' | 'revenue' | 'roas' | 'costPerOrder'

export default function InfluencersPage() {
  const { influencers, influencerProducts, influencerContent, influencerSales, addInfluencer } = useStore()
  const [month, setMonth] = useState(currentMonth())
  const [tab, setTab] = useState<'dashboard' | 'compare'>('dashboard')
  const [addOpen, setAddOpen] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const rows = useMemo(
    () =>
      influencers.map((influencer) => {
        const products = influencerProducts.filter((p) => p.influencerId === influencer.id)
        const content = influencerContent.filter((c) => c.influencerId === influencer.id)
        const sale = influencerSales.find((s) => s.influencerId === influencer.id && s.month === month)
        const metrics = computeInfluencerMonthMetrics(influencer, products, content, sale, month)
        return { influencer, metrics }
      }),
    [influencers, influencerProducts, influencerContent, influencerSales, month],
  )

  const alerts = useMemo(() => computeInfluencerAlerts(influencers, influencerProducts, influencerContent, month), [influencers, influencerProducts, influencerContent, month])

  const kpis = useMemo(() => {
    const activeInfluencers = influencers.filter((i) => i.status === 'active').length
    const cashCost = rows.reduce((sum, r) => sum + r.metrics.cashPayment, 0)
    const totalCost = rows.reduce((sum, r) => sum + r.metrics.totalCost, 0)
    const productCost = rows.reduce((sum, r) => sum + r.metrics.productCost, 0)
    const contentCommitted = rows.filter((r) => r.influencer.status === 'active').reduce((sum, r) => sum + r.metrics.contentRequired.total, 0)
    const contentPublished = rows.reduce((sum, r) => sum + r.metrics.contentCompleted.total, 0)
    const totalViews = rows.reduce((sum, r) => sum + r.metrics.totalViews, 0)
    const totalRevenue = rows.reduce((sum, r) => sum + r.metrics.revenue, 0)
    const avgRoas = safeDiv(totalRevenue, totalCost)
    return { activeInfluencers, cashCost, totalCost, productCost, contentCommitted, contentPublished, totalViews, totalRevenue, avgRoas }
  }, [rows])

  const sortedRows = useMemo(() => {
    const withValue = rows.map((r) => ({
      ...r,
      sortValue: {
        name: r.influencer.name,
        followers: r.influencer.followers ?? 0,
        totalCost: r.metrics.totalCost,
        content: r.metrics.contentCompleted.total,
        views: r.metrics.totalViews,
        orders: r.metrics.orders,
        revenue: r.metrics.revenue,
        roas: r.metrics.roas ?? -1,
        costPerOrder: r.metrics.costPerOrder ?? Number.MAX_SAFE_INTEGER,
      }[sortKey],
    }))
    withValue.sort((a, b) => {
      const av = a.sortValue
      const bv = b.sortValue
      const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return withValue
  }, [rows, sortKey, sortDir])

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  async function handleAddInfluencer(values: Record<string, string>) {
    await addInfluencer({
      name: values.name?.trim(),
      instagramHandle: values.instagramHandle?.trim() || undefined,
      tiktokHandle: values.tiktokHandle?.trim() || undefined,
      status: (values.status as InfluencerStatus) || 'active',
      followers: values.followers ? Number(values.followers) : undefined,
      contentNiche: values.contentNiche?.trim() || undefined,
      photoUrl: values.photoUrl?.trim() || undefined,
    })
    setAddOpen(false)
  }

  const columns: { key: SortKey; label: string }[] = [
    { key: 'name', label: 'משפיען' },
    { key: 'followers', label: 'עוקבים' },
    { key: 'totalCost', label: 'עלות כוללת' },
    { key: 'content', label: 'תכנים' },
    { key: 'views', label: 'צפיות' },
    { key: 'orders', label: 'הזמנות' },
    { key: 'revenue', label: 'הכנסה' },
    { key: 'roas', label: 'ROAS' },
    { key: 'costPerOrder', label: 'עלות להזמנה' },
  ]

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
            <UsersIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">משפיענים</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} onChange={setMonth} />
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            + הוסף משפיען
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'משפיענים פעילים', value: String(kpis.activeInfluencers) },
          { label: 'עלות מזומן חודשית', value: formatILS(kpis.cashCost) },
          { label: 'עלות מוצרים שנשלחו', value: formatILS(kpis.productCost) },
          { label: 'תכנים שהתחייבנו', value: String(kpis.contentCommitted) },
          { label: 'תכנים שפורסמו', value: String(kpis.contentPublished) },
          { label: 'צפיות החודש', value: kpis.totalViews.toLocaleString('he-IL') },
          { label: 'הכנסה משויכת', value: formatILS(kpis.totalRevenue) },
          { label: 'ROAS כולל', value: kpis.avgRoas !== undefined ? kpis.avgRoas.toFixed(1) : '—' },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-3.5">
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">{s.label}</div>
            <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{s.value}</div>
          </div>
        ))}
      </div>

      {alerts.length > 0 && (
        <Card>
          <div className="text-sm font-semibold text-stone-500 dark:text-stone-400 mb-3">התראות</div>
          <ul className="space-y-2">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center gap-2">
                <StatusPill label={a.severity === 'alert' ? 'דחוף' : 'לתשומת לב'} tone={a.severity} />
                <span className="text-sm text-stone-600 dark:text-stone-300">{a.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex items-center gap-2">
        <FilterChip active={tab === 'dashboard'} onClick={() => setTab('dashboard')}>
          דשבורד
        </FilterChip>
        <FilterChip active={tab === 'compare'} onClick={() => setTab('compare')}>
          השוואה
        </FilterChip>
      </div>

      {tab === 'dashboard' &&
        (influencers.length === 0 ? (
          <Card>
            <EmptyLine text="עדיין אין משפיענים במערכת. אפשר להוסיף את הראשון." />
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rows.map(({ influencer, metrics }) => (
              <InfluencerCard
                key={influencer.id}
                influencer={influencer}
                viewsThisMonth={metrics.totalViews}
                revenueThisMonth={metrics.revenue}
                roas={metrics.roas}
                contentCompleted={metrics.contentCompleted.total}
                contentRequired={metrics.contentRequired.total}
              />
            ))}
          </div>
        ))}

      {tab === 'compare' && (
        <Card className="overflow-x-auto">
          {influencers.length === 0 ? (
            <EmptyLine text="אין עדיין נתונים להשוואה." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800">
                  {columns.map((c) => (
                    <th key={c.key} className="text-right py-2 px-2 font-medium cursor-pointer select-none whitespace-nowrap" onClick={() => toggleSort(c.key)}>
                      {c.label}
                      {sortKey === c.key && <span className="mr-1">{sortDir === 'asc' ? '▲' : '▼'}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map(({ influencer, metrics }) => (
                  <tr key={influencer.id} className="border-b border-stone-50 dark:border-stone-800/60 last:border-0">
                    <td className="py-2 px-2">
                      <Link to={`/work/influencers/${influencer.id}`} className="font-medium text-stone-800 dark:text-stone-100 hover:underline">
                        {influencer.name}
                      </Link>
                    </td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{influencer.followers?.toLocaleString('he-IL') ?? '—'}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{formatILS(metrics.totalCost)}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{metrics.contentCompleted.total}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{metrics.totalViews.toLocaleString('he-IL')}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{metrics.orders}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{formatILS(metrics.revenue)}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{metrics.roas !== undefined ? metrics.roas.toFixed(1) : '—'}</td>
                    <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{metrics.costPerOrder !== undefined ? formatILS(metrics.costPerOrder) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      <QuickAddPopover open={addOpen} title="הוספת משפיען" fields={ADD_INFLUENCER_FIELDS} initialValues={{ status: 'active' }} onClose={() => setAddOpen(false)} onSave={handleAddInfluencer} />
    </div>
  )
}
