import { createContext, useContext, useState, ReactNode } from 'react'

interface QuickAddValue {
  isOpen: boolean
  open: () => void
  close: () => void
}

const QuickAddContext = createContext<QuickAddValue | null>(null)

export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <QuickAddContext.Provider value={{ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }}>
      {children}
    </QuickAddContext.Provider>
  )
}

export function useQuickAdd() {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error('useQuickAdd must be used within QuickAddProvider')
  return ctx
}
