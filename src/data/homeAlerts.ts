// מנוע ההתראות של דף הבית — שכבת חישוב טהורה. אין ישות "התראה" שנשמרת במסד:
// כל התראה נגזרת בזמן ריצה מנתונים אמיתיים שכבר קיימים (פריטים, חשבונות בית, משלוחים).
// לכן היא לא יכולה להתיישן, ואין מה לתחזק או לסמן כ"נקרא".
import { Item, ItemStatus } from './types'
import { Shipment } from './shipmentTypes'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface HomeAlert {
  id: string
  text: string
  severity: AlertSeverity
  to?: string
  itemId?: string
}

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'

function daysUntil(iso: string, todayIso: string): number {
  return Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(todayIso + 'T00:00:00').getTime()) / 86400000)
}

const SHIPMENT_ISSUE_LABEL: Partial<Record<Shipment['status'], string>> = {
  issue: 'תקלה במשלוח',
  missing_documents: 'חסרים מסמכים למשלוח',
}

// חלון ההתראה על חשבונות בית שמועד התשלום שלהם מתקרב.
const BILL_LOOKAHEAD_DAYS = 7

export function computeHomeAlerts(items: Item[], shipments: Shipment[], todayIso: string, limit = 5): HomeAlert[] {
  const alerts: HomeAlert[] = []

  // 1. חשבונות בית שמועד התשלום שלהם מתקרב (או עבר) — הכי "כספי" ולכן ראשון בסדר החומרה.
  for (const it of items) {
    if (it.listType !== 'bills' || !it.date || !isActive(it.status)) continue
    const days = daysUntil(it.date, todayIso)
    if (days > BILL_LOOKAHEAD_DAYS) continue
    alerts.push({
      id: `bill-${it.id}`,
      itemId: it.id,
      severity: days < 0 ? 'critical' : 'info',
      text: days < 0 ? `${it.title} — באיחור של ${Math.abs(days)} ימים` : days === 0 ? `${it.title} — לתשלום היום` : `${it.title} — לתשלום בעוד ${days} ימים`,
    })
  }

  // 2. משלוחים שדורשים טיפול.
  for (const s of shipments) {
    const label = SHIPMENT_ISSUE_LABEL[s.status]
    if (!label) continue
    alerts.push({
      id: `ship-${s.id}`,
      severity: s.status === 'issue' ? 'critical' : 'warning',
      text: `${label}: ${s.name ?? s.supplierName ?? 'ללא שם'}`,
      to: `/work/shipments/${s.id}`,
    })
  }

  // 3. פריטים שעברו את תאריך היעד (למעט חשבונות — כבר טופלו למעלה).
  const overdue = items.filter((it) => it.listType !== 'bills' && it.date && it.date < todayIso && isActive(it.status) && it.kind !== 'event')
  if (overdue.length > 0) {
    alerts.push({
      id: 'overdue',
      severity: 'warning',
      text: overdue.length === 1 ? `${overdue[0].title} — עבר את תאריך היעד` : `${overdue.length} פריטים עברו את תאריך היעד`,
      to: '/tasks',
      itemId: overdue.length === 1 ? overdue[0].id : undefined,
    })
  }

  const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, limit)
}
