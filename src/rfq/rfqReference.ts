import { Shipment } from '../data/shipmentTypes'

// מזהה RFQ קריא וייחודי: RFQ-<שנה>-<רץ>. מופיע בנושא המייל, ב-PDF וברשומת המשלוח,
// והוא העוגן לזיהוי תשובות חוזרות כשאין מזהה שרשור.
const PREFIX = 'RFQ'

export const RFQ_REFERENCE_PATTERN = /RFQ-(\d{4})-(\d{3,})/i

export function nextRfqReference(existing: Shipment[], now = new Date()): string {
  const prefix = `${PREFIX}-${now.getFullYear()}-`
  const highest = existing
    .map((s) => s.rfqReference)
    .filter((r): r is string => typeof r === 'string' && r.toUpperCase().startsWith(prefix))
    .map((r) => Number(r.slice(prefix.length)))
    .filter((n) => Number.isFinite(n))
    .reduce((max, n) => Math.max(max, n), 0)
  return `${prefix}${String(highest + 1).padStart(3, '0')}`
}

// מאתר מזהה RFQ בתוך טקסט חופשי (נושא המייל או גוף המייל).
export function findRfqReference(text: string): string | undefined {
  const match = text.match(RFQ_REFERENCE_PATTERN)
  return match ? match[0].toUpperCase() : undefined
}
