import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { CompassIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine } from '../components/ui'
import BarChart from '../components/finance/BarChart'

const WEEKDAY_LABELS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']

interface UnifiedContent {
  id: string
  title: string
  brandLabel: string
  contentType: string
  views: number
  engagement: number
  publishDate?: string
}

function engagementOf(c: { likes?: number; comments?: number; shares?: number; saves?: number }): number {
  return (c.likes ?? 0) + (c.comments ?? 0) + (c.shares ?? 0) + (c.saves ?? 0)
}

export default function ContentAnalyticsPage() {
  const { contentPieces, influencerContent, influencers, brands } = useStore()

  function brandName(brandId: string) {
    return brands.find((b) => b.id === brandId)?.name ?? '—'
  }
  function influencerName(id: string) {
    return influencers.find((i) => i.id === id)?.name ?? '—'
  }

  const unified: UnifiedContent[] = useMemo(() => {
    const fromBrand = contentPieces
      .filter((c) => c.status === 'published' && c.views !== undefined)
      .map((c) => ({
        id: c.id,
        title: `${brandName(c.brandId)} · ${c.contentType}`,
        brandLabel: brandName(c.brandId),
        contentType: c.contentType,
        views: c.views ?? 0,
        engagement: engagementOf(c),
        publishDate: c.publishDate,
      }))
    const fromInfluencer = influencerContent
      .filter((c) => c.status === 'published' && c.views !== undefined)
      .map((c) => ({
        id: c.id,
        title: `${influencerName(c.influencerId)} · ${c.contentType}`,
        brandLabel: c.brand ?? influencerName(c.influencerId),
        contentType: c.contentType,
        views: c.views ?? 0,
        engagement: engagementOf(c),
        publishDate: c.publishDate,
      }))
    return [...fromBrand, ...fromInfluencer]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentPieces, influencerContent, brands, influencers])

  const best = [...unified].sort((a, b) => b.views - a.views).slice(0, 5)
  const worst = [...unified].sort((a, b) => a.views - b.views).slice(0, 5)

  const byBrand = useMemo(() => {
    const map: Record<string, number> = {}
    unified.forEach((c) => {
      map[c.brandLabel] = (map[c.brandLabel] ?? 0) + c.views
    })
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [unified])

  const byFormat = useMemo(() => {
    const map: Record<string, number> = {}
    unified.forEach((c) => {
      map[c.contentType] = (map[c.contentType] ?? 0) + c.views
    })
    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
  }, [unified])

  const byWeekday = useMemo(() => {
    const sums = Array(7).fill(0)
    unified.forEach((c) => {
      if (!c.publishDate) return
      const day = new Date(c.publishDate + 'T00:00:00').getDay()
      sums[day] += c.views
    })
    return WEEKDAY_LABELS.map((label, i) => ({ label, value: sums[i] }))
  }, [unified])

  const reelViews = unified.filter((c) => c.contentType === 'reel')
  const postViews = unified.filter((c) => c.contentType === 'post')
  const avgReel = reelViews.length ? reelViews.reduce((s, c) => s + c.views, 0) / reelViews.length : 0
  const avgPost = postViews.length ? postViews.reduce((s, c) => s + c.views, 0) / postViews.length : 0

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/work/brands"
          className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
          aria-label="חזרה למותגים"
          title="חזרה למותגים"
        >
          ←
        </Link>
        <div className="flex items-center gap-2">
          <CompassIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">אנליטיקת תוכן</h1>
        </div>
      </div>

      {unified.length === 0 ? (
        <Card>
          <EmptyLine text="עדיין אין תוכן שפורסם עם נתוני ביצועים — ברגע שיתווספו, כאן יופיעו התובנות." />
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-3">התוכן הכי מצליח</h3>
              <ul className="space-y-2">
                {best.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700 dark:text-stone-200 truncate">{c.title}</span>
                    <span className="text-stone-400 dark:text-stone-500 shrink-0">{c.views.toLocaleString('he-IL')}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-3">התוכן הכי חלש</h3>
              <ul className="space-y-2">
                {worst.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span className="text-stone-700 dark:text-stone-200 truncate">{c.title}</span>
                    <span className="text-stone-400 dark:text-stone-500 shrink-0">{c.views.toLocaleString('he-IL')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">המותגים המובילים (צפיות)</h3>
            <BarChart data={byBrand} valueSuffix="" />
          </Card>

          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">הפורמטים המובילים (צפיות)</h3>
              <BarChart data={byFormat} valueSuffix="" />
            </Card>
            <Card>
              <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">ימי פרסום מובילים (צפיות)</h3>
              <BarChart data={byWeekday} valueSuffix="" />
            </Card>
          </div>

          <Card>
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-3">Reels מול Posts — צפיות ממוצעות</h3>
            <div className="flex gap-8 text-sm">
              <div>
                <div className="text-xs text-stone-400 dark:text-stone-500">Reels</div>
                <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{Math.round(avgReel).toLocaleString('he-IL')}</div>
              </div>
              <div>
                <div className="text-xs text-stone-400 dark:text-stone-500">Posts</div>
                <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{Math.round(avgPost).toLocaleString('he-IL')}</div>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
