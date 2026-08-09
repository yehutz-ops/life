import { useEffect, useState } from 'react'
import { Item } from '../../data/types'

// עריכה מצומצמת לפריטי "ידע ותרבות" — רק כותרת והערה, בלי תאריך/שעה/עדיפות/פרויקט
// שלא רלוונטיים לציטוט, מאמר או רעיון. עורך את אותה רשומת Item הקיימת (updateItem), לא יוצר עותק.
export default function QuickNoteModal({
  item,
  titleLabel,
  notesLabel,
  notesPlaceholder,
  onClose,
  onSave,
  onDelete,
}: {
  item: Item | null
  titleLabel: string
  notesLabel: string
  notesPlaceholder: string
  onClose: () => void
  onSave: (id: string, data: { title: string; notes?: string }) => void
  onDelete: (id: string) => void
}) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setNotes(item.notes ?? '')
    }
  }, [item])

  if (!item) return null

  function handleSave() {
    const value = title.trim()
    if (!value || !item) return
    onSave(item.id, { title: value, notes: notes.trim() || undefined })
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">{titleLabel}</label>
        <textarea
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          rows={3}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-3 text-sm mb-4 resize-none"
        />

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">{notesLabel}</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={notesPlaceholder}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-3 text-sm mb-5 placeholder:text-stone-400"
        />

        <div className="flex gap-3">
          <button
            onClick={() => {
              onDelete(item.id)
              onClose()
            }}
            className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-500 dark:text-stone-400"
          >
            מחק
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
            ביטול
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}
