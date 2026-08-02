import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../data/ThemeContext'
import { Card } from '../components/ui'
import { Theme } from '../data/types'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import { useNotify } from '../data/NotificationContext'
import { exportBackup, parseBackupFile, importBackup } from '../data/db/backup'
import { getAiEnabled, setAiEnabled } from '../ai/aiSettings'
import { checkAiHealth, testAiConnection } from '../ai/aiClient'
import { getUsageStats, resetUsageStats, estimateCostUsd, AiUsageStats } from '../ai/usageTracking'

const options: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'בהיר', icon: '☀️' },
  { value: 'dark', label: 'כהה', icon: '🌙' },
  { value: 'system', label: 'לפי הגדרת המחשב', icon: '🖥️' },
]

type AiStatus = 'unknown' | 'checking' | 'connected' | 'not_configured' | 'failed'

const ERROR_TYPE_LABELS: Record<string, string> = {
  auth: 'מפתח לא תקין',
  rate_limit: 'יותר מדי בקשות',
  network: 'אין חיבור',
  server: 'שגיאת שרת של Claude',
  no_key: 'לא הוגדר מפתח',
  unknown: 'שגיאה לא ידועה',
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { clearSampleData, reloadFromDisk } = useStore()
  const confirm = useConfirm()
  const notify = useNotify()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [aiEnabled, setAiEnabledLocal] = useState(getAiEnabled())
  const [aiStatus, setAiStatus] = useState<AiStatus>('unknown')
  const [aiErrorDetail, setAiErrorDetail] = useState<{ type: string; message: string } | null>(null)
  const [usage, setUsage] = useState<AiUsageStats>({ calls: 0, inputTokens: 0, outputTokens: 0 })

  useEffect(() => {
    getUsageStats().then(setUsage)
    // בדיקה קלה בלבד בטעינת העמוד — לא מבצעת קריאה אמיתית ל-Claude ואין לה עלות.
    // אם יש מפתח, הסטטוס נשאר "unknown" (טרם נבדק בפועל) עד לחיצה על "בדיקת חיבור".
    checkAiHealth().then((hasKey) => setAiStatus(hasKey ? 'unknown' : 'not_configured'))
  }, [])

  async function handleCheckConnection() {
    setAiStatus('checking')
    setAiErrorDetail(null)
    const result = await testAiConnection()
    if (result.ok) {
      setAiStatus('connected')
    } else {
      setAiStatus(result.errorType === 'no_key' ? 'not_configured' : 'failed')
      if (result.errorType && result.errorType !== 'no_key') {
        setAiErrorDetail({ type: ERROR_TYPE_LABELS[result.errorType] ?? result.errorType, message: result.message ?? '' })
      }
    }
  }

  function toggleAi(enabled: boolean) {
    setAiEnabled(enabled)
    setAiEnabledLocal(enabled)
  }

  async function handleResetUsage() {
    await resetUsageStats()
    setUsage({ calls: 0, inputTokens: 0, outputTokens: 0 })
    notify('המונה אופס', 'success')
  }

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

  const statusLabel: Record<AiStatus, string> = {
    unknown: '🟡 מפתח מוגדר — טרם נבדק (לחץ "בדיקת חיבור")',
    checking: 'בודק...',
    connected: '🟢 מחובר בהצלחה',
    not_configured: '⚪ חיבור Claude AI עדיין לא הוגדר',
    failed: '🔴 הבדיקה נכשלה',
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
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">✨ Claude AI</h2>
          <label className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
            <input type="checkbox" checked={aiEnabled} onChange={(e) => toggleAi(e.target.checked)} className="accent-violet-700" />
            הפעלה
          </label>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
          המפתח נשמר באופן פרטי בסביבת השרת המקומית ואינו מוצג באפליקציה.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 text-sm mb-4">
          <div>
            <div className="text-xs text-stone-400 dark:text-stone-500">סטטוס חיבור</div>
            <div className="text-stone-800 dark:text-stone-100">{statusLabel[aiStatus]}</div>
          </div>
          <div>
            <div className="text-xs text-stone-400 dark:text-stone-500">מודל פעיל</div>
            <div className="text-stone-800 dark:text-stone-100">claude-haiku-4-5</div>
          </div>
          <div>
            <button onClick={handleCheckConnection} className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-600 dark:text-stone-300">
              בדיקת חיבור
            </button>
          </div>
        </div>

        <div className="border-t border-stone-100 dark:border-stone-800 pt-4">
          <div className="text-xs text-stone-400 dark:text-stone-500 mb-2">שימוש החודש (מונה מקומי)</div>
          <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
            <div>
              <div className="text-xs text-stone-400 dark:text-stone-500">קריאות</div>
              <div className="text-stone-800 dark:text-stone-100">{usage.calls}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 dark:text-stone-500">טוקנים (משוער)</div>
              <div className="text-stone-800 dark:text-stone-100">{(usage.inputTokens + usage.outputTokens).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-stone-400 dark:text-stone-500">עלות משוערת</div>
              <div className="text-stone-800 dark:text-stone-100">${estimateCostUsd(usage).toFixed(3)}</div>
            </div>
          </div>
          <button onClick={handleResetUsage} className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400">
            איפוס מונה מקומי
          </button>
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
