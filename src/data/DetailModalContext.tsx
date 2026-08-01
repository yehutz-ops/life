import { createContext, useContext, useState, ReactNode } from 'react'

interface DetailModalValue {
  openItemId: string | null
  open: (id: string) => void
  close: () => void
}

const DetailModalContext = createContext<DetailModalValue | null>(null)

export function DetailModalProvider({ children }: { children: ReactNode }) {
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  return (
    <DetailModalContext.Provider value={{ openItemId, open: setOpenItemId, close: () => setOpenItemId(null) }}>
      {children}
    </DetailModalContext.Provider>
  )
}

export function useDetailModal() {
  const ctx = useContext(DetailModalContext)
  if (!ctx) throw new Error('useDetailModal must be used within DetailModalProvider')
  return ctx
}
