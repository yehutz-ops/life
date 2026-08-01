import { useEffect, useState } from 'react'
import { useDetailModal } from '../data/DetailModalContext'
import { useStore } from '../data/StoreContext'
import { domainList } from '../data/domains'
import { DomainId, ItemKind, Priority } from '../data/types'
import { kindLabel } from './ui'

export default function ItemDetailModal() {
  const { openItemId, close } = useDetailModal()
  const { items, updateItem } = useStore()
  const item = items.find((it) => it.id === openItemId)

  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState<DomainId | ''>('')
  const [kind, setKind] = useState<ItemKind>('task')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState<Priority | ''>('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (item) {
      setTitle(item.title)
      setDomain(item.domain ?? '')
      setKind(item.kind)
      setDate(item.date ?? '')
      setTime(item.time ?? '')
      setPriority(item.priority ?? '')
      setNotes(item.notes ?? '')
    }
  }, [item?.id])

  if (!item) return null

  function handleSave() {
    if (!item) return
    updateItem(item.id, {
      title: title.trim() || item!.title,
      domain: domain || undefined,
      kind,
      date: date || undefined,
      time: time || undefined,
      priority: priority || undefined,
      notes: notes || undefined,
    })
    close()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">פרטי הפריט</h3>

        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">כותרת</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">תחום</label>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value as DomainId | '')}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm"
            >
              <option value="">📥 תיבת כניסה (לא משויך)</option>
              {domainList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">סוג</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as ItemKind)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm"
            >
              {(Object.keys(kindLabel) as ItemKind[]).map((k) => (
                <option key={k} value={k}>
                  {kindLabel[k]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">תאריך</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">שעה (אופציונלי)</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm"
            />
          </div>
        </div>

        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">עדיפות</label>
        <div className="flex gap-2 mb-3">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                priority === p
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {p === 'high' ? 'גבוהה' : p === 'medium' ? 'בינונית' : 'נמוכה'}
            </button>
          ))}
        </div>

        <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">הערות</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-2 text-sm mb-5 h-16 resize-none"
        />

        <div className="flex gap-3">
          <button
            onClick={close}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300"
          >
            ביטול
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}
