import { createContext, useContext, useState, ReactNode } from 'react'
import { DomainId, ItemKind, Priority } from './types'

export interface ItemPrefill {
  title?: string
  kind?: ItemKind
  domain?: DomainId
  date?: string
  startTime?: string
  priority?: Priority
  projectId?: string
  personName?: string
  notes?: string
  courseId?: string
  studyKind?: 'assignment' | 'reading' | 'exam' | 'submission'
}

export type ItemModalTarget =
  | { mode: 'edit'; id: string }
  | { mode: 'create'; domain?: string; prefill?: ItemPrefill }
  | { mode: 'sort'; entryId: string; prefillTitle: string }

interface DetailModalValue {
  target: ItemModalTarget | null
  openEdit: (id: string) => void
  openCreate: (domain?: string, prefill?: ItemPrefill) => void
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
        openCreate: (domain, prefill) => setTarget({ mode: 'create', domain, prefill }),
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
