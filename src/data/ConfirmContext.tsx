import { createContext, useContext, useState, ReactNode } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

interface ConfirmValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmValue | null>(null)

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingConfirm | null>(null)

  function confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => setPending({ ...options, resolve }))
  }

  function respond(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[110] p-4" onClick={() => respond(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-2">{pending.title}</h3>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">{pending.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => respond(false)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300"
              >
                ביטול
              </button>
              <button
                onClick={() => respond(true)}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-medium ${
                  pending.danger ? 'bg-stone-800 hover:bg-stone-900' : 'bg-amber-800 hover:bg-amber-900'
                }`}
              >
                {pending.confirmLabel ?? 'אישור'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider')
  return ctx.confirm
}
