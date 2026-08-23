import { useEffect, useState } from 'react'
import { useProjectForm } from '../data/ProjectFormContext'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import { domainList } from '../data/domains'
import { DomainId, ProjectStatus } from '../data/types'

const emptyForm = () => ({
  name: '',
  domain: 'work' as DomainId,
  description: '',
  status: 'in_progress' as ProjectStatus,
  progress: 0,
  nextStep: '',
  dueDate: '',
  isStuck: false,
  stuckReason: '',
  notes: '',
})

export default function ProjectFormModal() {
  const { target, close } = useProjectForm()
  const { projects, addProject, updateProject, deleteProject } = useStore()
  const confirm = useConfirm()
  const [form, setForm] = useState(emptyForm())

  const editingProject = target?.mode === 'edit' ? projects.find((p) => p.id === target.id) : undefined

  useEffect(() => {
    if (!target) return
    if (target.mode === 'edit' && editingProject) {
      setForm({
        name: editingProject.name,
        domain: editingProject.domain,
        description: editingProject.description ?? '',
        status: editingProject.status,
        progress: editingProject.progress,
        nextStep: editingProject.nextStep,
        dueDate: editingProject.dueDate ?? '',
        isStuck: editingProject.isStuck,
        stuckReason: editingProject.stuckReason ?? '',
        notes: editingProject.notes ?? '',
      })
    } else {
      setForm(emptyForm())
    }
  }, [target?.mode, target?.mode === 'edit' ? target.id : null])

  if (!target) return null

  function set<K extends keyof ReturnType<typeof emptyForm>>(key: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    if (!form.name.trim()) return
    const data = {
      name: form.name.trim(),
      domain: form.domain,
      description: form.description || undefined,
      status: form.status,
      progress: Math.max(0, Math.min(100, form.progress)),
      nextStep: form.nextStep,
      dueDate: form.dueDate || undefined,
      isStuck: form.isStuck,
      stuckReason: form.isStuck ? form.stuckReason || undefined : undefined,
      notes: form.notes || undefined,
    }
    if (target?.mode === 'edit') await updateProject(target.id, data)
    else await addProject(data)
    close()
  }

  async function handleDelete() {
    if (target?.mode !== 'edit') return
    const ok = await confirm({
      title: 'למחוק את הפרויקט?',
      message: `"${editingProject?.name}" יימחק לצמיתות. פריטים ששייכים אליו יישארו, אבל בלי שיוך לפרויקט.`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) {
      await deleteProject(target.id)
      close()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4 text-stone-900 dark:text-stone-100">{target.mode === 'edit' ? 'עריכת פרויקט' : 'פרויקט חדש'}</h3>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">שם הפרויקט</label>
        <input
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        />

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תחום חיים</label>
        <select
          value={form.domain}
          onChange={(e) => set('domain', e.target.value as DomainId)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        >
          {domainList.map((d) => (
            <option key={d.id} value={d.id}>
              {d.icon} {d.name}
            </option>
          ))}
        </select>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תיאור (אופציונלי)</label>
        <input
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        />

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">הצעד הבא</label>
        <input
          value={form.nextStep}
          onChange={(e) => set('nextStep', e.target.value)}
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">מצב</label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as ProjectStatus)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            >
              <option value="in_progress">בתהליך</option>
              <option value="done">הושלם</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תאריך יעד (אופציונלי)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
        </div>

        <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">אחוז התקדמות: {form.progress}%</label>
        <input
          type="range"
          min={0}
          max={100}
          value={form.progress}
          onChange={(e) => set('progress', Number(e.target.value))}
          className="w-full mb-3 accent-amber-800"
        />

        <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200 mb-3">
          <input type="checkbox" checked={form.isStuck} onChange={(e) => set('isStuck', e.target.checked)} className="accent-amber-800" />
          הפרויקט תקוע
        </label>

        {form.isStuck && (
          <div className="mb-3">
            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">למה הוא תקוע?</label>
            <input
              value={form.stuckReason}
              onChange={(e) => set('stuckReason', e.target.value)}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
            />
          </div>
        )}

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
            {target.mode === 'edit' ? 'שמור' : 'צור פרויקט'}
          </button>
        </div>
      </div>
    </div>
  )
}
