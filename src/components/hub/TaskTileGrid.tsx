import { useState } from 'react'
import { Item } from '../../data/types'
import HubSectionHeader from './HubSectionHeader'
import HubEmptyState from './HubEmptyState'
import { PriorityChip } from '../ui'
import { daysUntilLabel } from '../../utils/date'

export default function TaskTileGrid({
  title,
  items,
  onItemClick,
  emptyText,
  onAdd,
  addPlaceholder,
}: {
  title: string
  items: Item[]
  onItemClick: (id: string) => void
  emptyText: string
  onAdd?: (title: string) => void
  addPlaceholder?: string
}) {
  const [draft, setDraft] = useState('')

  function submit() {
    const value = draft.trim()
    if (!value || !onAdd) return
    onAdd(value)
    setDraft('')
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
      <HubSectionHeader title={title} />

      {items.length === 0 ? (
        <HubEmptyState text={emptyText} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {items.map((it) => {
            const done = it.status === 'done'
            return (
              <button
                key={it.id}
                onClick={() => onItemClick(it.id)}
                className="text-right rounded-2xl border border-stone-200 dark:border-stone-800 p-4 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-stone-900"
              >
                <div className={`text-sm font-medium ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{it.title}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <PriorityChip priority={it.priority} />
                  {it.date && <span className="text-xs text-stone-400 dark:text-stone-500">{daysUntilLabel(it.date)}</span>}
                  {done && <span className="text-xs text-emerald-700 dark:text-emerald-400">הושלם</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {onAdd && (
        <div className="flex items-center gap-2 pt-3 border-t border-stone-50 dark:border-stone-800">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submit()
              }
            }}
            placeholder={addPlaceholder}
            className="flex-1 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 px-3 py-2 text-sm placeholder:text-stone-400"
          />
          <button
            onClick={submit}
            aria-label="הוספה"
            className="w-9 h-9 shrink-0 rounded-xl bg-amber-800 hover:bg-amber-900 text-white flex items-center justify-center text-lg"
          >
            +
          </button>
        </div>
      )}
    </div>
  )
}
