import { QuoteExtraction, QuoteFieldMeta, QuoteSourceEmail, MatchMethod } from './rfqTypes'

export type ShipmentStatus =
  | 'preparing'
  | 'waiting_for_quotes'
  | 'quotes_received'
  | 'waiting_for_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'customs'
  | 'delivered'
  | 'missing_documents'
  | 'issue'

export type ShippingMode = 'air' | 'sea' | 'other'

export interface Shipment {
  id: string
  brandId?: string
  // מזהה RFQ ייחודי וקריא (לדוגמה RFQ-2026-014). מופיע בנושא המייל, ב-PDF וברשומה עצמה,
  // ומשמש לזיהוי תשובות חוזרות. אופציונלי כדי שמשלוחים שנוצרו לפני כן ימשיכו לעבוד.
  rfqReference?: string
  name?: string // כותרת/שם למשלוח, לדוגמה לבקשת הצעת מחיר
  supplierName?: string // טקסט חופשי כשאין עדיין רשומת מותג/ספק מקושרת
  originCountry?: string
  originCity?: string
  shippingMode?: ShippingMode
  pickupAddress?: string
  destination?: string
  contactPerson?: string
  contactEmail?: string
  contactPhone?: string
  cartons?: number
  weight?: number
  dimensions?: string
  onPallet?: boolean
  palletCount?: number
  goodsType?: string
  isDangerousGoods?: boolean
  shipmentValue?: number
  currency?: string
  requestedPickupDate?: string
  departureDate?: string
  eta?: string
  selectedForwarderId?: string
  trackingNumber?: string
  status: ShipmentStatus
  notes?: string
  requestedForwarderIds?: string[] // חברות שילוח שנבחרו לבקשת הצעת מחיר
  createdAt: string
  updatedAt: string
}

export type QuoteStatus = 'pending' | 'recommended' | 'selected' | 'rejected'

export interface ShipmentQuote {
  id: string
  shipmentId: string
  forwarderName: string
  price?: number
  currency?: string
  transitTimeDays?: number
  dateReceived?: string
  notes?: string
  status: QuoteStatus
  createdAt: string
  updatedAt: string
  // --- הרחבת RFQ (הכל אופציונלי; הצעות שהוזנו ידנית ממשיכות לעבוד בלי השדות האלה) ---
  forwarderId?: string
  // כל תשובה של סוכנות היא רשומה נפרדת. גרסה חדשה לא דורסת קודמת: v1, v2, v3...
  // isCurrent מסמן את הגרסה האחרונה של אותה סוכנות באותו RFQ.
  version?: number
  isCurrent?: boolean
  extraction?: QuoteExtraction
  fieldMeta?: Record<string, QuoteFieldMeta>
  sourceEmail?: QuoteSourceEmail
  matchMethod?: MatchMethod
  matchConfidence?: number
  extractedAt?: string
}

export type ShipmentDocCategory = 'invoice' | 'packing_list' | 'msds_sds' | 'awb' | 'dangerous_goods' | 'customs' | 'other'

export interface ShipmentDocument {
  id: string
  shipmentId: string
  category: ShipmentDocCategory
  name: string
  url?: string
  // קובץ מצורף מקומית (נשמר כ-Blob ישירות ב-IndexedDB, בלי שרת/אחסון חיצוני).
  fileName?: string
  fileType?: string
  fileSize?: number
  fileData?: Blob
  notes?: string
  createdAt: string
  updatedAt: string
}

export type ShipmentTimelineStage =
  | 'rfq_created'
  | 'rfq_pdf_generated'
  | 'rfq_sent'
  | 'quote_received'
  | 'quote_revised'
  | 'followup_requested'
  | 'quote_selected'
  | 'pickup_booked'
  | 'collected'
  | 'tracking_update'
  | 'customs'
  | 'delivered'

export interface ShipmentTimelineEvent {
  id: string
  shipmentId: string
  stage: ShipmentTimelineStage
  date: string
  notes?: string
  createdAt: string
}

// רשימת חברות השילוח שאליהן אפשר לשלוח בקשת הצעת מחיר (RFQ). כרגע רק רשימה — שליחה בפועל
// דרך מייל העבודה היא אינטגרציה עתידית, ראו src/data/contentProviders.ts לתבנית ה-Provider.
export interface Forwarder {
  id: string
  name: string
  contactPerson?: string
  email?: string
  phone?: string
  active?: boolean // undefined/true = פעיל, false בלבד = לא פעיל (כך רשומות ישנות ממשיכות להיחשב פעילות)
  notes?: string
  createdAt: string
  updatedAt: string
}
