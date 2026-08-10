// שכבת הנתונים של סטודיו התוכן (קידום מותגים) — ראו contentProviders.ts לשכבת ה-Provider
// שתאפשר בעתיד לחבר כלי יצירה/פרסום/אנליטיקה אמיתיים בלי לשנות את המבנה כאן.

export type MediaAssetCategory = 'raw_media' | 'brand_asset' | 'inspiration' | 'previous_content'

export interface MediaAsset {
  id: string
  brandId: string
  category: MediaAssetCategory
  name: string
  url?: string
  productId?: string
  // שדות ייעודיים ל-Inspiration/References
  source?: string
  whyILike?: string
  tags?: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export type IdeaStatus = 'idea' | 'use_soon' | 'planned' | 'produced' | 'published' | 'archive'

export interface IdeaBankItem {
  id: string
  title: string
  description?: string
  brandId?: string
  productId?: string
  platform?: string
  format?: string
  referenceUrl?: string
  status: IdeaStatus
  priority?: 'high' | 'medium' | 'low'
  createdAt: string
  updatedAt: string
}

export type ContentPieceType = 'reel' | 'story' | 'post' | 'carousel' | 'tiktok' | 'other'
export type ContentPieceStatus =
  | 'idea'
  | 'draft'
  | 'ready'
  | 'needs_filming'
  | 'needs_editing'
  | 'waiting_approval'
  | 'approved'
  | 'scheduled'
  | 'published'

// פיסת תוכן אחת — מכסה גם את "התוכן להיום" וגם את לוח השנה, כדי לא לכפול נתונים: אותה רשומה
// מסוננת לפי תאריך/סטטוס בכל מסך. campaignId מקשר לקמפיין ממומן אם רלוונטי (ראו campaignTypes.ts).
export interface ContentPiece {
  id: string
  brandId: string
  productId?: string
  campaignId?: string
  ideaBankItemId?: string
  platform: string
  contentType: ContentPieceType
  creativeIdea?: string
  copy?: string
  assetsRequired?: string
  status: ContentPieceStatus
  dueDate?: string
  scheduledDate?: string
  publishDate?: string
  approvalNotes?: string
  // ביצועים לאחר פרסום — אותם שדות בדיוק כמו InfluencerContent, לצורך אחידות בשכבת האנליטיקה.
  views?: number
  reach?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  watchTime?: number
  followersGained?: number
  createdAt: string
  updatedAt: string
}

export type VideoDifficulty = 'easy' | 'medium' | 'advanced'

export interface VideoShot {
  what: string
  angle?: string
  framing?: string
  movement?: string
}

export interface VideoScript {
  id: string
  brandId: string
  productId?: string
  goal?: string
  platform?: string
  concept?: string
  hook?: string
  script?: string
  shotList?: VideoShot[]
  peopleNeeded?: string
  propsNeeded?: string
  location?: string
  editingInstructions?: string
  captionIdea?: string
  cta?: string
  difficulty?: VideoDifficulty
  contentPieceId?: string
  createdAt: string
  updatedAt: string
}

export type ContentRuleType = 'tone' | 'words_to_avoid' | 'claims' | 'price_rules' | 'promotion_rules' | 'visual_rules' | 'other'

export interface ContentRule {
  id: string
  brandId: string
  ruleType: ContentRuleType
  text: string
  createdAt: string
  updatedAt: string
}

// יעדי קידום שבועיים למותג — "הושלם/נותר" מחושבים באופן חי מתוך ContentPiece, לא נשמרים כאן.
export interface PromotionPlan {
  id: string
  brandId: string
  priority: 'high' | 'medium' | 'low'
  weeklyReels?: number
  weeklyStories?: number
  weeklyCarousels?: number
  weeklyPosts?: number
  weeklyTiktoks?: number
  notes?: string
  createdAt: string
  updatedAt: string
}
