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
  onEdit,
  onDelete,
  className = '',
  variant = 'default',
}: {
  title: string
  items: Item[]
  onToggle: (id: string) => void
  onAdd: (title: string) => void
  emptyText: string
  addPlaceholder: string
  renderMeta?: (item: Item) => ReactNode
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
  // 'notepad' — עיצוב פנקס/מחברת קניות (דף בהיר, שורות אופקיות, רמז ספירלה) עבור מקרים ספציפיים
  // כמו רשימת קניות; 'default' (ברירת מחדל) נשאר הכרטיס הרגיל של שאר השימושים ברכיב.
  variant?: 'default' | 'notepad'
}) {
  const [draft, setDraft] = useState('')

  function submit() {
    const value = draft.trim()
    if (!value) return
    onAdd(value)
    setDraft('')
  }

  const sorted = [...items].sort((a, b) => Number(a.status === 'done') - Number(b.status === 'done'))
  const isNotepad = variant === 'notepad'

  return (
    <div
      className={`relative flex flex-col ${
        isNotepad
          ? 'bg-[#FFFDF7] dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 pt-5 pb-5 pl-5 pr-9'
          : 'bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5'
      } ${className}`}
    >
      {isNotepad && (
        <div className="absolute right-3 top-6 bottom-6 flex flex-col justify-between" aria-hidden="true">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full border border-stone-300 dark:border-stone-600 bg-[#FFFDF7] dark:bg-stone-900" />
          ))}
        </div>
      )}
      <HubSectionHeader title={title} />

      {sorted.length === 0 ? (
        <HubEmptyState text={emptyText} />
      ) : (
        <ul className={`mb-3 flex-1 overflow-y-auto ${isNotepad ? '' : 'space-y-0.5'}`}>
          {sorted.map((it) => {
            const done = it.status === 'done'
            return (
              <li key={it.id} className={`group flex items-center gap-3 ${isNotepad ? 'py-2.5 border-b border-stone-100 dark:border-stone-800 last:border-0' : 'py-1.5'}`}>
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
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(it.id)}
                        title="עריכה"
                        aria-label="עריכה"
                        className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
                      >
                        ✎
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(it.id)}
                        title="מחיקה"
                        aria-label="מחיקה"
                        className="w-6 h-6 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-stone-50 dark:border-stone-800 mt-auto">
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
