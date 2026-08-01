import { createContext, useContext, useState, ReactNode, useCallback } from 'react'

interface Notice {
  id: string
  message: string
  tone: 'error' | 'success' | 'info'
}

interface NotificationValue {
  notices: Notice[]
  notify: (message: string, tone?: Notice['tone']) => void
}

const NotificationContext = createContext<NotificationValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([])

  const notify = useCallback((message: string, tone: Notice['tone'] = 'info') => {
    const id = `n-${Date.now()}-${Math.random()}`
    setNotices((prev) => [...prev, { id, message, tone }])
    setTimeout(() => setNotices((prev) => prev.filter((n) => n.id !== id)), 5000)
  }, [])

  return (
    <NotificationContext.Provider value={{ notices, notify }}>
      {children}
      <div className="fixed top-4 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        {notices.map((n) => (
          <div
            key={n.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-sm shadow-lg border max-w-md text-center ${
              n.tone === 'error'
                ? 'bg-white dark:bg-stone-900 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-300'
                : n.tone === 'success'
                  ? 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                  : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export function useNotify() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider')
  return ctx.notify
}
