import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export default function DomainHubLayout({
  name,
  icon,
  searchSlot,
  children,
}: {
  name: string
  icon: (props: { className?: string }) => JSX.Element
  searchSlot?: ReactNode
  children: ReactNode
}) {
  const Icon = icon
  return (
    <div className="space-y-8 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
            aria-label="חזרה לדף הבית"
            title="חזרה לדף הבית"
          >
            ←
          </Link>
          <div className="flex items-center gap-2">
            <Icon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">{name}</h1>
          </div>
        </div>
        {searchSlot}
      </div>
      {children}
    </div>
  )
}
