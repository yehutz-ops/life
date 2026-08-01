import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { domainList, getDomain } from '../data/domains'
import { Card, DomainBadge, ProgressBar, FilterChip } from '../components/ui'
import ItemRow from '../components/ItemRow'
import { DomainId, ProjectStatus } from '../data/types'
import { useProjectForm } from '../data/ProjectFormContext'

const statusLabel: Record<ProjectStatus, string> = { in_progress: 'בתהליך', done: 'הושלם' }
const statusClass: Record<ProjectStatus, string> = {
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
}

export default function ProjectsPage() {
  const { projects, items } = useStore()
  const { openEdit, openCreate } = useProjectForm()
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = useMemo(() => projects.filter((p) => domainFilter === 'all' || p.domain === domainFilter), [projects, domainFilter])

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">פרויקטים</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">כל הפרויקטים מכל תחומי החיים, במקום אחד</p>
        </div>
        <button onClick={() => openCreate()} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          + פרויקט חדש
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={domainFilter === 'all'} onClick={() => setDomainFilter('all')}>
          הכול
        </FilterChip>
        {domainList.map((d) => (
          <FilterChip key={d.id} active={domainFilter === d.id} onClick={() => setDomainFilter(d.id)}>
            {d.icon} {d.name}
          </FilterChip>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((p) => {
          const d = getDomain(p.domain)
          const projectItems = items.filter((it) => it.projectId === p.id)
          const isOpen = expanded === p.id
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => openEdit(p.id)} className="font-bold text-stone-900 dark:text-stone-100 text-right hover:underline">
                  {p.name}
                </button>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass[p.status]}`}>{statusLabel[p.status]}</span>
              </div>
              <DomainBadge domain={p.domain} />
              {p.isStuck && (
                <p className="text-xs font-medium text-stone-700 dark:text-stone-300 mt-2">🔴 תקוע{p.stuckReason ? ` — ${p.stuckReason}` : ''}</p>
              )}
              <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">
                <span className="text-stone-400 dark:text-stone-500">הצעד הבא: </span>
                {p.nextStep || '—'}
              </p>
              <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{p.dueDate ? `יעד: ${p.dueDate}` : 'תאריך יעד: טרם נקבע'}</p>
              <div className="mt-4">
                <ProgressBar value={p.progress} colorClass={d.classes.bar} />
                <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">{p.progress}% הושלם</div>
              </div>

              <button
                onClick={() => setExpanded(isOpen ? null : p.id)}
                className="text-xs font-medium text-amber-800 dark:text-amber-400 underline mt-3"
              >
                {isOpen ? 'הסתר פריטים' : `הצג פריטים (${projectItems.length})`}
              </button>
              {isOpen && (
                <ul className="divide-y divide-stone-50 dark:divide-stone-800 mt-2">
                  {projectItems.map((it) => (
                    <ItemRow key={it.id} item={it} showDomain={false} />
                  ))}
                  {projectItems.length === 0 && <li className="text-sm text-stone-400 dark:text-stone-500 py-2">אין עדיין פריטים משויכים</li>}
                </ul>
              )}
            </Card>
          )
        })}
        {filtered.length === 0 && <div className="text-sm text-stone-400 dark:text-stone-500 p-8 text-center col-span-2">אין פרויקטים בתחום הזה</div>}
      </div>
    </div>
  )
}
