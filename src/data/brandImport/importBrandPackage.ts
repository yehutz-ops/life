import { Item } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset } from '../brandTypes'
import { repository } from '../db/repository'
import { STORES, runTransaction } from '../db/database'
import { exportSafetyBackup } from '../db/backup'
import { nowISO } from '../../utils/date'
import { parseBrandPackage, ParsedBrandBundle } from './parseBrandPackage'
import { validateBrandPackage } from './validateBrandPackage'
import { buildPreview, BrandImportPreview } from './buildPreview'

export interface ExistingBrandData {
  brands: Brand[]
  products: BrandProduct[]
  campaigns: BrandCampaign[]
  contentItems: BrandContentItem[]
  pendingActivities: BrandPendingActivity[]
  mediaAssets: BrandMediaAsset[]
  items: Item[]
}

async function loadExisting(): Promise<ExistingBrandData> {
  const [brands, products, campaigns, contentItems, pendingActivities, mediaAssets, items] = await Promise.all([
    repository.getAllBrands(),
    repository.getAllBrandProducts(),
    repository.getAllBrandCampaigns(),
    repository.getAllBrandContentItems(),
    repository.getAllBrandPendingActivities(),
    repository.getAllBrandMediaAssets(),
    repository.getAllItems(),
  ])
  return { brands, products, campaigns, contentItems, pendingActivities, mediaAssets, items }
}

export interface PreparedImport {
  raw: unknown
  parsed: ParsedBrandBundle
  preview: BrandImportPreview
  existing: ExistingBrandData
  errors: string[]
  warnings: string[]
  valid: boolean
}

// שלב 1: Validation + Preview בלבד — קריאה בלבד, שום כתיבה למסד הנתונים.
export async function prepareBrandImport(raw: unknown): Promise<PreparedImport> {
  const validation = validateBrandPackage(raw)
  if (!validation.valid) {
    return { raw, parsed: null as any, preview: null as any, existing: null as any, errors: validation.errors, warnings: validation.warnings, valid: false }
  }
  const parsed = parseBrandPackage(raw)
  const existing = await loadExisting()
  const preview = buildPreview(parsed, validation, existing)
  return { raw, parsed, preview, existing, errors: [], warnings: validation.warnings, valid: true }
}

export interface ImportReportCounts {
  brand: number
  products: number
  campaigns: number
  contentItems: number
  pendingActivities: number
  mediaAssets: number
  tasks: number
}

export interface ImportReport {
  brandId: string
  brandName: string
  added: ImportReportCounts
  updated: ImportReportCounts
  unchanged: ImportReportCounts
  skippedDueToManualEdit: ImportReportCounts
  warnings: string[]
  backupCreated: boolean
}

function emptyCounts(): ImportReportCounts {
  return { brand: 0, products: 0, campaigns: 0, contentItems: 0, pendingActivities: 0, mediaAssets: 0, tasks: 0 }
}

