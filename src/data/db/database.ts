const DB_NAME = 'life-control-center'
const DB_VERSION = 3

export const STORES = {
  items: 'items',
  projects: 'projects',
  inbox: 'inbox',
  meta: 'meta',
  brands: 'brands',
  brandProducts: 'brandProducts',
  brandCampaigns: 'brandCampaigns',
  brandContentItems: 'brandContentItems',
  brandPendingActivities: 'brandPendingActivities',
  brandMediaAssets: 'brandMediaAssets',
  influencers: 'influencers',
  influencerProducts: 'influencerProducts',
  influencerContent: 'influencerContent',
  influencerSales: 'influencerSales',
  campaigns: 'campaigns',
  campaignCreatives: 'campaignCreatives',
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
      // מודל המותגים הכללי — משותף לכל מותג עתידי, לא רק FOMOWA.
      if (!db.objectStoreNames.contains(STORES.brands)) db.createObjectStore(STORES.brands, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.brandProducts)) db.createObjectStore(STORES.brandProducts, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.brandCampaigns)) db.createObjectStore(STORES.brandCampaigns, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.brandContentItems)) db.createObjectStore(STORES.brandContentItems, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.brandPendingActivities)) db.createObjectStore(STORES.brandPendingActivities, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.brandMediaAssets)) db.createObjectStore(STORES.brandMediaAssets, { keyPath: 'id' })
      // ניהול משפיענים + קמפיינים ממומנים — ישויות עצמאיות, לפי אותה שיטה כמו המותגים.
      if (!db.objectStoreNames.contains(STORES.influencers)) db.createObjectStore(STORES.influencers, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.influencerProducts)) db.createObjectStore(STORES.influencerProducts, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.influencerContent)) db.createObjectStore(STORES.influencerContent, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.influencerSales)) db.createObjectStore(STORES.influencerSales, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.campaigns)) db.createObjectStore(STORES.campaigns, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(STORES.campaignCreatives)) db.createObjectStore(STORES.campaignCreatives, { keyPath: 'id' })
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

// עסקה יחידה שפורשת על פני כמה מחסנים בבת אחת — כל הכתיבות מצליחות יחד, או שכולן מתבטלות יחד
// (אטומיות אמיתית של IndexedDB, לא גיבוי-ושחזור ידני). משמש לייבוא חבילת מותג "הכול או כלום".
export function runTransaction<T>(storeNames: string[], fn: (stores: Record<string, IDBObjectStore>) => T | Promise<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeNames, 'readwrite')
        const stores: Record<string, IDBObjectStore> = {}
        for (const name of storeNames) stores[name] = tx.objectStore(name)

        let result: T
        tx.oncomplete = () => resolve(result)
        tx.onerror = () => reject(tx.error ?? new Error('הפעולה נכשלה — לא בוצע שום שינוי'))
        tx.onabort = () => reject(tx.error ?? new Error('הפעולה בוטלה — לא בוצע שום שינוי'))

        const abortWith = (err: unknown) => {
          try {
            tx.abort()
          } catch {
            /* already aborted/finished */
          }
          reject(err)
        }

        // fn עלול לזרוק סינכרונית (למשל שגיאת structured-clone מ-store.put) — נתפס כאן
        // כדי להבטיח שהעסקה תמיד תתבטל במלואה, לא רק כשהכישלון מגיע כ-Promise דחוי.
        try {
          Promise.resolve(fn(stores))
            .then((r) => {
              result = r
            })
            .catch(abortWith)
        } catch (err) {
          abortWith(err)
        }
      }),
  )
}

export function getMeta(key: string): Promise<string | undefined> {
  return withStore<{ key: string; value: string } | undefined>(STORES.meta, 'readonly', (store) => store.get(key)).then(
    (r) => r?.value,
  )
}

export function setMeta(key: string, value: string): Promise<void> {
  return withStore<void>(STORES.meta, 'readwrite', (store) => store.put({ key, value }))
}
