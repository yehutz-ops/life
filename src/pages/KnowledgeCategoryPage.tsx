import { useMemo, useState } from 'react'
import { useParams, Navigate, Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import { getKnowledgeCategory, KnowledgeCategoryId } from '../data/personalKnowledgeCategories'
import ChecklistPanel from '../components/hub/ChecklistPanel'
import QuickNoteModal from '../components/hub/QuickNoteModal'
import QuickAddPopover from '../components/hub/QuickAddPopover'
import { ItemStatus } from '../data/types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'
const VALID_IDS: KnowledgeCategoryId[] = ['library', 'quotes', 'articles', 'ideas']
const VALID_STATUSES: ItemStatus[] = ['open', 'in_progress', 'done']

export default function KnowledgeCategoryPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const { items, addItem, toggleDone, updateItem, deleteItem } = useStore()
  const confirm = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  if (!categoryId || !VALID_IDS.includes(categoryId as KnowledgeCategoryId)) return <Navigate to="/personal" replace />
  const category = getKnowledgeCategory(categoryId as KnowledgeCategoryId)

  const categoryItems = useMemo(
    () =>
      items
        .filter((it) => it.domain === 'personal' && it.listType === category.listType)
        .sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || b.createdAt.localeCompare(a.createdAt)),
    [items, category.listType],
  )
  const openCount = categoryItems.filter((it) => isActive(it.status)).length
  const editingItem = categoryItems.find((it) => it.id === editingId) ?? null

  async function handleDelete(id: string) {
    const item = items.find((it) => it.id === id)
    const ok = await confirm({
      title: 'למחוק את הפריט?',
      message: `"${item?.title ?? ''}" יימחק לצמיתות. אי אפשר לשחזר את זה.`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) await deleteItem(id)
  }

  function handleQuickAddSave(values: Record<string, string>) {
    const title = values.title?.trim()
    if (!title) return
    const status = VALID_STATUSES.includes(values.status as ItemStatus) ? (values.status as ItemStatus) : 'open'
    const rating = values.rating ? Number(values.rating) : undefined
    addItem({
      title,
      kind: 'task',
      domain: 'personal',
      listType: category.listType,
      destination: category.destination,
      priority: 'low',
      status,
      itemSubtype: values.itemSubtype || undefined,
      source: values.source || undefined,
      topic: values.topic || undefined,
      author: values.author || undefined,
      rating: rating !== undefined && !Number.isNaN(rating) ? rating : undefined,
      stage: values.stage || undefined,
      summary: values.summary || undefined,
      convertTo: values.convertTo || undefined,
      notes: values.notes || undefined,
    })
    setQuickAddOpen(false)
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/personal"
          className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
          aria-label="חזרה לאישי"
          title="חזרה לאישי"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-stone-800 dark:text-stone-100">{category.name}</h1>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            {category.description}
            {openCount > 0 ? ` · ${openCount} פתוחים` : ''}
          </p>
        </div>
      </div>

      <ChecklistPanel
        title={category.name}
        items={categoryItems}
        onToggle={toggleDone}
        onEdit={setEditingId}
        onDelete={handleDelete}
        onAddClick={() => setQuickAddOpen(true)}
        emptyText={category.emptyText}
        addPlaceholder={category.addPlaceholder}
      />

      <QuickNoteModal
        item={editingItem}
        titleLabel={category.titleLabel}
        notesLabel={category.notesLabel}
        notesPlaceholder={category.notesPlaceholder}
        onClose={() => setEditingId(null)}
        onSave={(id, data) => updateItem(id, data)}
        onDelete={handleDelete}
      />

      <QuickAddPopover open={quickAddOpen} title={category.quickAddTitle} fields={category.quickAddFields} onClose={() => setQuickAddOpen(false)} onSave={handleQuickAddSave} />
    </div>
  )
}
