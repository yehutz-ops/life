import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DomainConfig } from '../data/domains'
import { DomainId } from '../data/types'
import { BriefcaseIcon, BookIcon, PersonIcon, HomeIcon, WalletIcon } from './hub/hubIcons'

const DOMAIN_ICON: Partial<Record<DomainId, (p: { className?: string }) => JSX.Element>> = {
  work: BriefcaseIcon,
  studies: BookIcon,
  personal: PersonIcon,
  home: HomeIcon,
  finance: WalletIcon,
}

// כרטיס תחום בדף הבית: תמונה בחלק העליון ורצועת מידע לבנה מתחתיה (שם + מספר פתוחות + אייקון).
export default function HomeDomainCard({ domain, stat }: { domain: DomainConfig; stat: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  const navigate = useNavigate()
  const accent = domain.homeAccent
  const Icon = DOMAIN_ICON[domain.id]

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
      className={`group block rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#1C1A18] ${accent?.ring ?? 'focus-visible:ring-stone-400'}`}
    >
      <div className="h-[104px] overflow-hidden bg-stone-100 dark:bg-stone-800">
        {!imgFailed ? (
          <img
            src={domain.imageSrc}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${accent?.hex ?? '#78716c'}, #1C1A18)` }}>
            <span className="text-2xl opacity-80" aria-hidden="true">
              {domain.icon}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
        <div className="min-w-0">
          <div className="text-[15px] font-bold text-stone-800 dark:text-stone-100 truncate">{domain.name}</div>
          <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5 truncate">{stat}</div>
        </div>
        {Icon && <Icon className="w-5 h-5 shrink-0 text-amber-800/70 dark:text-amber-400/80" />}
      </div>
    </Link>
  )
}
