import { useMemo, useState } from 'react'
import BackButton from '../components/BackButton'
import { useStore } from '../data/StoreContext'
import { TargetIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { todayISO } from '../utils/date'
import { ContentPiece, ContentPieceStatus, ContentPieceType } from '../data/contentStudioTypes'
import { useConfirm } from '../data/ConfirmContext'

const STATUS_LABEL: Record<ContentPieceStatus, string> = {
  idea: 'רעיון',
  draft: 'טיוטה',
  ready: 'מוכן',
  needs_filming: 'צריך צילום',
  needs_editing: 'צריך עריכה',
  waiting_approval: 'ממתין לאישור',
  approved: 'אושר',
  scheduled: 'מתוזמן',
  published: 'פורסם',
}
const STATUS_TONE: Record<ContentPieceStatus, PillTone> = {
  idea: 'neutral',
  draft: 'neutral',
  ready: 'warm',
  needs_filming: 'alert',
  needs_editing: 'alert',
  waiting_approval: 'warm',
  approved: 'calm',
  scheduled: 'calm',
  published: 'calm',
}

export default function TodayContentPage() {
  const { contentPieces, brands, brandProducts, campaigns, addContentPiece, updateContentPiece, deleteContentPiece } = useStore()
  const confirm = useConfirm()
  const [addOpen, setAddOpen] = useState(false)
  const today = todayISO()

  const ADD_FIELDS: QuickAddField[] = useMemo(
    () => [
      { key: 'brandId', label: 'מותג', type: 'select', required: true, options: brands.map((b) => ({ value: b.id, label: b.name })) },
      {
        key: 'contentType',
        label: 'סוג תוכן',
        type: 'select',
        required: true,
        options: [
          { value: 'reel', label: 'Reel' },
          { value: 'story', label: 'Story' },
          { value: 'post', label: 'Post' },
          { value: 'carousel', label: 'Carousel' },
          { value: 'tiktok', label: 'TikTok' },
          { value: 'other', label: 'אחר' },
        ],
      },
      { key: 'platform', label: 'פלטפורמה', type: 'text' },
      { key: 'creativeIdea', label: 'רעיון יצירתי', type: 'textarea' },
      {
        key: 'status',
        label: 'סטטוס',
        type: 'select',
        options: (Object.keys(STATUS_LABEL) as ContentPieceStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
      },
      { key: 'productId', label: 'מוצר', type: 'select', secondary: true, options: brandProducts.map((p) => ({ value: p.id, label: p.name })) },
      { key: 'campaignId', label: 'קמפיין', type: 'select', secondary: true, options: campaigns.map((c) => ({ value: c.id, label: c.name })) },
      { key: 'copy', label: 'טקסט (Copy)', type: 'textarea', secondary: true },
      { key: 'assetsRequired', label: 'חומרים נדרשים', type: 'text', secondary: true },
      { key: 'dueDate', label: 'תאריך יעד', type: 'date', secondary: true },
      { key: 'scheduledDate', label: 'תאריך מתוזמן', type: 'date', secondary: true },
    ],
    [brands, brandProducts, campaigns],
  )

  const todayItems = contentPieces.filter((c) => c.dueDate === today || c.scheduledDate === today)
  const readyToPublish = contentPieces.filter((c) => c.status === 'waiting_approval')
  const needToFilm = contentPieces.filter((c) => c.status === 'needs_filming')
  const needAssets = contentPieces.filter((c) => c.assetsRequired && ['idea', 'draft', 'needs_filming', 'needs_editing'].includes(c.status))

  function brandName(brandId: string) {
    return brands.find((b) => b.id === brandId)?.name ?? '—'
  }

  async function handleAdd(values: Record<string, string>) {
    await addContentPiece({
      brandId: values.brandId,
      productId: values.productId || undefined,
      campaignId: values.campaignId || undefined,
      platform: values.platform?.trim() || '',
      contentType: (values.contentType as ContentPieceType) || 'other',
      creativeIdea: values.creativeIdea?.trim() || undefined,
      copy: values.copy?.trim() || undefined,
      assetsRequired: values.assetsRequired?.trim() || undefined,
      status: (values.status as ContentPieceStatus) || 'idea',
      dueDate: values.dueDate || undefined,
      scheduledDate: values.scheduledDate || undefined,
    })
    setAddOpen(false)
  }

  async function approve(c: ContentPiece) {
    await updateContentPiece(c.id, { status: 'approved' })
  }
  async function requestChange(c: ContentPiece) {
    await updateContentPiece(c.id, { status: 'needs_editing' })
  }
  async function reject(c: ContentPiece) {
    await updateContentPiece(c.id, { status: 'draft' })
  }
  async function remove(c: ContentPiece) {
    const ok = await confirm({
      title: 'למחוק את פריט התוכן?',
      message: c.creativeIdea || `${brandName(c.brandId)} · ${c.contentType}`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) await deleteContentPiece(c.id)
  }

  function ContentRow({ c, actions }: { c: ContentPiece; actions?: boolean }) {
    return (
      <li className="py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
            {brandName(c.brandId)} · {c.contentType}
          </span>
          <StatusPill label={STATUS_LABEL[c.status]} tone={STATUS_TONE[c.status]} />
        </div>
        {c.creativeIdea && <div className="text-xs text-stone-500 dark:text-stone-400 mt-1 truncate">{c.creativeIdea}</div>}
        <div className="flex items-center gap-3 mt-2 text-xs">
          {actions && (
            <>
              <button onClick={() => approve(c)} className="text-emerald-700 dark:text-emerald-400 font-medium hover:underline">
                אשר
              </button>
              <button onClick={() => requestChange(c)} className="text-amber-700 dark:text-amber-400 font-medium hover:underline">
                בקש שינוי
              </button>
              <button onClick={() => reject(c)} className="text-red-600 dark:text-red-400 font-medium hover:underline">
                דחה
              </button>
            </>
          )}
          <button onClick={() => remove(c)} className="text-stone-400 dark:text-stone-500 font-medium hover:text-red-600 dark:hover:text-red-400 hover:underline">
            מחק
          </button>
        </div>
      </li>
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackButton to="/work/brands" label="מותגים" />
          <div className="flex items-center gap-2">
            <TargetIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">התוכן להיום</h1>
          </div>
        </div>
        <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          + הוסף תוכן
        </button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">היום</h3>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {todayItems.length === 0 && <EmptyLine text="אין כרגע תוכן מתוזמן/יעד להיום" />}
          {todayItems.map((c) => (
            <ContentRow key={c.id} c={c} />
          ))}
        </ul>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">מוכן לפרסום — ממתין לאישור שלי</h3>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {readyToPublish.length === 0 && <EmptyLine text="אין כרגע כלום שממתין לאישור" />}
          {readyToPublish.map((c) => (
            <ContentRow key={c.id} c={c} actions />
          ))}
        </ul>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">צריך לצלם</h3>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {needToFilm.length === 0 && <EmptyLine text="אין כרגע כלום שצריך לצלם" />}
          {needToFilm.map((c) => (
            <ContentRow key={c.id} c={c} />
          ))}
        </ul>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">חסרים חומרים</h3>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {needAssets.length === 0 && <EmptyLine text="אין כרגע תוכן שחסר לו חומר" />}
          {needAssets.map((c) => (
            <li key={c.id} className="py-2.5 text-sm text-stone-700 dark:text-stone-200">
              {brandName(c.brandId)} · {c.assetsRequired}
            </li>
          ))}
        </ul>
      </Card>

      <QuickAddPopover open={addOpen} title="הוספת תוכן" fields={ADD_FIELDS} initialValues={{ status: 'idea' }} onClose={() => setAddOpen(false)} onSave={handleAdd} />
    </div>
  )
}
