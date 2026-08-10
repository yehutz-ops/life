export type InfluencerStatus = 'active' | 'paused' | 'finished'

// חוזה נוכחי בלבד — לא נשמרת היסטוריית חוזים/גרסאות, רק המצב העדכני.
export interface InfluencerAgreement {
  monthlyPayment?: number
  monthlyProductBudget?: number
  startDate?: string
  endDate?: string
  reelsRequired?: number
  tiktoksRequired?: number
  storiesRequired?: number
  postsRequired?: number
  couponCode?: string
  discountPercentage?: number
  commissionPercentage?: number
  notes?: string
}

export interface Influencer {
  id: string
  name: string
  photoUrl?: string
  instagramHandle?: string
  tiktokHandle?: string
  followers?: number
  contentNiche?: string
  status: InfluencerStatus
  startDateWithUs?: string
  // פרטים אישיים — לא מוצגים בדשבורד הכללי, רק בעמוד המשפיען
  phone?: string
  email?: string
  shippingAddress?: string
  internalNotes?: string
  agreement?: InfluencerAgreement
  createdAt: string
  updatedAt: string
}

export type ProductShipReason = 'gift' | 'monthly_collaboration' | 'content_creation' | 'campaign' | 'other'

export interface InfluencerProduct {
  id: string
  influencerId: string
  dateSent: string
  brand?: string
  product: string
  quantity: number
  retailValue?: number
  actualBusinessCost?: number
  reason: ProductShipReason
  shipmentStatus?: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ContentPlatform = 'instagram' | 'tiktok' | 'other'
export type ContentType = 'reel' | 'story' | 'post' | 'tiktok' | 'other'
export type ContentStatus = 'planned' | 'waiting' | 'submitted' | 'approved' | 'published' | 'late' | 'cancelled'

export interface InfluencerContent {
  id: string
  influencerId: string
  platform: ContentPlatform
  contentType: ContentType
  brand?: string
  product?: string
  campaignId?: string
  dueDate?: string
  publishDate?: string
  contentUrl?: string
  status: ContentStatus
  views?: number
  reach?: number
  likes?: number
  comments?: number
  shares?: number
  saves?: number
  createdAt: string
  updatedAt: string
}

export interface InfluencerProductSale {
  product: string
  unitsSold: number
  revenue: number
}

// רשומה אחת לכל משפיען לכל חודש (month בפורמט 'YYYY-MM')
export interface InfluencerSale {
  id: string
  influencerId: string
  month: string
  couponUses?: number
  orders?: number
  unitsSold?: number
  revenue?: number
  // עלויות קמפיין נוספות מעבר לתשלום החודשי ולעלות המוצרים — למשל בוסט בתשלום לפוסט של המשפיען.
  additionalCampaignCosts?: number
  productSales?: InfluencerProductSale[]
  createdAt: string
  updatedAt: string
}
