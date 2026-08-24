import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { useStore } from '../data/StoreContext'
import { CalendarIcon } from '../components/hub/hubIcons'
import { EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import { todayISO } from '../utils/date'

const weekdays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type SourceFilter = 'all' | 'brand' | 'influencer'

interface CalendarEntry {
  id: string
  date: string
  title: string
  platform?: string
  contentType: string
  status: string
  tone: PillTone
  source: SourceFilter
  brandId?: string
  href?: string
}

export default function ContentCalendarPage() {
  const { contentPieces, influencerContent, influencers, brands } = useStore()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(todayISO())
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')

  function brandName(brandId: string) {
    return brands.find((b) => b.id === brandId)?.name ?? '—'
  }
  function influencerName(id: string) {
    return influencers.find((i) => i.id === id)?.name ?? '—'
  }

  const entries: CalendarEntry[] = useMemo(() => {
    const brandEntries: CalendarEntry[] = contentPieces
      .filter((c) => c.publishDate || c.scheduledDate || c.dueDate)
      .map((c) => ({
        id: c.id,
        date: (c.publishDate || c.scheduledDate || c.dueDate) as string,
        title: `${brandName(c.brandId)} · ${c.contentType}`,
        platform: c.platform,
        contentType: c.contentType,
        status: c.status,
        tone: c.status === 'published' ? 'calm' : c.status === 'needs_filming' || c.status === 'needs_editing' ? 'alert' : 'warm',
        source: 'brand',
        brandId: c.brandId,
      }))
    const influencerEntries: CalendarEntry[] = influencerContent
      .filter((c) => c.publishDate || c.dueDate)
      .map((c) => ({
        id: c.id,
        date: (c.publishDate || c.dueDate) as string,
        title: `${influencerName(c.influencerId)} · ${c.contentType}`,
        platform: c.platform,
        contentType: c.contentType,
        status: c.status,
        tone: c.status === 'published' ? 'calm' : c.status === 'late' || c.status === 'cancelled' ? 'alert' : 'warm',
        source: 'influencer',
        href: `/work/influencers/${c.influencerId}`,
      }))
    return [...brandEntries, ...influencerEntries]
      .filter((e) => sourceFilter === 'all' || e.source === sourceFilter)
      .filter((e) => brandFilter === 'all' || e.brandId === brandFilter)
      .filter((e) => platformFilter === 'all' || e.platform === platformFilter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentPieces, influencerContent, sourceFilter, brandFilter, platformFilter, brands, influencers])

  const entriesByDate = useMemo(() => {
    const map: Record<string, CalendarEntry[]> = {}
    entries.forEach((e) => {
      map[e.date] = map[e.date] || []
      map[e.date].push(e)
    })
    return map
  }, [entries])

  const platforms = useMemo(() => Array.from(new Set(entries.map((e) => e.platform).filter(Boolean))) as string[], [entries])

  const cells = useMemo(() => {
    const startOffset = cursor.getDay()
    const gridStart = new Date(cursor)
    gridStart.setDate(gridStart.getDate() - startOffset)
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  function changeMonth(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  const selectedEntries = entriesByDate[selectedDate] || []

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackButton to="/work/brands" label="מותגים" />
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">לוח תוכן</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={sourceFilter === 'all'} onClick={() => setSourceFilter('all')}>
          הכול
        </FilterChip>
        <FilterChip active={sourceFilter === 'brand'} onClick={() => setSourceFilter('brand')}>
          תוכן מותגים
        </FilterChip>
        <FilterChip active={sourceFilter === 'influencer'} onClick={() => setSourceFilter('influencer')}>
          תוכן משפיענים
        </FilterChip>
      </div>

      <div className="flex flex-wrap gap-2 items-center text-sm">
        <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-1.5 text-xs">
          <option value="all">כל המותגים</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        {platforms.length > 0 && (
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl px-3 py-1.5 text-xs">
            <option value="all">כל הפלטפורמות</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => changeMonth(-1)} className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs">
            →
          </button>
          <span className="font-medium text-stone-600 dark:text-stone-300 text-sm">
            {monthNames[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <button onClick={() => changeMonth(1)} className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs">
            ←
          </button>
        </div>

        <div className="grid grid-cols-7 text-center text-[11px] text-stone-400 dark:text-stone-500 mb-1">
          {weekdays.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 mb-4">
          {cells.map((d) => {
            const iso = toISO(d)
            const inMonth = d.getMonth() === cursor.getMonth()
            const dayEntries = entriesByDate[iso] || []
            const isSelected = iso === selectedDate
            const isToday = iso === todayISO()
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`aspect-square rounded-lg p-1 text-right flex flex-col items-start gap-0.5 border transition-colors ${
                  isSelected ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/50' : 'border-transparent hover:bg-stone-50 dark:hover:bg-stone-800'
                } ${!inMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-[10px] ${isToday ? 'w-4 h-4 flex items-center justify-center rounded-full bg-amber-800 text-white' : 'text-stone-600 dark:text-stone-300'}`}>
                  {d.getDate()}
                </span>
                <div className="flex flex-wrap gap-0.5">
                  {dayEntries.slice(0, 3).map((_, i) => (
                    <span key={i} className="w-1 h-1 rounded-full bg-amber-800" />
                  ))}
                </div>
              </button>
            )
          })}
        </div>

        {selectedEntries.length === 0 ? (
          <EmptyLine text={`אין כלום ב-${selectedDate}`} />
        ) : (
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {selectedEntries.map((e) => {
              const content = (
                <>
                  <span className="text-sm text-stone-800 dark:text-stone-100">{e.title}</span>
                  <div className="flex items-center gap-2">
                    {e.platform && <span className="text-xs text-stone-400 dark:text-stone-500">{e.platform}</span>}
                    <StatusPill label={e.status} tone={e.tone} />
                  </div>
                </>
              )
              return (
                <li key={e.id} className="flex items-center justify-between py-2">
                  {e.href ? (
                    <Link to={e.href} className="contents hover:underline">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
