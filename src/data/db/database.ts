const DB_NAME = 'life-control-center'
const DB_VERSION = 1

export const STORES = {
  items: 'items',
  projects: 'projects',
  inbox: 'inbox',
  meta: 'meta',
} as const

let dbPromise: Promise<IDBDatabase> | null = null

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.indexedDB
}

export function openDB(): Promise<IDBDatabase> {
  if (!isIndexedDBAvailable()) {
    return Promise.reject(new Error('אחסון מקומי (IndexedDB) לא זמין בדפדפן הזה'))
  }
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORES.items)) db.createObjectStore(STORES.items, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.projects)) db.createObjectStore(STORES.projects, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.inbox)) db.createObjectStore(STORES.inbox, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.meta)) db.createObjectStore(STORES.meta, { keyPath: 'key' })
    }

    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('לא הצלחתי לפתוח את מסד הנתונים המקומי'))
    req.onblocked = () => reject(new Error('מסד הנתונים המקומי חסום — כנראה יש טאב אחר פתוח עם גרסה ישנה'))
  })

  return dbPromise
}

function withStore<T>(storeName: string, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const req = fn(store)
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error ?? new Error('שמירת המידע נכשלה'))
      }),
  )
}

export function getAll<T>(storeName: string): Promise<T[]> {
  return withStore<T[]>(storeName, 'readonly', (store) => store.getAll())
}

export function put<T>(storeName: string, value: T): Promise<void> {
  return withStore<void>(storeName, 'readwrite', (store) => store.put(value))
}

export function remove(storeName: string, id: string): Promise<void> {
  return withStore<void>(storeName, 'readwrite', (store) => store.delete(id))
}

export function clearStore(storeName: string): Promise<void> {
  return withStore<void>(storeName, 'readwrite', (store) => store.clear())
}

export function getMeta(key: string): Promise<string | undefined> {
  return withStore<{ key: string; value: string } | undefined>(STORES.meta, 'readonly', (store) => store.get(key)).then(
    (r) => r?.value,
  )
}

export function setMeta(key: string, value: string): Promise<void> {
  return withStore<void>(STORES.meta, 'readwrite', (store) => store.put({ key, value }))
}
