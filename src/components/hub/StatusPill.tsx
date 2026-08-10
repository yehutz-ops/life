export type PillTone = 'calm' | 'warm' | 'alert' | 'neutral'

// מכליל את מערכת הגוונים שכבר קיימת ב-FinancePage (calm/warm/alert לתובנות) לרכיב תגית-סטטוס
// גנרי — משמש למצבי משפיענים/תוכן/מוצרים/קמפיינים בכל המערכת.
const TONE_CLASSES: Record<PillTone, string> = {
  calm: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
  warm: 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  alert: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  neutral: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

export default function StatusPill({ label, tone, className = '' }: { label: string; tone: PillTone; className?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${TONE_CLASSES[tone]} ${className}`}>{label}</span>
}
