import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { BulbIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useConfirm } from '../data/ConfirmContext'
import { IdeaStatus, IdeaBankItem } from '../data/contentStudioTypes'

const STATUS_LABEL: Record<IdeaStatus, string> = {
  idea: 'רעיון',
  use_soon: 'להשתמש בקרוב',
  planned: 'מתוכנן',
  produced: 'הופק',
  published: 'פורסם',
  archive: 'ארכיון',
}
const STATUS_TONE: Record<IdeaStatus, PillTone> = {
  idea: 'neutral',
  use_soon: 'warm',
  planned: 'warm',
  produced: 'calm',
  published: 'calm',
  archive: 'neutral',
}
const PRIORITY_LABEL: Record<string, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' }

export default function IdeaBankPage() {
  const { ideaBankItems, brands, brandProducts, addIdeaBankItem, updateIdeaBankItem, deleteIdeaBankItem } = useStore()
  const confirm = useConfirm()
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
  const [modal, setModal] = useState<{ open: boolean; editingId?: string }>({ open: false })

  const IDEA_FIELDS: QuickAddField[] = useMemo(
    () => [
      { key: 'title', label: 'כותרת', type: 'text', required: true },
      { key: 'brandId', label: 'מותג', type: 'select', options: brands.map((b) => ({ value: b.id, label: b.name })) },
      {
        key: 'status',
        label: 'סטטוס',
        type: 'select',
        options: (Object.keys(STATUS_LABEL) as IdeaStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
      },
      { key: 'description', label: 'תיאור', type: 'textarea', secondary: true },
      { key: 'productId', label: 'מוצר', type: 'select', secondary: true, options: brandProducts.map((p) => ({ value: p.id, label: p.name })) },
      { key: 'platform', label: 'פלטפורמה', type: 'text', secondary: true },
      { key: 'format', label: 'פורמט', type: 'text', secondary: true },
      { key: 'referenceUrl', label: 'קישור לרפרנס', type: 'text', secondary: true },
      {
        key: 'priority',
        label: 'עדיפות',
        type: 'select',
        secondary: true,
        options: [
          { value: 'high', label: 'גבוהה' },
          { value: 'medium', label: 'בינונית' },
          { value: 'low', label: 'נמוכה' },
        ],
      },
    ],
    [brands, brandProducts],
  )

  const filtered = useMemo(
    () => [...ideaBankItems].filter((i) => statusFilter === 'all' || i.status === statusFilter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [ideaBankItems, statusFilter],
  )

  function brandName(brandId?: string) {
    return brandId ? brands.find((b) => b.id === brandId)?.name : undefined
  }

  function initialValues(idea?: IdeaBankItem): Record<string, string> {
    if (!idea) return { status: 'idea' }
    return {
      title: idea.title,
      brandId: idea.brandId ?? '',
      status: idea.status,
      description: idea.description ?? '',
      productId: idea.productId ?? '',
      platform: idea.platform ?? '',
      format: idea.format ?? '',
      referenceUrl: idea.referenceUrl ?? '',
      priority: idea.priority ?? '',
    }
  }

  async function handleSave(values: Record<string, string>) {
    const data = {
      title: values.title?.trim(),
      brandId: values.brandId || undefined,
      status: (values.status as IdeaStatus) || 'idea',
      description: values.description?.trim() || undefined,
      productId: values.productId || undefined,
      platform: values.platform?.trim() || undefined,
      format: values.format?.trim() || undefined,
      referenceUrl: values.referenceUrl?.trim() || undefined,
      priority: (values.priority as 'high' | 'medium' | 'low') || undefined,
    }
    if (modal.editingId) await updateIdeaBankItem(modal.editingId, data)
    else await addIdeaBankItem(data)
    setModal({ open: false })
  }

  async function handleDelete() {
    if (!modal.editingId) return
    const ok = await confirm({ title: 'מחיקת רעיון', message: 'למחוק את הרעיון הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteIdeaBankItem(modal.editingId)
    setModal({ open: false })
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/work/brands"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
            aria-label="חזרה למותגים"
            title="חזרה למותגים"
          >
            ←
          </Link>
          <div className="flex items-center gap-2">
            <BulbIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">מאגר רעיונות</h1>
          </div>
        </div>
        <button onClick={() => setModal({ open: true })} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          + הוסף רעיון
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>
          הכול
        </FilterChip>
        {(Object.keys(STATUS_LABEL) as IdeaStatus[]).map((s) => (
          <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
            {STATUS_LABEL[s]}
          </FilterChip>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {filtered.length === 0 && <EmptyLine text="אין עדיין רעיונות בקטגוריה הזו" />}
          {filtered.map((idea) => (
            <li key={idea.id} className="py-3 cursor-pointer" onClick={() => setModal({ open: true, editingId: idea.id })}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{idea.title}</span>
                <StatusPill label={STATUS_LABEL[idea.status]} tone={STATUS_TONE[idea.status]} />
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                {brandName(idea.brandId) && <span>{brandName(idea.brandId)}</span>}
                {idea.platform && <span>· {idea.platform}</span>}
                {idea.format && <span>· {idea.format}</span>}
                {idea.priority && <span>· עדיפות {PRIORITY_LABEL[idea.priority]}</span>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <QuickAddPopover
        open={modal.open}
        title={modal.editingId ? 'עריכת רעיון' : 'הוספת רעיון'}
        fields={IDEA_FIELDS}
        initialValues={initialValues(ideaBankItems.find((i) => i.id === modal.editingId))}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        onDelete={modal.editingId ? handleDelete : undefined}
      />
    </div>
  )
}
