import { useMemo, useState } from 'react'
import BackButton from '../components/BackButton'
import { useStore } from '../data/StoreContext'
import { CameraIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useConfirm } from '../data/ConfirmContext'
import { VideoDifficulty, VideoScript } from '../data/contentStudioTypes'

const DIFFICULTY_LABEL: Record<VideoDifficulty, string> = { easy: 'קל', medium: 'בינוני', advanced: 'מתקדם' }
const DIFFICULTY_TONE: Record<VideoDifficulty, PillTone> = { easy: 'calm', medium: 'warm', advanced: 'alert' }

export default function VideoScriptsPage() {
  const { videoScripts, brands, brandProducts, addVideoScript, updateVideoScript, deleteVideoScript } = useStore()
  const confirm = useConfirm()
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [modal, setModal] = useState<{ open: boolean; editingId?: string }>({ open: false })

  const SCRIPT_FIELDS: QuickAddField[] = useMemo(
    () => [
      { key: 'brandId', label: 'מותג', type: 'select', required: true, options: brands.map((b) => ({ value: b.id, label: b.name })) },
      { key: 'concept', label: 'Concept — הרעיון של הסרטון', type: 'textarea', required: true },
      { key: 'goal', label: 'מטרה', type: 'text' },
      { key: 'platform', label: 'פלטפורמה', type: 'text' },
      { key: 'productId', label: 'מוצר', type: 'select', secondary: true, options: brandProducts.map((p) => ({ value: p.id, label: p.name })) },
      { key: 'hook', label: 'Hook — 1–3 השניות הראשונות', type: 'textarea', secondary: true },
      { key: 'script', label: 'Script', type: 'textarea', secondary: true },
      { key: 'shotListText', label: 'Shot List (שורה לכל צילום)', type: 'textarea', secondary: true },
      { key: 'peopleNeeded', label: 'People Needed', type: 'text', secondary: true },
      { key: 'propsNeeded', label: 'Props / Products Needed', type: 'text', secondary: true },
      {
        key: 'location',
        label: 'Location',
        type: 'select',
        secondary: true,
        options: [
          { value: 'store', label: 'Store' },
          { value: 'street', label: 'Street' },
          { value: 'home', label: 'Home' },
          { value: 'studio', label: 'Studio' },
          { value: 'other', label: 'Other' },
        ],
      },
      { key: 'editingInstructions', label: 'Editing Instructions', type: 'textarea', secondary: true },
      { key: 'captionIdea', label: 'Caption Idea', type: 'textarea', secondary: true },
      { key: 'cta', label: 'CTA', type: 'text', secondary: true },
      {
        key: 'difficulty',
        label: 'Estimated Difficulty',
        type: 'select',
        secondary: true,
        options: [
          { value: 'easy', label: 'קל' },
          { value: 'medium', label: 'בינוני' },
          { value: 'advanced', label: 'מתקדם' },
        ],
      },
    ],
    [brands, brandProducts],
  )

  const filtered = useMemo(
    () => [...videoScripts].filter((s) => brandFilter === 'all' || s.brandId === brandFilter).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [videoScripts, brandFilter],
  )

  function brandName(brandId: string) {
    return brands.find((b) => b.id === brandId)?.name ?? '—'
  }

  function initialValues(script?: VideoScript): Record<string, string> {
    if (!script) return {}
    return {
      brandId: script.brandId,
      concept: script.concept ?? '',
      goal: script.goal ?? '',
      platform: script.platform ?? '',
      productId: script.productId ?? '',
      hook: script.hook ?? '',
      script: script.script ?? '',
      shotListText: (script.shotList ?? []).map((s) => s.what).join('\n'),
      peopleNeeded: script.peopleNeeded ?? '',
      propsNeeded: script.propsNeeded ?? '',
      location: script.location ?? '',
      editingInstructions: script.editingInstructions ?? '',
      captionIdea: script.captionIdea ?? '',
      cta: script.cta ?? '',
      difficulty: script.difficulty ?? '',
    }
  }

  async function handleSave(values: Record<string, string>) {
    const data = {
      brandId: values.brandId,
      productId: values.productId || undefined,
      goal: values.goal?.trim() || undefined,
      platform: values.platform?.trim() || undefined,
      concept: values.concept?.trim() || undefined,
      hook: values.hook?.trim() || undefined,
      script: values.script?.trim() || undefined,
      shotList: values.shotListText?.trim()
        ? values.shotListText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((what) => ({ what }))
        : undefined,
      peopleNeeded: values.peopleNeeded?.trim() || undefined,
      propsNeeded: values.propsNeeded?.trim() || undefined,
      location: values.location || undefined,
      editingInstructions: values.editingInstructions?.trim() || undefined,
      captionIdea: values.captionIdea?.trim() || undefined,
      cta: values.cta?.trim() || undefined,
      difficulty: (values.difficulty as VideoDifficulty) || undefined,
    }
    if (modal.editingId) await updateVideoScript(modal.editingId, data)
    else await addVideoScript(data)
    setModal({ open: false })
  }

  async function handleDelete() {
    if (!modal.editingId) return
    const ok = await confirm({ title: 'מחיקת תסריט', message: 'למחוק את התסריט הזה?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteVideoScript(modal.editingId)
    setModal({ open: false })
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackButton to="/work/brands" label="מותגים" />
          <div className="flex items-center gap-2">
            <CameraIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">רעיונות ותסריטים לווידאו</h1>
          </div>
        </div>
        <button onClick={() => setModal({ open: true })} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          + תסריט חדש
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip active={brandFilter === 'all'} onClick={() => setBrandFilter('all')}>
          כל המותגים
        </FilterChip>
        {brands.map((b) => (
          <FilterChip key={b.id} active={brandFilter === b.id} onClick={() => setBrandFilter(b.id)}>
            {b.name}
          </FilterChip>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {filtered.length === 0 && <EmptyLine text="עדיין אין תסריטים" />}
          {filtered.map((s) => (
            <li key={s.id} className="py-3 cursor-pointer" onClick={() => setModal({ open: true, editingId: s.id })}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate">{s.concept || '(ללא כותרת)'}</span>
                {s.difficulty && <StatusPill label={DIFFICULTY_LABEL[s.difficulty]} tone={DIFFICULTY_TONE[s.difficulty]} />}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                <span>{brandName(s.brandId)}</span>
                {s.platform && <span>· {s.platform}</span>}
                {s.hook && <span className="truncate">· {s.hook}</span>}
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <QuickAddPopover
        open={modal.open}
        title={modal.editingId ? 'עריכת תסריט' : 'תסריט חדש'}
        fields={SCRIPT_FIELDS}
        initialValues={initialValues(videoScripts.find((s) => s.id === modal.editingId))}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        onDelete={modal.editingId ? handleDelete : undefined}
      />
    </div>
  )
}
