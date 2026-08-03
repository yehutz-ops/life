import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DomainConfig } from '../data/domains'

export default function SquareCard({ domain, stat }: { domain: DomainConfig; stat: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const navigate = useNavigate()
  const accent = domain.homeAccent
  const hasImage = !imgFailed

  return (
    <Link
      to={domain.path}
      aria-label={`${domain.name} — ${stat}`}
      onKeyDown={(e) => {
        // Enter מופעל אוטומטית ע"י הדפדפן על קישור; Space נוסף כאן כדי שגם הוא יפעיל את הכרטיס.
        if (e.key === ' ') {
          e.preventDefault()
          navigate(domain.path)
        }
      }}
      className={`group relative block aspect-square rounded-3xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1A18] ${accent?.ring ?? 'focus-visible:ring-stone-400'}`}
    >
      {hasImage ? (
        <img
          src={domain.imageSrc}
          alt={`תמונה של תחום ${domain.name}`}
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ background: `linear-gradient(160deg, ${accent?.hex ?? '#78716c'}, #1C1A18)` }}
        >
          <span className="text-2xl opacity-80" aria-hidden="true">
            {domain.icon}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className={`absolute top-0 inset-x-0 h-1 ${accent?.bar ?? 'bg-stone-400'}`} />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white">
        <div className="font-semibold text-sm sm:text-base leading-tight">{domain.name}</div>
        <div className="text-[11px] sm:text-xs mt-0.5 text-white/85">{stat}</div>
      </div>
    </Link>
  )
}
