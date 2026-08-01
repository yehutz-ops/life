import { useTheme } from '../data/ThemeContext'
import { Card } from '../components/ui'
import { Theme } from '../data/types'

const options: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'בהיר', icon: '☀️' },
  { value: 'dark', label: 'כהה', icon: '🌙' },
  { value: 'system', label: 'לפי הגדרת המחשב', icon: '🖥️' },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">הגדרות</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">בשלב זה יש כאן רק הגדרת מצב תצוגה. הגדרות נוספות יגיעו בהמשך.</p>
      </div>

      <Card>
        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-4">מצב תצוגה</h2>
        <div className="flex flex-wrap gap-2">
          {options.map((o) => (
            <button
              key={o.value}
              onClick={() => setTheme(o.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border flex items-center gap-2 ${
                theme === o.value
                  ? 'bg-amber-800 text-white border-amber-800'
                  : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
              }`}
            >
              <span>{o.icon}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
