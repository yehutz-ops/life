import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DomainConfig } from '../data/domains'
import { Item } from '../data/types'

export default function DomainCard({
  domain,
  openCount,
  next,
  className = '',
}: {
  domain: DomainConfig
  openCount: number
  next?: Item
  className?: string
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const navigate = useNavigate()
  const hasImage = !imgFailed

  return (
    <Link
      to={domain.path}
      aria-label={`${domain.name} — ${openCount} פתוחות`}
      onKeyDown={(e) => {
        // Enter מופעל אוטומטית ע"י הדפדפן על קישור; Space נוסף כאן כדי שגם הוא יפעיל את הכרטיס.
        if (e.key === ' ') {
          e.preventDefault()
          navigate(domain.path)
        }
      }}
      className={`group block rounded-3xl overflow-hidden border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none transition-all hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-950 ${className}`}
    >
      <div className="relative h-36 sm:h-44 overflow-hidden">
        {hasImage && (
          <img
            src={domain.imageSrc}
            alt={`תמונה של תחום ${domain.name}`}
            onError={() => setImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        )}
        {!hasImage && (
          <div className={`absolute inset-0 flex items-center justify-center ${domain.classes.bg} transition-transform duration-300 group-hover:scale-105`}>
            <span className="text-5xl" aria-hidden="true">
              {domain.icon}
            </span>
          </div>
        )}
        {hasImage && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />}
        <div className={`absolute inset-x-0 bottom-0 p-4 ${hasImage ? 'text-white' : domain.classes.text}`}>
          <div className="font-bold text-lg">{domain.name}</div>
          <div className={`text-xs mt-0.5 truncate ${hasImage ? 'text-white/80' : 'opacity-80'}`}>{domain.description}</div>
        </div>
      </div>
      <div className="bg-white dark:bg-stone-900 px-4 py-3">
        <div className="text-sm text-stone-600 dark:text-stone-300">{openCount} פתוחות</div>
        <div className="text-xs text-stone-400 dark:text-stone-500 truncate mt-0.5">{next ? next.title : 'אין פריטים פתוחים'}</div>
      </div>
    </Link>
  )
}
