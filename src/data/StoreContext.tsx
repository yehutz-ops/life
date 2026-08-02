import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { Item, Project, InboxEntry } from './types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset } from './brandTypes'
import { repository } from './db/repository'
import { seedIfEmpty } from './db/seed'
import { isIndexedDBAvailable } from './db/database'
import { newId } from '../utils/id'
import { tomorrowISO, nowISO } from '../utils/date'
import { useNotify } from './NotificationContext'
import { recordDomainCorrection } from '../ai/routingPreferences'
import { getAiLearningEnabled } from '../ai/aiSettings'

interface StoreValue {
  items: Item[]
  projects: Project[]
  inboxEntries: InboxEntry[]
  brands: Brand[]
  brandProducts: BrandProduct[]
  brandCampaigns: BrandCampaign[]
  brandContentItems: BrandContentItem[]
  brandPendingActivities: BrandPendingActivity[]
  brandMediaAssets: BrandMediaAsset[]
  loading: boolean
  storageAvailable: boolean
  addItem: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Item>
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  postponeToTomorrow: (id: string) => Promise<void>
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addInboxEntry: (text: string, source: 'typed' | 'spoken') => Promise<void>
  sortInboxEntry: (entryId: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteInboxEntry: (id: string) => Promise<void>
  clearSampleData: () => Promise<void>
  reloadFromDisk: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [inboxEntries, setInboxEntries] = useState<InboxEntry[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([])
  const [brandCampaigns, setBrandCampaigns] = useState<BrandCampaign[]>([])
  const [brandContentItems, setBrandContentItems] = useState<BrandContentItem[]>([])
  const [brandPendingActivities, setBrandPendingActivities] = useState<BrandPendingActivity[]>([])
  const [brandMediaAssets, setBrandMediaAssets] = useState<BrandMediaAsset[]>([])
  const [loading, setLoading] = useState(true)
  const storageAvailable = isIndexedDBAvailable()
  const notify = useNotify()

  async function loadAll() {
    const [i, p, ib, br, bp, bc, bci, bpa, bma] = await Promise.all([
      repository.getAllItems(),
      repository.getAllProjects(),
      repository.getAllInboxEntries(),
      repository.getAllBrands(),
      repository.getAllBrandProducts(),
      repository.getAllBrandCampaigns(),
      repository.getAllBrandContentItems(),
      repository.getAllBrandPendingActivities(),
      repository.getAllBrandMediaAssets(),
    ])
    setItems(i)
    setProjects(p)
    setInboxEntries(ib)
    setBrands(br)
    setBrandProducts(bp)
    setBrandCampaigns(bc)
    setBrandContentItems(bci)
    setBrandPendingActivities(bpa)
    setBrandMediaAssets(bma)
  }

  useEffect(() => {
    if (!storageAvailable) {
      notify('הדפדפן חסם את האחסון המקומי של האתר. המידע לא יישמר בין פתיחות — אפשר לבדוק את הגדרות הפרטיות של הדפדפן.', 'error')
      setLoading(false)
      return
    }
    seedIfEmpty()
      .then(loadAll)
      .catch((err) => notify(`שגיאה בטעינת המידע השמור: ${err.message ?? err}`, 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function addItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const item: Item = { ...data, id: newId('item'), createdAt: now, updatedAt: now }
    try {
      await repository.putItem(item)
      setItems((prev) => [item, ...prev])
      return item
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הפריט: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateItem(id: string, patch: Partial<Item>) {
    const current = items.find((it) => it.id === id)
    if (!current) return
    const next: Item = { ...current, ...patch, updatedAt: nowISO() }
    if (patch.status === 'done' && current.status !== 'done') next.completedAt = nowISO()
    if (patch.status && patch.status !== 'done') next.completedAt = undefined
    try {
      await repository.putItem(next)
      setItems((prev) => prev.map((it) => (it.id === id ? next : it)))
      // תיקון ידני של תחום/יעד — נשמר כהעדפת ניתוב מקומית ללמידה עתידית (לא חוק מוחלט, ראו routingPreferences.ts).
      if (patch.domain && patch.domain !== current.domain && getAiLearningEnabled()) {
        recordDomainCorrection(next.title, next.domain, next.destination).catch(() => {})
      }
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteItem(id: string) {
    try {
      await repository.deleteItem(id)
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function toggleDone(id: string) {
    const current = items.find((it) => it.id === id)
    if (!current) return
    await updateItem(id, { status: current.status === 'done' ? 'open' : 'done' })
  }

  async function postponeToTomorrow(id: string) {
    await updateItem(id, { date: tomorrowISO() })
  }

  async function addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const project: Project = { ...data, id: newId('proj'), createdAt: now, updatedAt: now }
    try {
      await repository.putProject(project)
      setProjects((prev) => [project, ...prev])
      return project
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הפרויקט: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const current = projects.find((p) => p.id === id)
    if (!current) return
    const next: Project = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putProject(next)
      setProjects((prev) => prev.map((p) => (p.id === id ? next : p)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי בפרויקט: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteProject(id: string) {
    try {
      await repository.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפרויקט: ${err.message ?? err}`, 'error')
    }
  }

  async function addInboxEntry(text: string, source: 'typed' | 'spoken') {
    const entry: InboxEntry = { id: newId('inbox'), text, source, createdAt: nowISO(), status: 'pending' }
    try {
      await repository.putInboxEntry(entry)
      setInboxEntries((prev) => [entry, ...prev])
    } catch (err: any) {
      notify(`לא הצלחתי לשמור בתיבת הכניסה: ${err.message ?? err}`, 'error')
    }
  }

  async function sortInboxEntry(entryId: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const entry = inboxEntries.find((e) => e.id === entryId)
    if (!entry) return
    try {
      const item = await addItem(data)
      const next: InboxEntry = { ...entry, status: 'sorted', sortedItemId: item.id }
      await repository.putInboxEntry(next)
      setInboxEntries((prev) => prev.map((e) => (e.id === entryId ? next : e)))
    } catch (err: any) {
      notify(`לא הצלחתי לסדר את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteInboxEntry(id: string) {
    const entry = inboxEntries.find((e) => e.id === id)
    if (!entry) return
    const next: InboxEntry = { ...entry, status: 'deleted' }
    try {
      await repository.putInboxEntry(next)
      setInboxEntries((prev) => prev.map((e) => (e.id === id ? next : e)))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function clearSampleData() {
    try {
      await repository.clearAll()
      setItems([])
      setProjects([])
      setInboxEntries([])
      setBrands([])
      setBrandProducts([])
      setBrandCampaigns([])
      setBrandContentItems([])
      setBrandPendingActivities([])
      setBrandMediaAssets([])
      notify('כל המידע נמחק. אפשר להתחיל מחדש.', 'success')
    } catch (err: any) {
      notify(`המחיקה נכשלה: ${err.message ?? err}`, 'error')
    }
  }

  const value = useMemo<StoreValue>(
    () => ({
      items,
      projects,
      inboxEntries,
      brands,
      brandProducts,
      brandCampaigns,
      brandContentItems,
      brandPendingActivities,
      brandMediaAssets,
      loading,
      storageAvailable,
      addItem,
      updateItem,
      deleteItem,
      toggleDone,
      postponeToTomorrow,
      addProject,
      updateProject,
      deleteProject,
      addInboxEntry,
      sortInboxEntry,
      deleteInboxEntry,
      clearSampleData,
      reloadFromDisk: loadAll,
    }),
    [items, projects, inboxEntries, brands, brandProducts, brandCampaigns, brandContentItems, brandPendingActivities, brandMediaAssets, loading],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
