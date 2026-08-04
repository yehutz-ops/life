import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export interface HubCategoryCardProps {
  name: string
  description: string
  stat: string
  imageSrc: string
  accentHex: string
  ringClass: string
  to: string
  icon: (props: { className?: string }) => JSX.Element
}

export default function HubCategoryCard({ name, description, stat, imageSrc, accentHex, ringClass, to, icon: Icon }: HubCategoryCardProps) {
  const [imgFailed, setImgFailed] = useState(false)
  const navigate = useNavigate()
  const hasImage = !imgFailed

  return (
    <Link
      to={to}
      aria-label={`${name} — ${description} — ${stat}`}
      onKeyDown={(e) => {
        if (e.key === ' ') {
          e.preventDefault()
          navigate(to)
        }
      }}
      className={`group relative block aspect-square rounded-3xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800 shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1A18] ${ringClass}`}
    >
      {hasImage ? (
        <img
          src={imageSrc}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${accentHex}, #1C1A18)` }}>
          <Icon className="w-8 h-8 text-white/80" />
        </div>
      )}

      {/* גרדיאנט כהה בחלק התחתון בלבד — לא מכסה את מרבית התמונה */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 text-white">
        <div className="flex items-center gap-1.5 mb-0.5">
          <Icon className="w-3.5 h-3.5 text-white/90 shrink-0" />
          <span className="font-semibold text-[13px] sm:text-sm leading-tight truncate">{name}</span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-white/75 truncate">{description}</p>
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="w-5 h-[3px] rounded-full shrink-0" style={{ background: accentHex }} />
          <span className="text-[10px] sm:text-[11px] text-white/90">{stat}</span>
        </div>
      </div>
    </Link>
  )
}
