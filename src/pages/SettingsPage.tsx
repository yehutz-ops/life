import { useRef } from 'react'
import { useTheme } from '../data/ThemeContext'
import { Card } from '../components/ui'
import { Theme } from '../data/types'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import { useNotify } from '../data/NotificationContext'
import { exportBackup, parseBackupFile, importBackup } from '../data/db/backup'

const options: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'בהיר', icon: '☀️' },
  { value: 'dark', label: 'כהה', icon: '🌙' },
  { value: 'system', label: 'לפי הגדרת המחשב', icon: '🖥️' },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { clearSampleData, reloadFromDisk } = useStore()
  const confirm = useConfirm()
  const notify = useNotify()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleClear() {
    const ok = await confirm({
      title: 'למחוק את כל המידע?',
      message: 'כל המשימות, הפרויקטים ותיבת הכניסה יימחקו לצמיתות. אי אפשר לשחזר את זה (אלא אם יש לך גיבוי).',
      confirmLabel: 'מחק הכול',
      danger: true,
    })
    if (ok) await clearSampleData()
  }

  async function handleExport() {
    try {
      await exportBackup()
      notify('קובץ הגיבוי הורד למחשב שלך', 'success')
    } catch (err: any) {
      notify(`הייצוא נכשל: ${err.message ?? err}`, 'error')
    }
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const data = parseBackupFile(text)
      const ok = await confirm({
        title: 'לייבא גיבוי?',
        message: `הפעולה הזו תמחק את כל המידע הקיים ותחליף אותו בתוכן הקובץ (${data.items.length} פריטים, ${data.projects.length} פרויקטים). אי אפשר לבטל את זה.`,
        confirmLabel: 'ייבא והחלף',
        danger: true,
      })
      if (!ok) return
      await importBackup(data)
      await reloadFromDisk()
      notify('הגיבוי יובא בהצלחה', 'success')
    } catch (err: any) {
      notify(`הייבוא נכשל: ${err.message ?? err}`, 'error')
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">הגדרות</h1>
      </div>

      <Card>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">מצב תצוגה</h2>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 ${
                theme === o.value ? 'bg-amber-800 text-white border-amber-800' : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
              }`}
            >
              <span>{o.icon}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">גיבוי המידע שלי</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          המידע נשמר רק במחשב הזה. מומלץ להוריד גיבוי מדי פעם, ובוודאי לפני ניקוי נתונים בדפדפן.
        </p>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExport} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            הורדת גיבוי
          </button>
          <button onClick={handleImportClick} className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
            ייבוא גיבוי
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleFileSelected} />
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">איפוס</h2>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">מוחק את כל המשימות, הפרויקטים ותיבת הכניסה — כולל נתוני הדוגמה אם עדיין קיימים.</p>
        <button onClick={handleClear} className="px-4 py-2 rounded-xl border border-stone-300 dark:border-stone-600 text-sm font-medium text-stone-700 dark:text-stone-300">
          מחיקת כל המידע
        </button>
      </Card>
    </div>
  )
}
