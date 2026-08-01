import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { domainList, getDomain } from '../data/domains'
import { Card, DomainBadge, ProgressBar, FilterChip } from '../components/ui'
import { DomainId, ProjectStatus } from '../data/types'

const statusLabel: Record<ProjectStatus, string> = { in_progress: 'בתהליך', stuck: 'תקוע', done: 'הושלם' }
const statusClass: Record<ProjectStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  stuck: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

export default function ProjectsPage() {
  const { projects } = useStore()
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all')

  const filtered = useMemo(() => projects.filter((p) => domainFilter === 'all' || p.domain === domainFilter), [projects, domainFilter])

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">פרויקטים</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">כל הפרויקטים מכל תחומי החיים, במקום אחד</p>
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
          return (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 dark:text-gray-100">{p.name}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusClass[p.status]}`}>{statusLabel[p.status]}</span>
              </div>
              <DomainBadge domain={p.domain} />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                <span className="text-gray-400 dark:text-gray-500">הצעד הבא: </span>
                {p.nextStep}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{p.dueDate ? `יעד: ${p.dueDate}` : 'תאריך יעד: טרם נקבע'}</p>
              <div className="mt-4">
                <ProgressBar value={p.progress} colorClass={d.classes.bar} />
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{p.progress}% הושלם</div>
              </div>
            </Card>
          )
        })}
        {filtered.length === 0 && <div className="text-sm text-gray-400 dark:text-gray-500 p-8 text-center col-span-2">אין פרויקטים בתחום הזה</div>}
      </div>
    </div>
  )
}
