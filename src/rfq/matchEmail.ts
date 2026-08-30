import { Shipment } from '../data/shipmentTypes'
import { Forwarder } from '../data/shipmentTypes'
import { RfqDispatch, MatchMethod } from '../data/rfqTypes'
import { findRfqReference } from './rfqReference'

// זיהוי "האם המייל הנכנס הוא תשובה ל-RFQ שלנו".
//
// הזיהוי דטרמיניסטי בלבד — לפי מזהי שרשור, מזהה RFQ וכתובת שולח. במכוון *לא* משתמשים
// ב-AI כדי לנחש שיוך לפי תוכן: מייל ששויך בטעות ל-RFQ הלא נכון גורם נזק שקט וקשה לגילוי.
// כשאין התאמה ודאית — המייל מוצג כ"נדרשת התאמה" והמשתמש מכריע.

export interface IncomingEmailHeader {
  from: string
  fromAddress?: string
  subject: string
  text: string
  messageId?: string
  inReplyTo?: string
  references?: string[]
}

export interface MatchResult {
  shipmentId?: string
  forwarderId?: string
  method?: MatchMethod
  confidence: number
  reason: string
  // מועמד יחיד כשלא הגענו לוודאות — משמש כהצעה במסך "נדרשת התאמה".
  suggestedShipmentId?: string
}

// מעל הסף — שיוך אוטומטי. מתחתיו — תמיד הכרעה ידנית.
export const AUTO_LINK_THRESHOLD = 0.7

function normalizeEmail(value?: string): string {
  return (value ?? '').trim().toLowerCase()
}

// RFQ נחשב "פתוח לתשובות" כל עוד לא נבחרה הצעה והמשלוח לא יצא לדרך.
function isOpenForQuotes(s: Shipment): boolean {
  return s.status === 'waiting_for_quotes' || s.status === 'quotes_received' || s.status === 'preparing'
}

export function matchEmailToRfq(
  email: IncomingEmailHeader,
  shipments: Shipment[],
  dispatches: RfqDispatch[],
  forwarders: Forwarder[],
): MatchResult {
  // 1. שרשור: התשובה מפנה ל-Message-ID של מייל יוצא ששלחנו. הסימן החזק ביותר.
  const threadIds = new Set([email.inReplyTo, ...(email.references ?? [])].filter(Boolean) as string[])
  if (threadIds.size > 0) {
    const hit = dispatches.find((d) => d.messageId && threadIds.has(d.messageId))
    if (hit) {
      return {
        shipmentId: hit.shipmentId,
        forwarderId: hit.forwarderId,
        method: 'thread',
        confidence: 0.99,
        reason: `תשובה באותו שרשור של המייל שנשלח ל${hit.forwarderName}`,
      }
    }
  }

  // 2. מזהה ה-RFQ בנושא או בגוף המייל.
  const reference = findRfqReference(email.subject) ?? findRfqReference(email.text)
  if (reference) {
    const shipment = shipments.find((s) => s.rfqReference?.toUpperCase() === reference)
    if (shipment) {
      // מנסים לצמצם גם לסוכנות, לפי כתובת השולח.
      const sender = normalizeEmail(email.fromAddress ?? email.from)
      const forwarder = forwarders.find((f) => f.email && sender.includes(normalizeEmail(f.email)))
      return {
        shipmentId: shipment.id,
        forwarderId: forwarder?.id,
        method: 'reference',
        confidence: forwarder ? 0.95 : 0.85,
        reason: `מזהה ${reference} נמצא ב${findRfqReference(email.subject) ? 'נושא המייל' : 'גוף המייל'}`,
      }
    }
  }

  // 3. כתובת השולח מול סוכנות שאליה נשלח RFQ פתוח.
  const sender = normalizeEmail(email.fromAddress ?? email.from)
  const forwarder = forwarders.find((f) => f.email && sender.includes(normalizeEmail(f.email)))
  if (forwarder) {
    const openShipmentIds = new Set(shipments.filter(isOpenForQuotes).map((s) => s.id))
    const candidates = dispatches.filter((d) => d.forwarderId === forwarder.id && openShipmentIds.has(d.shipmentId))
    const uniqueShipmentIds = [...new Set(candidates.map((d) => d.shipmentId))]

    if (uniqueShipmentIds.length === 1) {
      return {
        shipmentId: uniqueShipmentIds[0],
        forwarderId: forwarder.id,
        method: 'sender',
        confidence: 0.75,
        reason: `${forwarder.name} היא הסוכנות היחידה עם בקשה פתוחה אחת`,
      }
    }
    if (uniqueShipmentIds.length > 1) {
      // הסוכנות מוכרת, אבל יש לה כמה בקשות פתוחות — אסור לנחש לאיזו התשובה שייכת.
      return {
        confidence: 0.4,
        reason: `${forwarder.name} מוכרת, אך יש לה ${uniqueShipmentIds.length} בקשות פתוחות — לא ניתן לקבוע לאיזו`,
        forwarderId: forwarder.id,
        suggestedShipmentId: uniqueShipmentIds[0],
      }
    }
  }

  return { confidence: 0, reason: 'לא זוהה קשר לבקשת הצעת מחיר קיימת' }
}
