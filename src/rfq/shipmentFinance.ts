import { Shipment, Forwarder, ShipmentQuote } from '../data/shipmentTypes'
import { ShipmentInvoice, ShipmentPayment, PaymentTermsBasis } from '../data/shipmentFinanceTypes'

// שכבת חישוב טהורה לכספי המשלוח. שום דבר כאן לא נשמר — הכל נגזר מהחשבוניות, התשלומים
// ותנאי התשלום בזמן ריצה, כדי שלא יהיו שני מקורות אמת לאותו מספר.

export const DEFAULT_VAT_RATE = 0.18

function addDays(iso: string, days: number): string {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

// תנאי התשלום של המשלוח: דריסה ברמת המשלוח גוברת על ברירת המחדל של הסוכנות.
export function effectiveTerms(shipment: Shipment, forwarder?: Forwarder): { days?: number; basis?: PaymentTermsBasis } {
  return {
    days: shipment.paymentTermsDays ?? forwarder?.paymentTermsDays,
    basis: shipment.paymentTermsBasis ?? forwarder?.paymentTermsBasis,
  }
}

// תאריך תשלום מחושב — רק כשיש גם ימי אשראי וגם התאריך שממנו סופרים.
// אם חסר מידע מחזירים undefined במקום לנחש.
export function computeDueDate(shipment: Shipment, invoice: ShipmentInvoice, forwarder?: Forwarder): string | undefined {
  if (invoice.dueDate) return invoice.dueDate
  const { days, basis } = effectiveTerms(shipment, forwarder)
  if (days == null || !basis) return undefined
  const anchor =
    basis === 'invoice' ? invoice.invoiceDate : basis === 'departure' ? shipment.departureDate : basis === 'arrival' || basis === 'release' ? shipment.eta : undefined
  if (!anchor) return undefined
  return addDays(anchor, days)
}

export interface ShipmentFinance {
  invoiced: number
  paid: number
  outstanding: number
  vatEstimate?: number
  vatActual?: number
  missingInvoices: number
  nextDueDate?: string
  nextDueAmount?: number
  currency?: string
}

export function shipmentFinance(
  shipment: Shipment,
  invoices: ShipmentInvoice[],
  payments: ShipmentPayment[],
  forwarders: Forwarder[],
): ShipmentFinance {
  const mine = invoices.filter((i) => i.shipmentId === shipment.id)
  const myPayments = payments.filter((p) => p.shipmentId === shipment.id)

  const invoiced = mine.filter((i) => i.status !== 'expected').reduce((sum, i) => sum + (i.amount ?? 0), 0)
  const paid = myPayments.reduce((sum, p) => sum + p.amount, 0)

  const dated = mine
    .filter((i) => i.status !== 'paid')
    .map((i) => ({ invoice: i, due: computeDueDate(shipment, i, forwarders.find((f) => f.id === i.forwarderId)) }))
    .filter((x): x is { invoice: ShipmentInvoice; due: string } => !!x.due)
    .sort((a, b) => a.due.localeCompare(b.due))

  return {
    invoiced,
    paid,
    outstanding: Math.max(0, invoiced - paid),
    vatEstimate: shipment.vatEstimate,
    vatActual: shipment.vatActual,
    missingInvoices: mine.filter((i) => i.status === 'expected').length,
    nextDueDate: dated[0]?.due,
    nextDueAmount: dated[0]?.invoice.amount,
    currency: mine.find((i) => i.currency)?.currency,
  }
}

// אומדן מע"מ מהערך המוצהר של המשלוח, כשלא הוזן אומדן ידני. מסומן תמיד כאומדן בתצוגה.
export function estimatedVat(shipment: Shipment): number | undefined {
  if (shipment.vatEstimate != null) return shipment.vatEstimate
  if (shipment.shipmentValue == null) return undefined
  return Math.round(shipment.shipmentValue * DEFAULT_VAT_RATE)
}

const ACTIVE_STATUSES = new Set(['preparing', 'waiting_for_quotes', 'quotes_received', 'waiting_for_pickup', 'picked_up', 'in_transit', 'customs', 'missing_documents', 'issue'])

export interface ShipmentsKpis {
  active: number
  awaitingQuotes: number
  quotesReceived: number
  arrivingThisWeek: number
  missingInvoices: number
  upcomingPaymentsAmount: number
  upcomingPaymentsCount: number
  vatDue: number
}

export function computeShipmentsKpis(
  shipments: Shipment[],
  quotes: ShipmentQuote[],
  invoices: ShipmentInvoice[],
  payments: ShipmentPayment[],
  forwarders: Forwarder[],
  todayIso: string,
): ShipmentsKpis {
  const weekAhead = addDays(todayIso, 7)
  const activeShipments = shipments.filter((s) => ACTIVE_STATUSES.has(s.status))

  let upcomingAmount = 0
  let upcomingCount = 0
  let vatDue = 0

  for (const s of activeShipments) {
    const fin = shipmentFinance(s, invoices, payments, forwarders)
    if (fin.nextDueDate && fin.nextDueDate <= weekAhead) {
      upcomingAmount += fin.nextDueAmount ?? 0
      upcomingCount++
    }
    if (!s.vatPaidAt) vatDue += s.vatActual ?? estimatedVat(s) ?? 0
  }

  return {
    active: activeShipments.length,
    awaitingQuotes: shipments.filter((s) => s.status === 'waiting_for_quotes').length,
    quotesReceived: quotes.filter((q) => q.isCurrent !== false).length,
    arrivingThisWeek: shipments.filter((s) => s.eta && s.eta >= todayIso && s.eta <= weekAhead && s.status !== 'delivered').length,
    missingInvoices: invoices.filter((i) => i.status === 'expected').length,
    upcomingPaymentsAmount: upcomingAmount,
    upcomingPaymentsCount: upcomingCount,
    vatDue,
  }
}

export function invoiceStateForShipment(shipment: Shipment, invoices: ShipmentInvoice[]): { label: string; tone: 'good' | 'warn' | 'alert' | 'neutral' } {
  const mine = invoices.filter((i) => i.shipmentId === shipment.id)
  if (mine.length === 0) return { label: 'אין חשבונית', tone: 'neutral' }
  if (mine.some((i) => i.status === 'expected')) return { label: 'חסרה חשבונית', tone: 'alert' }
  if (mine.every((i) => i.status === 'paid')) return { label: 'שולם', tone: 'good' }
  if (mine.some((i) => i.status === 'approved')) return { label: 'ממתין לתשלום', tone: 'warn' }
  return { label: 'התקבלה', tone: 'good' }
}
