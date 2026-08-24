import { Link } from 'react-router-dom'

export default function BackButton({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
      aria-label={`חזרה ל${label}`}
      title={`חזרה ל${label}`}
    >
      ←
    </Link>
  )
}
