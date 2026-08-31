import { QuoteSourceEmail } from './rfqTypes'

// שכבת הכספים של משלוח: חשבוניות, תשלומים ומע"מ.
// נפרד מ-shipmentTypes כדי לא לנפח אותו, אך שייך לאותו עולם: כל רשומה כאן תלויה ב-Shipment.

export type InvoiceKind = 'supplier' | 'freight' | 'customs' | 'other'

export const INVOICE_KIND_LABEL: Record<InvoiceKind, string> = {
  supplier: 'ספק',
  freight: 'שילוח',
  customs: 'עמילות ומכס',
  other: 'אחר',
}

// 'expected' = אנחנו יודעים שחשבונית אמורה להגיע אך היא טרם התקבלה — זה מה שמאפשר
// להציג "חשבונית חסרה" בלי לנחש.
export type InvoiceStatus = 'expected' | 'received' | 'approved' | 'paid'

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  expected: 'חסרה חשבונית',
  received: 'התקבלה',
  approved: 'ממתינה לתשלום',
  paid: 'שולם',
}

export interface ShipmentInvoice {
  id: string
  shipmentId: string
  forwarderId?: string
  issuerName: string
  kind: InvoiceKind
  invoiceNumber?: string
  amount?: number
  currency?: string
  invoiceDate?: string
  dueDate?: string
  status: InvoiceStatus
  // הפניה למייל שממנו נקלטה החשבונית — לא עותק שלו.
  sourceEmail?: QuoteSourceEmail
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ShipmentPayment {
  id: string
  shipmentId: string
  invoiceId?: string
  amount: number
  currency?: string
  paidAt: string
  method?: string
  reference?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

// ממה נספרים ימי האשראי. לכל סוכנות ברירת מחדל, וניתן לדרוס ברמת המשלוח.
export type PaymentTermsBasis = 'invoice' | 'departure' | 'arrival' | 'release'

export const PAYMENT_BASIS_LABEL: Record<PaymentTermsBasis, string> = {
  invoice: 'מתאריך החשבונית',
  departure: 'מיציאת המשלוח',
  arrival: 'מהגעת המשלוח',
  release: 'משחרור מהמכס',
}
