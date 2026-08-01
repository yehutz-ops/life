import { useState } from 'react'
import { useTheme } from '../data/ThemeContext'
import { Theme } from '../data/types'

const options: { value: Theme; label: string; icon: string }[] = [
  { value: 'light', label: 'בהיר', icon: '☀️' },
  { value: 'dark', label: 'כהה', icon: '🌙' },
  { value: 'system', label: 'לפי הגדרת המחשב', icon: '🖥️' },
]

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800"
        title="מצב תצוגה"
      >
        {resolvedTheme === 'dark' ? '🌙' : '☀️'}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-lg z-40 p-1">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => {
                  setTheme(o.value)
                  setOpen(false)
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-right ${
                  theme === o.value ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span>{o.icon}</span>
                <span>{o.label}</span>
                {theme === o.value && <span className="mr-auto">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
