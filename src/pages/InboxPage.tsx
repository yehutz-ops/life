import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { useConfirm } from '../data/ConfirmContext'
import { Card } from '../components/ui'

const sourceLabel = { typed: '⌨️ הוקלד', spoken: '🎤 הוקלט', email: '📧 מייל' } as const
const emailAccountLabel = { work: 'עבודה', personal: 'אישי' } as const

export default function InboxPage() {
  const { inboxEntries, deleteInboxEntry } = useStore()
  const { openSort } = useDetailModal()
  const confirm = useConfirm()

  const pending = inboxEntries.filter((e) => e.status === 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  async function handleDelete(id: string, text: string) {
    const ok = await confirm({
      title: 'למחוק את הפריט מתיבת הכניסה?',
      message: `"${text}" יימחק ולא ייווצר ממנו פריט.`,
      confirmLabel: 'מחק',
      danger: true,
    })
    if (ok) await deleteInboxEntry(id)
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">📥 תיבת כניסה</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
          פריטים שהוספת מהר ועדיין לא שייכת לתחום. לחיצה על "לסדר" תבקש כותרת, תחום, תאריך וסוג, ותהפוך את זה לפריט אמיתי במערכת.
        </p>
      </div>

      <div className="space-y-4">
        {pending.map((entry) => (
          <Card key={entry.id} className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              {entry.source === 'email' && entry.emailSubject && (
                <div className="text-xs font-bold text-stone-500 dark:text-stone-400 mb-0.5">{entry.emailSubject}</div>
              )}
              <div className="text-sm font-medium text-stone-800 dark:text-stone-100">{entry.text}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">
                {sourceLabel[entry.source]}
                {entry.source === 'email' && entry.emailAccount && ` · ${emailAccountLabel[entry.emailAccount]}`}
                {entry.source === 'email' && entry.emailFrom && ` · מאת: ${entry.emailFrom}`}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(entry.id, entry.text)}
                className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-500 dark:text-stone-400"
              >
                מחק
              </button>
              <button onClick={() => openSort(entry.id, entry.text)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
                לסדר
              </button>
            </div>
          </Card>
        ))}
        {pending.length === 0 && (
          <Card>
            <p className="text-sm text-stone-400 dark:text-stone-500">תיבת הכניסה ריקה — כל הכבוד 🎉</p>
          </Card>
        )}
      </div>
    </div>
  )
}