// שלב 2: הכתיבה בפועל — פעולה אחת אטומית (הכול-או-כלום), רק אחרי אישור מפורש של המשתמש.
// אם משהו נכשל, כלום לא נכתב (עסקת IndexedDB יחידה שפורשת על כל המחסנים).
export async function commitBrandImport(
  prepared: PreparedImport,
  opts: { allowOverwriteConflicts?: boolean; createBackup?: boolean } = {},
): Promise<ImportReport> {
  if (!prepared.valid) throw new Error('לא ניתן לבצע ייבוא — הבדיקות לא עברו')
  const { parsed, preview, existing } = prepared
  const allowOverwrite = !!opts.allowOverwriteConflicts

  let backupCreated = false
  if (opts.createBackup !== false) {
    await exportSafetyBackup('brand-import')
    backupCreated = true
  }

  const now = nowISO()
  const added = emptyCounts()
  const updated = emptyCounts()
  const unchanged = emptyCounts()
  const skippedDueToManualEdit = emptyCounts()

  const existingBrand = existing.brands.find((b) => b.id === parsed.brand.id)
  const existingProductsById = new Map(existing.products.map((p) => [p.id, p]))
  const existingCampaignsById = new Map(existing.campaigns.map((c) => [c.id, c]))
  const existingContentItemsById = new Map(existing.contentItems.map((c) => [c.id, c]))
  const existingPendingById = new Map(existing.pendingActivities.map((a) => [a.id, a]))
  const existingMediaById = new Map(existing.mediaAssets.map((m) => [m.id, m]))
  const existingItemsById = new Map(existing.items.map((it) => [it.id, it]))

  await runTransaction(
    [STORES.brands, STORES.brandProducts, STORES.brandCampaigns, STORES.brandContentItems, STORES.brandPendingActivities, STORES.brandMediaAssets, STORES.items],
    (stores) => {
      // --- brand ---
      if (preview.categories.brand !== 'conflict' || allowOverwrite) {
        if (preview.categories.brand !== 'unchanged') {
          const createdAt = existingBrand?.createdAt ?? now
          const record: Brand = { ...parsed.brand, createdAt, updatedAt: now, lastImportedAt: now }
          stores[STORES.brands].put(record)
          if (preview.categories.brand === 'new') added.brand++
          else updated.brand++
        } else {
          unchanged.brand++
        }
      } else {
        skippedDueToManualEdit.brand++
      }

      // --- generic per-entity writer ---
      const writeEntity = <TParsed extends { id: string }, TExisting extends { id: string; createdAt: string }>(
        parsedList: TParsed[],
        buckets: { new: string[]; update: string[]; unchanged: string[]; conflict: string[] },
        existingById: Map<string, TExisting>,
        store: IDBObjectStore,
        counters: keyof ImportReportCounts,
        buildRecord: (p: TParsed, createdAt: string) => unknown,
      ) => {
        for (const p of parsedList) {
          if (buckets.unchanged.includes(p.id)) {
            unchanged[counters]++
            continue
          }
          if (buckets.conflict.includes(p.id) && !allowOverwrite) {
            skippedDueToManualEdit[counters]++
            continue
          }
          const isNew = buckets.new.includes(p.id)
          const createdAt = existingById.get(p.id)?.createdAt ?? now
          store.put(buildRecord(p, createdAt))
          if (isNew) added[counters]++
          else updated[counters]++
        }
      }

      writeEntity(parsed.products, preview.categories.products, existingProductsById, stores[STORES.brandProducts], 'products', (p, createdAt) => ({
        ...p,
        createdAt,
        updatedAt: now,
        lastImportedAt: now,
      }))

      writeEntity(parsed.campaigns, preview.categories.campaigns, existingCampaignsById, stores[STORES.brandCampaigns], 'campaigns', (p, createdAt) => ({
        ...p,
        createdAt,
        updatedAt: now,
        lastImportedAt: now,
      }))

      writeEntity(
        parsed.contentItems,
        preview.categories.contentItems,
        existingContentItemsById,
        stores[STORES.brandContentItems],
        'contentItems',
        (p, createdAt) => ({ ...p, createdAt, updatedAt: now, lastImportedAt: now }),
      )

      writeEntity(
        parsed.pendingActivities,
        preview.categories.pendingActivities,
        existingPendingById,
        stores[STORES.brandPendingActivities],
        'pendingActivities',
        (p, createdAt) => ({ ...p, createdAt, updatedAt: now, lastImportedAt: now }),
      )

      writeEntity(parsed.mediaAssets, preview.categories.mediaAssets, existingMediaById, stores[STORES.brandMediaAssets], 'mediaAssets', (p, createdAt) => ({
        ...p,
        createdAt,
        updatedAt: now,
        lastImportedAt: now,
      }))

      // --- tasks (Item) — ישות כללית קיימת, ללא זיהוי התנגשות (ראו buildPreview) ---
      for (const t of parsed.tasks) {
        if (preview.categories.tasks.unchanged.includes(t.id)) {
          unchanged.tasks++
          continue
        }
        const existingItem = existingItemsById.get(t.id)
        const isNew = !existingItem
        const record: Item = {
          id: t.id,
          title: t.title,
          kind: 'task',
          domain: 'work',
          destination: 'מותגים',
          brandId: parsed.brand.id,
          contentItemId: t.contentItemId,
          priority: existingItem?.priority ?? 'medium',
          status: existingItem?.status ?? 'open',
          createdAt: existingItem?.createdAt ?? now,
          updatedAt: now,
        }
        stores[STORES.items].put(record)
        if (isNew) added.tasks++
        else updated.tasks++
      }
    },
  )

  return {
    brandId: parsed.brand.id,
    brandName: parsed.brand.name,
    added,
    updated,
    unchanged,
    skippedDueToManualEdit,
    warnings: preview.validatorWarnings,
    backupCreated,
  }
}
