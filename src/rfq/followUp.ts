import { ShipmentQuote } from '../data/shipmentTypes'
import { Shipment } from '../data/shipmentTypes'
import { QUOTE_FIELD_LABEL, REQUIRED_QUOTE_FIELDS } from '../data/rfqTypes'

// "בקש השלמה": מנסח תשובה באנגלית ששואלת בדיוק על מה שחסר, ושומר אותה כטיוטה ב-Gmail.
// לעולם לא נשלח מייל מכאן — המשתמש פותח את הטיוטה, בודק ושולח בעצמו.

export class FollowUpError extends Error {}

// שאלה מפורשת לכל שדה חסר, במקום בקשה כללית ("please send more details") שלא מקדמת כלום.
const QUESTION: Record<string, string> = {
  totalPrice: 'Could you confirm the all-in total price for this shipment?',
  currency: 'In which currency is the quotation given?',
  transitTimeMax: 'What is the expected transit time (in days)?',
  pickupIncluded: 'Is pickup at origin included in the quoted price?',
  originChargesIncluded: 'Are origin handling charges included?',
  destinationChargesIncluded: 'Are destination charges included?',
  customsIncluded: 'Is customs clearance included?',
  dgIncluded: 'The shipment contains dangerous goods — is DG handling included in the price?',
}

export function buildFollowUpDraft(shipment: Shipment, quote: ShipmentQuote, missingFieldKeys: string[]): { subject: string; body: string } {
  const reference = shipment.rfqReference ?? shipment.name ?? 'our request'
  const questions = missingFieldKeys
    .map((key) => QUESTION[key] ?? `Could you clarify: ${QUOTE_FIELD_LABEL[key] ?? key}?`)
    .map((q, i) => `${i + 1}. ${q}`)

  const body = [
    'Hello,',
    '',
    `Thank you for your quotation for ${reference}.`,
    'Before we can compare it properly, we are missing a few details:',
    '',
    ...questions,
    '',
    'Could you please confirm these points at your earliest convenience?',
    '',
    'Thank you and best regards,',
  ].join('\n')

  const subject = quote.sourceEmail?.subject?.toLowerCase().startsWith('re:')
    ? quote.sourceEmail.subject
    : `RE: ${quote.sourceEmail?.subject ?? `[${reference}] Request for quotation`}`

  return { subject, body }
}

// מפתחות השדות החסרים (ולא התוויות בעברית) — נדרש כדי לבחור את השאלה הנכונה.
export function missingFieldKeys(quote: ShipmentQuote): string[] {
  const e = quote.extraction
  return REQUIRED_QUOTE_FIELDS.filter((key) => {
    const v = e ? (e as Record<string, unknown>)[key] : undefined
    const fallback = key === 'totalPrice' ? quote.price : key === 'currency' ? quote.currency : undefined
    const value = v ?? fallback
    return value === undefined || value === null || value === '' || value === 'unclear'
  })
}

export async function saveFollowUpDraft(to: string, subject: string, body: string, inReplyTo?: string): Promise<string> {
  let res: Response
  try {
    res = await fetch('/api/email/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body, inReplyTo, references: inReplyTo ? [inReplyTo] : undefined }),
    })
  } catch {
    throw new FollowUpError('אין חיבור לשרת כרגע.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new FollowUpError(data?.message ?? 'שמירת הטיוטה נכשלה.')
  }
  const data = await res.json()
  return data.folder as string
}
