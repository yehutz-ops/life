import { useParams, Navigate, Link } from 'react-router-dom'
import { getWorkArea, WorkAreaId } from '../data/workAreas'

const VALID_IDS: WorkAreaId[] = ['more']

// עמוד placeholder זמני — האזור הוא כרגע רק נקודת כניסה חזותית מ"עבודה", עדיין לא נפתח לעומק.
export default function WorkAreaComingSoonPage() {
  const { areaId } = useParams<{ areaId: string }>()
  if (!areaId || !VALID_IDS.includes(areaId as WorkAreaId)) return <Navigate to="/work" replace />
  const area = getWorkArea(areaId as WorkAreaId)
  const Icon = area.icon

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/work"
          className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
          aria-label="חזרה לעבודה"
          title="חזרה לעבודה"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">{area.name}</h1>
          <p className="text-xs text-stone-400 dark:text-stone-500">{area.description}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-50 dark:bg-stone-800 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-5 h-5 text-stone-400 dark:text-stone-500" />
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">האזור הזה ייפתח בהמשך. כרגע זו רק נקודת כניסה.</p>
      </div>
    </div>
  )
}
