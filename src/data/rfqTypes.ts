// מודל ה-RFQ: הרחבה מינימלית מעל Shipment/Forwarder/ShipmentQuote הקיימים.
//
// עקרון מקור אמת יחיד:
//   Shipment (RFQ) → RfqDispatch (למי נשלח) → ShipmentQuote (גרסאות הצעה) → Timeline
// Gmail נשאר מקור המיילים. אנחנו שומרים רק *הפניה* למייל (uid/messageId/threadId) ואת המידע
// שחולץ ממנו — לעולם לא עותק של המייל עצמו.

export type TransportMode = 'air' | 'sea' | 'road' | 'other'

// מצב הכללה של רכיב עלות/שירות בהצעה. 'unclear' = ההצעה לא אמרה, ואסור לנחש.
export type InclusionState = 'included' | 'excluded' | 'unclear'

export type DispatchStatus =
  | 'not_sent'
  | 'sent'
  | 'waiting'
  | 'replied'
  | 'incomplete'
  | 'revised'
  | 'selected'
  | 'rejected'
  | 'failed'

export const DISPATCH_STATUS_LABEL: Record<DispatchStatus, string> = {
  not_sent: 'טרם נשלח',
  sent: 'נשלח',
  waiting: 'ממתינה',
  replied: 'הצעה התקבלה',
  incomplete: 'חסר מידע',
  revised: 'הצעה מעודכנת',
  selected: 'נבחרה',
  rejected: 'נדחתה',
  failed: 'שליחה נכשלה',
}

// רשומת שליחה אחת: RFQ אחד → סוכנות אחת. לעולם לא CC משותף, ולכן רשומה נפרדת לכל נמען.
export interface RfqDispatch {
  id: string
  shipmentId: string
  forwarderId: string
  forwarderName: string
  recipientEmail: string
  subject: string
  rfqReference: string
  sentAt?: string
  status: DispatchStatus
  // מזהי Gmail של המייל היוצא, כשזמינים — משמשים לזיהוי תשובות באותו thread.
  messageId?: string
  threadId?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

// הפניה למייל המקורי ב-Gmail. אין כאן גוף מייל — רק מה שדרוש כדי למצוא ולהציג אותו.
export interface QuoteSourceEmail {
  account: 'work' | 'personal'
  uid: number
  messageId?: string
  inReplyTo?: string
  from: string
  fromAddress?: string
  subject: string
  receivedAt: string
}

// איך המייל שויך ל-RFQ — נשמר כדי שאפשר יהיה להסביר למשתמש ולא רק "האמן לי".
export type MatchMethod = 'thread' | 'reference' | 'sender' | 'manual'

export const MATCH_METHOD_LABEL: Record<MatchMethod, string> = {
  thread: 'זוהה לפי שרשור המייל',
  reference: 'זוהה לפי מספר ה-RFQ בנושא',
  sender: 'זוהה לפי כתובת השולח',
  manual: 'שויך ידנית',
}

// מקור + רמת ביטחון לכל שדה שחולץ. conflict=true כשהמקורות סותרים זה את זה.
export interface QuoteFieldMeta {
  source?: string
  confidence?: number
  conflict?: boolean
}

// המבנה האחיד שאליו כל הצעה מחולצת. כל שדה אופציונלי במכוון: מידע חסר הוא תוצאה
// לגיטימית (null/undefined) ולא כשל — אסור לנחש.
export interface QuoteExtraction {
  transportMode?: TransportMode
  totalPrice?: number
  currency?: string
  pickupIncluded?: InclusionState
  originChargesIncluded?: InclusionState
  destinationChargesIncluded?: InclusionState
  customsIncluded?: InclusionState
  dgIncluded?: InclusionState
  chargeableWeight?: number
  cartons?: number
  pallets?: number
  volume?: number
  transitTimeMin?: number
  transitTimeMax?: number
  departureDate?: string
  validityDate?: string
  carrier?: string
  route?: string
  notes?: string
  additionalCharges?: string[]
  exclusions?: string[]
}

// מייל שנקלט אך לא ניתן היה לשייך ל-RFQ ברמת ביטחון מספקת. מוצג כ"נדרשת התאמה" —
// המערכת לא מנחשת. גם כאן נשמרת רק הפניה + תקציר קצר לתצוגה.
export interface RfqUnmatchedEmail {
  id: string
  sourceEmail: QuoteSourceEmail
  preview: string
  suggestedShipmentId?: string
  suggestedReason?: string
  dismissed?: boolean
  createdAt: string
}

// השדות שנחשבים חיוניים להשוואה הוגנת. חוסר בהם מסמן את ההצעה כ"נדרשת השלמה".
export const REQUIRED_QUOTE_FIELDS = [
  'totalPrice',
  'currency',
  'transitTimeMax',
  'pickupIncluded',
  'originChargesIncluded',
  'dgIncluded',
] as const

export const QUOTE_FIELD_LABEL: Record<string, string> = {
  transportMode: 'סוג הובלה',
  totalPrice: 'מחיר כולל',
  currency: 'מטבע',
  pickupIncluded: 'איסוף כלול',
  originChargesIncluded: 'עלויות מוצא',
  destinationChargesIncluded: 'עלויות יעד',
  customsIncluded: 'עמילות מכס',
  dgIncluded: 'חומרים מסוכנים (DG)',
  chargeableWeight: 'משקל חיוב',
  cartons: 'קרטונים',
  pallets: 'משטחים',
  volume: 'נפח',
  transitTimeMin: 'זמן מעבר מינימלי',
  transitTimeMax: 'זמן מעבר מקסימלי',
  departureDate: 'תאריך יציאה',
  validityDate: 'תוקף ההצעה',
  carrier: 'מוביל',
  route: 'מסלול',
}

export const TRANSPORT_MODE_LABEL: Record<TransportMode, string> = {
  air: 'אווירי',
  sea: 'ימי',
  road: 'יבשתי',
  other: 'אחר',
}

export const INCLUSION_LABEL: Record<InclusionState, string> = {
  included: 'כן',
  excluded: 'לא',
  unclear: 'לא צוין',
}
