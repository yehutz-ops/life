import { createContext, useContext, useState, ReactNode } from 'react'

export type ItemModalTarget =
  | { mode: 'edit'; id: string }
  | { mode: 'create'; domain?: string }
  | { mode: 'sort'; entryId: string; prefillTitle: string }

interface DetailModalValue {
  target: ItemModalTarget | null
  openEdit: (id: string) => void
  openCreate: (domain?: string) => void
  openSort: (entryId: string, prefillTitle: string) => void
  close: () => void
}

const DetailModalContext = createContext<DetailModalValue | null>(null)

export function DetailModalProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<ItemModalTarget | null>(null)
  return (
    <DetailModalContext.Provider
      value={{
        target,
        openEdit: (id) => setTarget({ mode: 'edit', id }),
        openCreate: (domain) => setTarget({ mode: 'create', domain }),
        openSort: (entryId, prefillTitle) => setTarget({ mode: 'sort', entryId, prefillTitle }),
        close: () => setTarget(null),
      }}
    >
      {children}
    </DetailModalContext.Provider>
  )
}

export function useDetailModal() {
  const ctx = useContext(DetailModalContext)
  if (!ctx) throw new Error('useDetailModal must be used within DetailModalProvider')
  return ctx
}
