import { Item } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset } from '../brandTypes'
import { ParsedBrandBundle } from './parseBrandPackage'
import { ValidationResult } from './validateBrandPackage'

export type EntityCategory = 'new' | 'update' | 'unchanged' | 'conflict'

export interface CategoryBucket {
  new: string[]
  update: string[]
  unchanged: string[]
  conflict: string[] // קיים שינוי ידני מאז הייבוא הקודם — לא ידרס בלי אישור מפורש
}

export interface BrandImportPreview {
  brandId: string
  brandName: string
  brandIsNew: boolean
  counts: { products: number; campaigns: number; contentItems: number; tasks: number; mediaAssets: number; pendingActivities: number }
  missingInformation: string[]
  validatorWarnings: string[]
  categories: {
    brand: EntityCategory
    products: CategoryBucket
    campaigns: CategoryBucket
    contentItems: CategoryBucket
    pendingActivities: CategoryBucket
    mediaAssets: CategoryBucket
    tasks: CategoryBucket
  }
  hasConflicts: boolean
}

interface ExistingData {
  brands: Brand[]
  products: BrandProduct[]
  campaigns: BrandCampaign[]
  contentItems: BrandContentItem[]
  pendingActivities: BrandPendingActivity[]
  mediaAssets: BrandMediaAsset[]
  items: Item[]
}

function wasManuallyEditedSinceImport(updatedAt: string, lastImportedAt: string): boolean {
  return new Date(updatedAt).getTime() > new Date(lastImportedAt).getTime()
}

function categorize<TParsed extends { id: string }, TExisting extends { id: string; updatedAt: string; lastImportedAt: string }>(
  parsed: TParsed[],
  existingById: Map<string, TExisting>,
  contentEqual: (parsed: TParsed, existing: TExisting) => boolean,
): CategoryBucket {
  const bucket: CategoryBucket = { new: [], update: [], unchanged: [], conflict: [] }
  for (const p of parsed) {
    const existing = existingById.get(p.id)
    if (!existing) {
      bucket.new.push(p.id)
      continue
    }
    if (wasManuallyEditedSinceImport(existing.updatedAt, existing.lastImportedAt)) {
      bucket.conflict.push(p.id)
      continue
    }
    if (contentEqual(p, existing)) bucket.unchanged.push(p.id)
    else bucket.update.push(p.id)
  }
  return bucket
}

export function buildPreview(parsed: ParsedBrandBundle, validation: ValidationResult, existing: ExistingData): BrandImportPreview {
  const existingBrand = existing.brands.find((b) => b.id === parsed.brand.id)
  const productsById = new Map(existing.products.filter((p) => p.brandId === parsed.brand.id).map((p) => [p.id, p]))
  const campaignsById = new Map(existing.campaigns.filter((c) => c.brandId === parsed.brand.id).map((c) => [c.id, c]))
  const contentItemsById = new Map(existing.contentItems.filter((c) => c.brandId === parsed.brand.id).map((c) => [c.id, c]))
  const pendingById = new Map(existing.pendingActivities.filter((a) => a.brandId === parsed.brand.id).map((a) => [a.id, a]))
  const mediaById = new Map(existing.mediaAssets.filter((m) => m.brandId === parsed.brand.id).map((m) => [m.id, m]))
  const tasksById = new Map(existing.items.filter((it) => it.brandId === parsed.brand.id).map((it) => [it.id, it]))

  const brandCategory: EntityCategory = !existingBrand
    ? 'new'
    : wasManuallyEditedSinceImport(existingBrand.updatedAt, existingBrand.lastImportedAt)
      ? 'conflict'
      : JSON.stringify(existingBrand.fields) === JSON.stringify(parsed.brand.fields)
        ? 'unchanged'
        : 'update'

  const categories = {
    brand: brandCategory,
    products: categorize(parsed.products, productsById, (p, e) => JSON.stringify(p.fields) === JSON.stringify(e.fields) && p.name === e.name),
    campaigns: categorize(parsed.campaigns, campaignsById, (p, e) => JSON.stringify(p.fields) === JSON.stringify(e.fields)),
    contentItems: categorize(parsed.contentItems, contentItemsById, (p, e) => JSON.stringify(p.fields) === JSON.stringify(e.fields)),
    pendingActivities: categorize(parsed.pendingActivities, pendingById, (p, e) => JSON.stringify(p.fields) === JSON.stringify(e.fields)),
    mediaAssets: categorize(parsed.mediaAssets, mediaById, (p, e) => p.fileName === e.fileName && p.originalPath === e.originalPath),
    // משימות (Items) אינן עוקבות אחרי lastImportedAt — הן ישות כללית שנערכת גם ישירות ע"י המשתמש,
    // ולכן אין לגביהן זיהוי "התנגשות" אוטומטי; רק חדש/מעודכן/ללא שינוי.
    tasks: (() => {
      const bucket: CategoryBucket = { new: [], update: [], unchanged: [], conflict: [] }
      for (const t of parsed.tasks) {
        const existing = tasksById.get(t.id)
        if (!existing) bucket.new.push(t.id)
        else if (existing.title === t.title && existing.contentItemId === t.contentItemId) bucket.unchanged.push(t.id)
        else bucket.update.push(t.id)
      }
      return bucket
    })(),
  }

  const hasConflicts =
    categories.brand === 'conflict' ||
    [categories.products, categories.campaigns, categories.contentItems, categories.pendingActivities, categories.mediaAssets, categories.tasks].some(
      (b) => b.conflict.length > 0,
    )

  return {
    brandId: parsed.brand.id,
    brandName: parsed.brand.name,
    brandIsNew: !existingBrand,
    counts: {
      products: parsed.products.length,
      campaigns: parsed.campaigns.length,
      contentItems: parsed.contentItems.length,
      tasks: parsed.tasks.length,
      mediaAssets: parsed.mediaAssets.length,
      pendingActivities: parsed.pendingActivities.length,
    },
    missingInformation: Array.isArray((parsed.brand.fields as any).missingInformation) ? ((parsed.brand.fields as any).missingInformation as string[]) : [],
    validatorWarnings: validation.warnings,
    categories,
    hasConflicts,
  }
}
