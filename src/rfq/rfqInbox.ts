import { ShipmentQuote } from '../data/shipmentTypes'
import { RfqDispatch, RfqUnmatchedEmail } from '../data/rfqTypes'
import { missingRequiredFields, currentQuotes } from './quoteComparison'

// "דואר נכנס / התראות" של ה-RFQ. נגזר לחלוטין מהנתונים הקיימים (הצעות, שליחות, מיילים
// שלא שויכו) — אין ישות התראה שנשמרת, ולכן אין מה שיתיישן או ייסתר עם המציאות.

export type RfqInboxKind = 'new_quote' | 'revised_quote' | 'incomplete_quote' | 'no_reply' | 'needs_match'

export interface RfqInboxEntry {
  id: string
  kind: RfqInboxKind
  agencyName: string
  title: string
  amount?: string
  at?: string
  quoteId?: string
  unmatchedId?: string
  tone: 'new' | 'attention'
}

const KIND_TITLE: Record<RfqInboxKind, string> = {
  new_quote: 'התקבלה הצעה חדשה',
  revised_quote: 'הצעה מעודכנת',
  incomplete_quote: 'נדרשת השלמה',
  no_reply: 'טרם התקבלה תשובה',
  needs_match: 'נדרשת התאמה',
}

function money(q: ShipmentQuote): string | undefined {
  const price = q.extraction?.totalPrice ?? q.price
  if (price == null) return undefined
  const currency = q.extraction?.currency ?? q.currency ?? ''
  return `${currency} ${price.toLocaleString('he-IL')}`.trim()
}

export function buildRfqInbox(
  shipmentId: string,
  quotes: ShipmentQuote[],
  dispatches: RfqDispatch[],
  unmatched: RfqUnmatchedEmail[],
): RfqInboxEntry[] {
  const entries: RfqInboxEntry[] = []

  for (const q of currentQuotes(quotes, shipmentId)) {
    const missing = missingRequiredFields(q)
    const isRevision = (q.version ?? 1) > 1
    const kind: RfqInboxKind = missing.length > 0 ? 'incomplete_quote' : isRevision ? 'revised_quote' : 'new_quote'
    entries.push({
      id: `quote-${q.id}`,
      kind,
      agencyName: q.forwarderName,
      title: missing.length > 0 ? `${KIND_TITLE[kind]}: ${missing.slice(0, 2).join(', ')}` : KIND_TITLE[kind],
      amount: money(q),
      at: q.sourceEmail?.receivedAt ?? q.dateReceived,
      quoteId: q.id,
      tone: kind === 'incomplete_quote' ? 'attention' : 'new',
    })
  }

  // סוכנויות שהמייל אליהן נשלח אך טרם ענו.
  for (const d of dispatches.filter((d) => d.shipmentId === shipmentId)) {
    if (d.status === 'sent' || d.status === 'waiting') {
      entries.push({
        id: `wait-${d.id}`,
        kind: 'no_reply',
        agencyName: d.forwarderName,
        title: KIND_TITLE.no_reply,
        at: d.sentAt,
        tone: 'attention',
      })
    }
  }

  // מיילים שנקלטו אך לא ניתן היה לשייך בוודאות — מוצגים כדי שהמשתמש יכריע, לא מנוחשים.
  for (const u of unmatched.filter((u) => !u.dismissed)) {
    entries.push({
      id: `unmatched-${u.id}`,
      kind: 'needs_match',
      agencyName: u.sourceEmail.from,
      title: KIND_TITLE.needs_match,
      at: u.sourceEmail.receivedAt,
      unmatchedId: u.id,
      tone: 'attention',
    })
  }

  return entries.sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''))
}
