import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { domainList } from '../data/domains'
import { Card, FilterChip, kindLabel, EmptyLine } from '../components/ui'
import ItemRow from '../components/ItemRow'
import { DomainId, ItemKind } from '../data/types'
import { useQuickAdd } from '../data/QuickAddContext'

export default function TasksPage() {
  const { items } = useStore()
  const { open: openQuickAdd } = useQuickAdd()
  const [domainFilter, setDomainFilter] = useState<DomainId | 'all'>('all')
  const [kindFilter, setKindFilter] = useState<ItemKind | 'all'>('all')
  const [showDone, setShowDone] = useState(false)

  const filtered = useMemo(() => {
    return items
      .filter((it) => it.domain)
      .filter((it) => domainFilter === 'all' || it.domain === domainFilter)
      .filter((it) => kindFilter === 'all' || it.kind === kindFilter)
      .filter((it) => showDone || it.status === 'open')
      .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))
  }, [items, domainFilter, kindFilter, showDone])

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">משימות</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">כל הפריטים המשויכים, מכל תחומי החיים</p>
        </div>
        <button onClick={openQuickAdd} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          + הוספה מהירה
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

      <div className="flex flex-wrap gap-2 items-center">
        <FilterChip active={kindFilter === 'all'} onClick={() => setKindFilter('all')} tone="dark">
          כל הסוגים
        </FilterChip>
        {(Object.keys(kindLabel) as ItemKind[]).map((k) => (
          <FilterChip key={k} active={kindFilter === k} onClick={() => setKindFilter(k)} tone="dark">
            {kindLabel[k]}
          </FilterChip>
        ))}
        <label className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mr-2">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="accent-amber-800" />
          הצג גם הושלמו
        </label>
      </div>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-4">
          {filtered.map((it) => (
            <ItemRow key={it.id} item={it} />
          ))}
          {filtered.length === 0 && <EmptyLine text="אין פריטים שתואמים את הסינון" />}
        </ul>
      </Card>
    </div>
  )
}
