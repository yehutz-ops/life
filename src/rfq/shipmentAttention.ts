import { Shipment, ShipmentQuote, Forwarder } from '../data/shipmentTypes'
import { RfqDispatch, RfqUnmatchedEmail } from '../data/rfqTypes'
import { ShipmentInvoice, ShipmentPayment } from '../data/shipmentFinanceTypes'
import { missingRequiredFields, currentQuotes } from './quoteComparison'
import { computeDueDate } from './shipmentFinance'

// "דורש טיפול" — נגזר בזמן ריצה מהנתונים הקיימים. אין ישות התראה שנשמרת ולכן אין מה
// שיתיישן; כל פריט מצביע ישירות למקום שבו מטפלים בו.

export type AttentionKind =
  | 'no_reply'
  | 'new_quote'
  | 'quote_incomplete'
  | 'needs_match'
  | 'missing_invoice'
  | 'payment_due'
  | 'shipment_issue'
  | 'missing_documents'

export interface AttentionItem {
  id: string
  kind: AttentionKind
  title: string
  detail: string
  to: string
  severity: 'high' | 'medium' | 'low'
}

const SEVERITY_ORDER: Record<AttentionItem['severity'], number> = { high: 0, medium: 1, low: 2 }

// כמה ימים אחרי השליחה סוכנות שלא ענתה נחשבת "מתעכבת".
const NO_REPLY_DAYS = 3
const PAYMENT_LOOKAHEAD_DAYS = 7

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00').getTime() - new Date(a + 'T00:00:00').getTime()) / 86400000)
}

export function computeAttention(
  shipments: Shipment[],
  quotes: ShipmentQuote[],
  dispatches: RfqDispatch[],
  unmatched: RfqUnmatchedEmail[],
  invoices: ShipmentInvoice[],
  payments: ShipmentPayment[],
  forwarders: Forwarder[],
  todayIso: string,
  limit = 8,
): AttentionItem[] {
  const items: AttentionItem[] = []
  const byId = new Map(shipments.map((s) => [s.id, s]))

  for (const s of shipments) {
    if (s.status === 'delivered') continue
    const ref = s.rfqReference ?? s.name ?? `#${s.id.slice(-6)}`

    if (s.status === 'issue') {
      items.push({ id: `issue-${s.id}`, kind: 'shipment_issue', title: 'תקלה במשלוח', detail: ref, to: `/work/shipments/${s.id}`, severity: 'high' })
    }
    if (s.status === 'missing_documents') {
      items.push({ id: `docs-${s.id}`, kind: 'missing_documents', title: 'חסרים מסמכים', detail: ref, to: `/work/shipments/${s.id}`, severity: 'high' })
    }

    // הצעות שהתקבלו אך חסר בהן מידע חיוני להשוואה.
    for (const q of currentQuotes(quotes, s.id)) {
      const missing = missingRequiredFields(q)
      if (missing.length > 0) {
        items.push({
          id: `incomplete-${q.id}`,
          kind: 'quote_incomplete',
          title: 'הצעה חסרה פרטים',
          detail: `${q.forwarderName} · ${missing.slice(0, 2).join(', ')}`,
          to: `/work/shipments/${s.id}/rfq`,
          severity: 'medium',
        })
      } else if (q.status === 'pending') {
        items.push({
          id: `newquote-${q.id}`,
          kind: 'new_quote',
          title: 'הצעה חדשה להשוואה',
          detail: `${q.forwarderName} · ${ref}`,
          to: `/work/shipments/${s.id}/rfq`,
          severity: 'low',
        })
      }
    }
  }

  // סוכנויות שלא ענו מספיק זמן אחרי השליחה.
  for (const d of dispatches) {
    if (!['sent', 'waiting'].includes(d.status) || !d.sentAt) continue
    const waited = daysBetween(d.sentAt.slice(0, 10), todayIso)
    if (waited < NO_REPLY_DAYS) continue
    const s = byId.get(d.shipmentId)
    if (!s || s.status === 'delivered') continue
    items.push({
      id: `noreply-${d.id}`,
      kind: 'no_reply',
      title: 'סוכנות טרם ענתה',
      detail: `${d.forwarderName} · ${waited} ימים`,
      to: `/work/shipments/${d.shipmentId}/rfq`,
      severity: 'medium',
    })
  }

  // מיילים שנקלטו ולא ניתן היה לשייך בוודאות.
  for (const u of unmatched.filter((u) => !u.dismissed)) {
    items.push({
      id: `match-${u.id}`,
      kind: 'needs_match',
      title: 'מייל דורש התאמה',
      detail: u.sourceEmail.from,
      to: '/work/shipments/quotes',
      severity: 'medium',
    })
  }

  for (const inv of invoices) {
    const s = byId.get(inv.shipmentId)
    if (!s) continue
    const ref = s.rfqReference ?? s.name ?? `#${s.id.slice(-6)}`
    if (inv.status === 'expected') {
      items.push({
        id: `noinv-${inv.id}`,
        kind: 'missing_invoice',
        title: 'חשבונית חסרה',
        detail: `${inv.issuerName} · ${ref}`,
        to: `/work/shipments/${inv.shipmentId}`,
        severity: 'high',
      })
      continue
    }
    if (inv.status === 'paid') continue
    const due = computeDueDate(s, inv, forwarders.find((f) => f.id === inv.forwarderId))
    if (!due) continue
    const daysLeft = daysBetween(todayIso, due)
    if (daysLeft > PAYMENT_LOOKAHEAD_DAYS) continue
    items.push({
      id: `due-${inv.id}`,
      kind: 'payment_due',
      title: daysLeft < 0 ? 'תשלום באיחור' : 'תשלום מתקרב',
      detail: `${inv.issuerName} · ${daysLeft < 0 ? `לפני ${Math.abs(daysLeft)} ימים` : `בעוד ${daysLeft} ימים`}`,
      to: `/work/shipments/${inv.shipmentId}`,
      severity: daysLeft < 0 ? 'high' : 'medium',
    })
  }

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]).slice(0, limit)
}

// אין תשלומים כלל = 0. משמש לגרף "תשלומים לפי חודש" בדשבורד.
export function paymentsByMonth(invoices: ShipmentInvoice[], payments: ShipmentPayment[], months = 6, todayIso = new Date().toISOString().slice(0, 10)) {
  const out: { label: string; invoiced: number; paid: number; month: string }[] = []
  const MONTHS = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳']
  const base = new Date(todayIso + 'T00:00:00')
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(base.getFullYear(), base.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    out.push({
      month: key,
      label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
      invoiced: invoices.filter((inv) => inv.invoiceDate?.startsWith(key)).reduce((s, inv) => s + (inv.amount ?? 0), 0),
      paid: payments.filter((p) => p.paidAt.startsWith(key)).reduce((s, p) => s + p.amount, 0),
    })
  }
  return out
}
