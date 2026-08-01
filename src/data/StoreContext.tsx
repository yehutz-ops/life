import { createContext, useContext, useMemo, useState, ReactNode } from 'react'
import { Item, DomainId, ItemKind } from './types'
import { initialItems, projects } from './sampleData'
import { todayISO, tomorrowISO } from '../utils/date'

interface StoreValue {
  items: Item[]
  projects: typeof projects
  addInboxItem: (title: string) => void
  updateItem: (id: string, patch: Partial<Item>) => void
  toggleDone: (id: string) => void
  postponeToTomorrow: (id: string) => void
  assignDomain: (id: string, domain: DomainId, date?: string, kind?: ItemKind) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(initialItems)

  function addInboxItem(title: string) {
    setItems((prev) => [{ id: `i-${Date.now()}`, kind: 'task', title, status: 'open' }, ...prev])
  }

  function updateItem(id: string, patch: Partial<Item>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  }

  function toggleDone(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: it.status === 'done' ? 'open' : 'done' } : it)))
  }

  function postponeToTomorrow(id: string) {
    updateItem(id, { date: tomorrowISO() })
  }

  function assignDomain(id: string, domain: DomainId, date?: string, kind?: ItemKind) {
    updateItem(id, { domain, date: date ?? todayISO(), ...(kind ? { kind } : {}) })
  }

  const value = useMemo<StoreValue>(
    () => ({ items, projects, addInboxItem, updateItem, toggleDone, postponeToTomorrow, assignDomain }),
    [items],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
