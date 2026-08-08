import { ReactNode, useState } from 'react'
import { Item } from '../../data/types'
import HubSectionHeader from './HubSectionHeader'
import HubEmptyState from './HubEmptyState'

export default function ChecklistPanel({
  title,
  items,
  onToggle,
  onAdd,
  emptyText,
  addPlaceholder,
  renderMeta,
}: {
  title: string
  items: Item[]
  onToggle: (id: string) => void
  onAdd: (title: string) => void
  emptyText: string
  addPlaceholder: string
  renderMeta?: (item: Item) => ReactNode
}) {
  const [draft, setDraft] = useState('')

  function submit() {
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  const sorted = [...items].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))

  return (
    <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5">
      <HubSectionHeader title={title} />

      {sorted.length === 0 ? (
        <HubEmptyState text={emptyText} />
      ) : (
        <ul className="space-y-0.5 mb-3">
          {sorted.map((it) => {
            const done = it.status === 'done'
            return (
              <li key={it.id} className="flex items-center gap-3 py-1.5">
                <input
                  type="checkbox"
                  checked={done}
                  onChange={() => onToggle(it.id)}
                  className="w-4 h-4 rounded border-stone-300 dark:border-stone-600 accent-amber-800 focus:ring-amber-800 shrink-0"
                  aria-label={it.title}
                />
                <div className={`min-w-0 flex-1 ${done ? 'opacity-50' : ''}`}>
                  <div className={`text-sm truncate ${done ? 'line-through text-stone-400 dark:text-stone-600' : 'text-stone-800 dark:text-stone-100'}`}>{it.title}</div>
                  {renderMeta && <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">{renderMeta(it)}</div>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

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
    </div>
  )
}
