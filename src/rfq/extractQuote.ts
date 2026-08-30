import { Shipment } from '../data/shipmentTypes'
import { QuoteExtraction, QuoteFieldMeta, InclusionState, TransportMode } from '../data/rfqTypes'

export class QuoteExtractError extends Error {}

export interface QuoteExtractAttachment {
  fileName: string
  mediaType: string
  base64: string
}

export interface ExtractedQuote {
  isQuote: boolean
  isRevision: boolean
  agencyName?: string
  extraction: QuoteExtraction
  fieldMeta: Record<string, QuoteFieldMeta>
  notes?: string
}

interface RawField {
  value: string | null
  status: string
  source: string | null
  confidence: number
}

function num(raw: RawField | undefined): number | undefined {
  if (!raw || raw.status !== 'extracted' || raw.value == null) return undefined
  const parsed = Number(String(raw.value).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(parsed) ? parsed : undefined
}

function str(raw: RawField | undefined): string | undefined {
  if (!raw || raw.status !== 'extracted' || !raw.value) return undefined
  return String(raw.value).trim() || undefined
}

function inclusion(raw: RawField | undefined): InclusionState | undefined {
  const v = str(raw)?.toLowerCase()
  if (v === 'included' || v === 'excluded' || v === 'unclear') return v
  return undefined
}

function mode(raw: RawField | undefined): TransportMode | undefined {
  const v = str(raw)?.toLowerCase()
  if (v === 'air' || v === 'sea' || v === 'road' || v === 'other') return v
  return undefined
}

// ההקשר נשלח כדי שהמודל יוכל להבחין בין מספרים ששייכים למשלוח הזה לבין מספרים אחרים.
// הוא מפורשות *לא* מקור לערכי ההצעה — ראו את הוראות המערכת ב-quoteExtractHandler.
function buildRfqContext(shipment: Shipment) {
  return {
    rfqReference: shipment.rfqReference,
    name: shipment.name,
    originCountry: shipment.originCountry,
    originCity: shipment.originCity,
    destination: shipment.destination,
    requestedMode: shipment.shippingMode,
    cartons: shipment.cartons,
    weightKg: shipment.weight,
    dimensions: shipment.dimensions,
    onPallet: shipment.onPallet,
    palletCount: shipment.palletCount,
    goodsType: shipment.goodsType,
    isDangerousGoods: shipment.isDangerousGoods,
  }
}

export async function extractQuoteFromEmail(
  shipment: Shipment,
  email: { subject: string; from: string; text: string },
  attachments: QuoteExtractAttachment[],
): Promise<ExtractedQuote> {
  let res: Response
  try {
    res = await fetch('/api/ai/extract-quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailBody: email.text,
        emailSubject: email.subject,
        emailFrom: email.from,
        attachments,
        rfqContext: buildRfqContext(shipment),
      }),
    })
  } catch {
    throw new QuoteExtractError('אין חיבור לשרת כרגע — לא הצלחתי לנתח את ההצעה.')
  }
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new QuoteExtractError(data?.message ?? 'ניתוח ההצעה נכשל.')
  }

  const { result } = await res.json()
  const f: Record<string, RawField> = result.fields ?? {}

  const extraction: QuoteExtraction = {
    transportMode: mode(f.transportMode),
    totalPrice: num(f.totalPrice),
    currency: str(f.currency)?.toUpperCase(),
    pickupIncluded: inclusion(f.pickupIncluded),
    originChargesIncluded: inclusion(f.originChargesIncluded),
    destinationChargesIncluded: inclusion(f.destinationChargesIncluded),
    customsIncluded: inclusion(f.customsIncluded),
    dgIncluded: inclusion(f.dgIncluded),
    chargeableWeight: num(f.chargeableWeight),
    cartons: num(f.cartons),
    pallets: num(f.pallets),
    volume: num(f.volume),
    transitTimeMin: num(f.transitTimeMin),
    transitTimeMax: num(f.transitTimeMax),
    departureDate: str(f.departureDate),
    validityDate: str(f.validityDate),
    carrier: str(f.carrier),
    route: str(f.route),
    notes: result.notes ?? undefined,
    additionalCharges: result.additionalCharges ?? [],
    exclusions: result.exclusions ?? [],
  }

  const fieldMeta: Record<string, QuoteFieldMeta> = {}
  for (const [key, raw] of Object.entries(f)) {
    fieldMeta[key] = {
      source: raw.source ?? undefined,
      confidence: raw.confidence,
      conflict: raw.status === 'conflict',
    }
  }

  return {
    isQuote: !!result.isQuote,
    isRevision: !!result.isRevision,
    agencyName: result.agencyName ?? undefined,
    extraction,
    fieldMeta,
    notes: result.notes ?? undefined,
  }
}
