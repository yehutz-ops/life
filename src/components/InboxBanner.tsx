import { Link } from 'react-router-dom'

export default function InboxBanner({ count }: { count: number }) {
  if (count === 0) {
    return (
      <div className="rounded-2xl border border-stone-200/60 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60 px-4 py-3 text-center text-xs text-stone-400 dark:text-stone-500">
        תיבת הכניסה ריקה
      </div>
    )
  }

  return (
    <Link
      to="/inbox"
      className="flex items-center justify-between gap-3 rounded-2xl bg-[#211E1B] dark:bg-stone-800 px-4 py-3 text-[#F7F5F1] hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1A18]"
    >
      <span className="text-sm">תיבת כניסה — {count} פריטים ממתינים לסידור</span>
      <span className="text-xs font-medium shrink-0">לפתיחה ←</span>
    </Link>
  )
}
