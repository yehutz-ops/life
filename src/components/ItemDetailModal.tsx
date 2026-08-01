import { useEffect, useState } from 'react'
import { useDetailModal } from '../data/DetailModalContext'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import { domainList } from '../data/domains'
import { DomainId, ItemKind, Priority, ItemStatus, WaitingType, Item } from '../data/types'
import { todayISO } from '../utils/date'

const kindOptions: { value: ItemKind; label: string }[] = [
  { value: 'task', label: '📋 משימה' },
  { value: 'event', label: '📅 אירוע או פגישה' },
  { value: 'reminder', label: '⏰ תזכורת' },
  { value: 'waiting', label: '🕓 ממתין לטיפול' },
]

const statusOptions: { value: ItemStatus; label: string }[] = [
  { value: 'open', label: 'פתוח' },
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'waiting', label: 'ממתין' },
  { value: 'done', label: 'הושלם' },
  { value: 'cancelled', label: 'בוטל' },
]

const waitingTypeOptions: { value: WaitingType; label: string }[] = [
  { value: 'my_followup', label: 'אני צריך לחזור אליהם' },
  { value: 'other_pending', label: 'מחכים לתגובה של מישהו אחר' },
  { value: 'my_approval', label: 'מחכה לאישור/החלטה שלי' },
]

const emptyForm = () => ({
  title: '',
  domain: 'work' as DomainId,
  kind: 'task' as ItemKind,
  projectId: '',
  date: todayISO(),
  startTime: '',
  endTime: '',
  priority: 'medium' as Priority,
  status: 'open' as ItemStatus,
  waitingType: 'my_followup' as WaitingType,
  personName: '',
  notes: '',
})

export default function ItemDetailModal() {
  const { target, close } = useDetailModal()
  const { items, projects, addItem, updateItem, deleteItem, sortInboxEntry } = useStore()
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyForm())

  const editingItem: Item | undefined = target?.mode === 'edit' ? items.find((it) => it.id === target.id) : undefined

  useEffect(() => {
    if (!target) return
    if (target.mode === 'edit' && editingItem) {
      setForm({
        title: editingItem.title,
        domain: editingItem.domain,
        kind: editingItem.kind,
        projectId: editingItem.projectId ?? '',
        date: editingItem.date ?? '',
        startTime: editingItem.startTime ?? '',
        endTime: editingItem.endTime ?? '',
        priority: editingItem.priority,
        status: editingItem.status,
        waitingType: editingItem.waitingType ?? 'my_followup',
        personName: editingItem.personName ?? '',
        notes: editingItem.notes ?? '',
      })
    } else if (target.mode === 'create') {
      setForm({ ...emptyForm(), domain: (target.domain as DomainId) ?? 'work' })
    } else if (target.mode === 'sort') {
      setForm({ ...emptyForm(), title: target.prefillTitle })
    }
  }, [target?.mode, target?.mode === 'edit' ? target.id : null])

  if (!target) return null

  const domainProjects = projects.filter((p) => p.domain === form.domain)

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.title.trim()) return
    const data = {
      title: form.title.trim(),
      domain: form.domain,
      kind: form.kind,
      projectId: form.projectId || undefined,
      date: form.date || undefined,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      priority: form.priority,
      status: form.status,
      waitingType: form.kind === 'waiting' ? form.waitingType : undefined,
      personName: form.personName || undefined,
      notes: form.notes || undefined,
    }

    if (target?.mode === 'edit') {
      await updateItem(target.id, data)
    } else if (target?.mode === 'sort') {
      await sortInboxEntry(target.entryId, data)
    } else {
      await addItem(data)
    }
    close()
  }

  async function handleDelete() {
    if (target?.mode !== 'edit') return
    const ok = await confirm({
      title: 'למחוק את הפריט?',
      message: `"${editingItem?.title}" יימחק לצמיתות. אי אפשר לשחזר את זה.`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) {
      await deleteItem(target.id)
      close()
    }
  }

  const title = target.mode === 'edit' ? 'עריכת פריט' : target.mode === 'sort' ? 'שמור וסדר' : 'פריט חדש'
  const saveLabel = target.mode === 'edit' ? 'שמור' : target.mode === 'sort' ? 'שמור וסדר' : 'צור פריט'

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
      <div
        className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold mb-4 text-stone-900 dark:text-stone-100">{title}</h3>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">כותרת</label>
        <input
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תחום חיים</label>
            <select
              value={form.domain}
              onChange={(e) => set('domain', e.target.value as DomainId)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            >
              {domainList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon} {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">סוג</label>
            <select
              value={form.kind}
              onChange={(e) => set('kind', e.target.value as ItemKind)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            >
              {kindOptions.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {form.kind === 'waiting' && (
          <div className="mb-3">
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">סוג ההמתנה</label>
            <select
              value={form.waitingType}
              onChange={(e) => set('waitingType', e.target.value as WaitingType)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            >
              {waitingTypeOptions.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">פרויקט קשור (אופציונלי)</label>
          <select
            value={form.projectId}
            onChange={(e) => set('projectId', e.target.value)}
            className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
          >
            <option value="">ללא פרויקט</option>
            {domainProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תאריך</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">שעת התחלה</label>
            <input
              type="time"
              value={form.startTime}
              onChange={(e) => set('startTime', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">שעת סיום</label>
            <input
              type="time"
              value={form.endTime}
              onChange={(e) => set('endTime', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
        </div>

        {form.kind === 'waiting' && (
          <div className="mb-3">
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">שם האדם (אופציונלי)</label>
            <input
              value={form.personName}
              onChange={(e) => set('personName', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
        )}

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">עדיפות</label>
        <div className="flex gap-2 mb-3">
          {(['high', 'medium', 'low'] as Priority[]).map((p) => (
            <button
              key={p}
              onClick={() => set('priority', p)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                form.priority === p ? 'bg-amber-800 text-white border-amber-800' : 'border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
              }`}
            >
              {p === 'high' ? 'גבוהה' : p === 'medium' ? 'רגילה' : 'נמוכה'}
            </button>
          ))}
        </div>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">מצב</label>
        <select
          value={form.status}
          onChange={(e) => set('status', e.target.value as ItemStatus)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        >
          {statusOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-5 h-16 resize-none"
        />

        <div className="flex gap-3">
          {target.mode === 'edit' && (
            <button onClick={handleDelete} className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-500 dark:text-stone-400">
              מחק
            </button>
          )}
          <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
            ביטול
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
