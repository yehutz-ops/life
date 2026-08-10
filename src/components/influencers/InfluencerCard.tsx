import { Link } from 'react-router-dom'
import { Influencer, InfluencerStatus } from '../../data/influencerTypes'
import { ProgressBar } from '../ui'
import StatusPill, { PillTone } from '../hub/StatusPill'
import { PersonIcon } from '../hub/hubIcons'

const STATUS_LABEL: Record<InfluencerStatus, string> = { active: 'פעיל', paused: 'בהפסקה', finished: 'הסתיים' }
const STATUS_TONE: Record<InfluencerStatus, PillTone> = { active: 'calm', paused: 'warm', finished: 'neutral' }

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`
  return String(n)
}

function formatILS(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

export default function InfluencerCard({
  influencer,
  viewsThisMonth,
  revenueThisMonth,
  roas,
  contentCompleted,
  contentRequired,
}: {
  influencer: Influencer
  viewsThisMonth: number
  revenueThisMonth: number
  roas?: number
  contentCompleted: number
  contentRequired: number
}) {
  const progressPct = contentRequired > 0 ? Math.min(100, Math.round((contentCompleted / contentRequired) * 100)) : 0

  return (
    <Link
      to={`/work/influencers/${influencer.id}`}
      className="group block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-5 hover:shadow-md transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#92400E]"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-stone-100 dark:bg-stone-800 flex items-center justify-center shrink-0">
            {influencer.photoUrl ? (
              <img src={influencer.photoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <PersonIcon className="w-5 h-5 text-stone-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm text-stone-800 dark:text-stone-100 truncate">{influencer.name}</div>
            <div className="text-xs text-stone-400 dark:text-stone-500 truncate">
              {[influencer.instagramHandle && `@${influencer.instagramHandle}`, influencer.tiktokHandle && `@${influencer.tiktokHandle}`].filter(Boolean).join(' · ') || '—'}
            </div>
            {(influencer.followers !== undefined || influencer.agreement?.monthlyPayment !== undefined) && (
              <div className="text-xs text-stone-400 dark:text-stone-500 truncate">
                {[
                  influencer.followers !== undefined ? `${formatCompact(influencer.followers)} עוקבים` : undefined,
                  influencer.agreement?.monthlyPayment !== undefined ? `${formatILS(influencer.agreement.monthlyPayment)}/חודש` : undefined,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </div>
            )}
          </div>
        </div>
        <StatusPill label={STATUS_LABEL[influencer.status]} tone={STATUS_TONE[influencer.status]} className="shrink-0" />
      </div>

      {contentRequired > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 mb-1">
            <span>
              {contentCompleted}/{contentRequired} תכנים פורסמו
            </span>
          </div>
          <ProgressBar value={progressPct} colorClass="bg-amber-800" />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
        <div>
          <div className="text-[11px] text-stone-400 dark:text-stone-500">Views</div>
          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">{formatCompact(viewsThisMonth)}</div>
        </div>
        <div>
          <div className="text-[11px] text-stone-400 dark:text-stone-500">Revenue</div>
          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">{formatILS(revenueThisMonth)}</div>
        </div>
        <div>
          <div className="text-[11px] text-stone-400 dark:text-stone-500">ROAS</div>
          <div className="text-sm font-semibold text-stone-800 dark:text-stone-100">{roas !== undefined ? roas.toFixed(1) : '—'}</div>
        </div>
      </div>
    </Link>
  )
}
