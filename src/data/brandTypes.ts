import { DomainId } from './types'

// מודל מותגים כללי — משותף לכל מותג עתידי (FOMOWA, וכל מותג נוסף), לא ייעודי למותג ספציפי.
// כל ישות שומרת שדות-ליבה קבועים לצורך סינון/תצוגה/קישור, ואת שאר השדות המקוריים מה-JSON
// תחת `fields` — כך שהמבנה נשאר גמיש לחבילות ייבוא עתידיות בלי לדרוש שינוי קוד לכל שדה חדש.

export interface Brand {
  id: string
  name: string
  domain: DomainId // תמיד 'work' כרגע, אך נשמר במפורש לעתיד
  fields: Record<string, unknown> // brand + marketing_strategy מה-JSON, כפי שהם
  sourceSchemaVersion?: string
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

export interface BrandProduct {
  id: string
  brandId: string
  name: string
  fields: Record<string, unknown>
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

export interface BrandCampaign {
  id: string
  brandId: string
  name: string
  startDate?: string
  endDate?: string
  fields: Record<string, unknown>
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

export interface BrandContentItem {
  id: string
  brandId: string
  productIds: string[]
  campaignId?: string
  title: string // לתצוגה — נגזר מ-idea/product_or_topic
  date?: string
  time?: string
  platform?: string
  format?: string
  priority?: string
  status: string // כפי שדווח במקור — 'unknown' / 'published' / 'prepared_awaiting_approval' / 'requires_new_shoot' וכו'
  published: boolean
  awaitingApproval: boolean
  fields: Record<string, unknown>
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

export interface BrandPendingActivity {
  id: string
  brandId: string
  description: string
  fields: Record<string, unknown>
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

export interface BrandMediaAsset {
  id: string
  brandId: string
  fileName: string
  fileType?: string
  relatedProductId?: string
  originalFolder?: string
  description?: string
  availabilityStatus: string // ברירת מחדל: "נדרשת בחירת מיקום מדיה קבוע"
  originalPath?: string // למידע בלבד — לא תלות קבועה בנתיב Desktop
  createdAt: string
  updatedAt: string
  lastImportedAt: string
}

// אנשי קשר אצל מותג/ספק — לשימוש גם באזור מותגים וגם במסך משלוחים (Brand מייצג שניהם).
export interface BrandContact {
  id: string
  brandId: string
  name: string
  role?: string
  email?: string
  phone?: string
  whatsapp?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type BrandDocCategory =
  | 'sds_msds'
  | 'dangerous_goods'
  | 'regulatory'
  | 'certificates'
  | 'invoices'
  | 'packing_lists'
  | 'agreements'
  | 'product_documents'
  | 'other'

// תיקיית מסמכים עסקיים/רגולטוריים של המותג — נפרד מ-BrandMediaAsset (שהוא מניפסט מדיה
// יצירתית שמגיע מייבוא). כרגע רק קישור/שם, בלי אחסון קבצים אמיתי.
export interface BrandDocument {
  id: string
  brandId: string
  category: BrandDocCategory
  name: string
  url?: string
  relatedProductId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface BrandBundle {
  brand: Brand
  products: BrandProduct[]
  campaigns: BrandCampaign[]
  contentItems: BrandContentItem[]
  pendingActivities: BrandPendingActivity[]
  mediaAssets: BrandMediaAsset[]
  tasks: TaskDraft[]
}

// משימה שתיכנס לטבלת ה-Items הקיימת — לא ישות חדשה, רק "כוונה" ליצירה/עדכון של Item.
export interface TaskDraft {
  id: string
  title: string
  contentItemId?: string
}
