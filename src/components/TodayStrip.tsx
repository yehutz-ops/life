import { Link } from 'react-router-dom'

export interface TodayEntry {
  id: string
  title: string
  meta: string
  accentHex: string
  to?: string
}

export default function TodayStrip({ entries }: { entries: TodayEntry[] }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400">היום שלי</h2>
        <Link
          to="/calendar"
          className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
        >
          ליומן המלא
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl px-4 py-6 text-center text-sm text-stone-400 dark:text-stone-500">
          אין כלום שדורש תשומת לב היום
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {entries.map((e) => {
            const card = (
              <div className="bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 rounded-2xl px-3.5 py-3 h-full">
                <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ background: e.accentHex }} />
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{e.title}</div>
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{e.meta}</div>
              </div>
            )
            return e.to ? (
              <Link
                key={e.id}
                to={e.to}
                className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1A18]"
              >
                {card}
              </Link>
            ) : (
              <div key={e.id}>{card}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}
