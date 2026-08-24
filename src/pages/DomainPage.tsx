import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { useStore } from '../data/StoreContext'
import { getDomain } from '../data/domains'
import { Card, ProgressBar, EmptyLine } from '../components/ui'
import ItemRow from '../components/ItemRow'
import { DomainId } from '../data/types'

export default function DomainPage({ domainId }: { domainId: DomainId }) {
  const { items, projects, brands } = useStore()
  const domain = getDomain(domainId)

  const domainItems = useMemo(
    () => items.filter((it) => it.domain === domainId).sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999')),
    [items, domainId],
  )
  const domainProjects = projects.filter((p) => p.domain === domainId)
  const nonEvent = domainItems.filter((it) => it.kind !== 'event')
  const openCount = nonEvent.filter((it) => it.status !== 'done' && it.status !== 'cancelled').length
  const doneCount = nonEvent.filter((it) => it.status === 'done').length
  const progress = nonEvent.length ? Math.round((doneCount / nonEvent.length) * 100) : 0

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <BackButton to="/" label="דף הבית" />
      </div>
      <div className={`rounded-2xl p-6 ${domain.classes.bg}`}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{domain.icon}</span>
          <h1 className={`text-2xl font-extrabold ${domain.classes.text}`}>{domain.name}</h1>
        </div>
        <div className="flex items-center gap-6 mt-4 text-sm text-stone-700 dark:text-stone-200 flex-wrap">
          <span>{openCount} פתוחות</span>
          <span>{domainProjects.length} פרויקטים</span>
          <div className="flex items-center gap-2">
            <span>התקדמות כללית</span>
            <div className="w-24">
              <ProgressBar value={progress} colorClass={domain.classes.bar} />
            </div>
            <span>{progress}%</span>
          </div>
        </div>
      </div>

      {domainId === 'work' && (
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">מותגים</h2>
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-0.5">{brands.length} מותגים · שיתופי פעולה, תוכן וקמפיינים</p>
            </div>
            <Link to="/work/brands" className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
              לכל המותגים
            </Link>
          </div>
        </Card>
      )}

      {domainProjects.length > 0 && (
        <Card>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">פרויקטים בתחום זה</h2>
          <ul className="space-y-4">
            {domainProjects.map((p) => (
              <li key={p.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{p.name}</span>
                  {p.isStuck && <span className="text-xs font-medium text-stone-500 dark:text-stone-400">תקוע</span>}
                </div>
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-1 mb-2">{p.nextStep}</div>
                <ProgressBar value={p.progress} colorClass={domain.classes.bar} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-0">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">פריטים בתחום זה</h2>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {domainItems.map((it) => (
            <ItemRow key={it.id} item={it} showDomain={false} />
          ))}
          {domainItems.length === 0 && <EmptyLine text="עדיין אין פריטים בתחום הזה" />}
        </ul>
      </Card>

      <Card className={`border-0 ${domain.classes.bg}`}>
        <div className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-1">בקרוב בתחום הזה</div>
        <p className="text-sm text-stone-500 dark:text-stone-400">{domain.comingSoon}</p>
      </Card>
    </div>
  )
}
