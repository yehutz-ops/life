import { DomainId } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset, TaskDraft } from '../brandTypes'

// פרסר גנרי לחבילת "brand_knowledge_package" (schema_version "1.0") — לא ייעודי ל-FOMOWA.
// כל שדה שאינו נדרש לסינון/תצוגה/קישור נשמר כמות שהוא תחת `fields`, כך שהמבנה עובד
// באותה צורה לכל מותג עתידי שמיוצא באותה סכימה, בלי שינוי קוד.

export interface ParsedBrandBundle {
  brand: Omit<Brand, 'createdAt' | 'updatedAt' | 'lastImportedAt'>
  products: Omit<BrandProduct, 'createdAt' | 'updatedAt' | 'lastImportedAt'>[]
  campaigns: Omit<BrandCampaign, 'createdAt' | 'updatedAt' | 'lastImportedAt'>[]
  contentItems: Omit<BrandContentItem, 'createdAt' | 'updatedAt' | 'lastImportedAt'>[]
  pendingActivities: Omit<BrandPendingActivity, 'createdAt' | 'updatedAt' | 'lastImportedAt'>[]
  mediaAssets: Omit<BrandMediaAsset, 'createdAt' | 'updatedAt' | 'lastImportedAt'>[]
  tasks: TaskDraft[]
  schemaVersion?: string
}

function fileTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  return ext
}

export function parseBrandPackage(raw: any): ParsedBrandBundle {
  if (!raw || typeof raw !== 'object') throw new Error('הקובץ אינו אובייקט JSON תקין')
  const b = raw.brand
  if (!b || !b.id || !b.name) throw new Error('חסר אובייקט brand תקין (עם id ו-name) בקובץ')

  const brand: ParsedBrandBundle['brand'] = {
    id: b.id,
    name: b.name,
    domain: 'work' as DomainId,
    sourceSchemaVersion: raw.schema_version,
    fields: {
      ...b,
      marketingStrategy: raw.marketing_strategy ?? null,
      weeklyPlan: raw.weekly_plan ?? null,
      kpiReview: raw.kpi_review ?? null,
      instagramComposio: raw.instagram_composio ?? null,
      standingRules: raw.standing_rules ?? [],
      missingInformation: raw.missing_information ?? [],
    },
  }

  const products: ParsedBrandBundle['products'] = (raw.products ?? []).map((p: any) => ({
    id: p.id,
    brandId: brand.id,
    name: p.name ?? p.name_en_exact ?? p.id,
    fields: p,
  }))

  const campaigns: ParsedBrandBundle['campaigns'] = (raw.campaigns ?? []).map((c: any) => ({
    id: c.id,
    brandId: brand.id,
    name: c.name ?? c.id,
    startDate: c.start_date ?? undefined,
    endDate: c.end_date ?? undefined,
    fields: c,
  }))

  const contentItems: ParsedBrandBundle['contentItems'] = (raw.content_items ?? []).map((ci: any) => ({
    id: ci.id,
    brandId: brand.id,
    productIds: Array.isArray(ci.product_ids) ? ci.product_ids : [],
    campaignId: ci.campaign_id ?? undefined,
    title: ci.product_or_topic || ci.idea || ci.format || ci.id,
    date: ci.date ?? undefined,
    time: ci.time ?? undefined,
    platform: ci.platform ?? undefined,
    format: ci.format ?? undefined,
    priority: ci.priority ?? undefined,
    status: ci.status ?? 'unknown',
    published: !!ci.published,
    awaitingApproval: !!ci.awaiting_approval,
    fields: ci,
  }))

  const pendingActivities: ParsedBrandBundle['pendingActivities'] = (raw.pending_activities ?? []).map((a: any) => ({
    id: a.id,
    brandId: brand.id,
    description: a.description ?? a.id,
    fields: a,
  }))

  const mediaAssets: ParsedBrandBundle['mediaAssets'] = []
  const ma = raw.media_assets
  if (ma) {
    for (const folder of ma.folders ?? []) {
      for (const file of folder.key_files ?? []) {
        mediaAssets.push({
          id: file.id,
          brandId: brand.id,
          fileName: file.name,
          fileType: fileTypeFromName(file.name),
          relatedProductId: folder.product_id ?? undefined,
          originalFolder: folder.path,
          description: file.note ?? undefined,
          availabilityStatus: 'נדרשת בחירת מיקום מדיה קבוע',
          originalPath: `${folder.path}${file.name}`,
        })
      }
    }
    for (const file of ma.root_files ?? []) {
      mediaAssets.push({
        id: file.id,
        brandId: brand.id,
        fileName: file.name,
        fileType: fileTypeFromName(file.name),
        originalFolder: '',
        description: file.note ?? undefined,
        availabilityStatus: 'נדרשת בחירת מיקום מדיה קבוע',
        originalPath: file.name,
      })
    }
  }

  // משימות בפועל = open_tasks בלבד (מקור המידע היחיד לפעולות לביצוע).
  // פריטי תוכן ופעילויות ממתינות אינם הופכים למשימה כפולה — הם נשארים ישות נפרדת
  // ומוצגים במקומות הרלוונטיים (לוח תוכן / מחכה לאישור) ללא עותק ב-Items.
  const tasks: TaskDraft[] = (raw.open_tasks ?? []).map((t: any) => ({
    id: t.id,
    title: t.description ?? t.id,
    contentItemId: t.related_content_item_id ?? undefined,
  }))

  return { brand, products, campaigns, contentItems, pendingActivities, mediaAssets, tasks, schemaVersion: raw.schema_version }
}
