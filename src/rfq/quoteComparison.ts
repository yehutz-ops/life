import { ShipmentQuote } from '../data/shipmentTypes'
import { TransportMode, REQUIRED_QUOTE_FIELDS, QUOTE_FIELD_LABEL, QuoteExtraction } from '../data/rfqTypes'

// שכבת ההשוואה. עיקרון מנחה: משווים רק תפוחים לתפוחים —
// הצעה ימית זולה לעולם לא תוצג כ"טובה יותר" מהצעה אווירית בלי הקשר, כי הן לא אותו מוצר.
// ההמלצה אינה "המחיר הנמוך ביותר" אלא שקלול של מחיר, זמן, שלמות המידע ומה כלול בפועל.

export interface QuoteMetrics {
  quote: ShipmentQuote
  agencyName: string
  totalPrice?: number
  currency?: string
  transitMin?: number
  transitMax?: number
  pricePerKg?: number
  completeness: number
  missingFields: string[]
  diffFromCheapestPct?: number
  isCheapest: boolean
  isFastest: boolean
  isMostComplete: boolean
}

export interface ModeComparison {
  mode: TransportMode
  quotes: QuoteMetrics[]
  cheapest?: QuoteMetrics
  fastest?: QuoteMetrics
  mostComplete?: QuoteMetrics
  recommended?: QuoteMetrics
  recommendationReason: string
  canRecommend: boolean
}

// הגרסה האחרונה של כל סוכנות: אין דריסה של גרסאות קודמות, רק בחירה של ה"נוכחית".
export function currentQuotes(quotes: ShipmentQuote[], shipmentId: string): ShipmentQuote[] {
  const forShipment = quotes.filter((q) => q.shipmentId === shipmentId)
  const byAgency = new Map<string, ShipmentQuote>()
  for (const q of forShipment) {
    const key = q.forwarderId ?? q.forwarderName
    const existing = byAgency.get(key)
    if (!existing || (q.version ?? 1) > (existing.version ?? 1)) byAgency.set(key, q)
  }
  return [...byAgency.values()]
}

// כל הגרסאות של סוכנות אחת, מהחדשה לישנה.
export function quoteVersions(quotes: ShipmentQuote[], shipmentId: string, agencyKey: string): ShipmentQuote[] {
  return quotes
    .filter((q) => q.shipmentId === shipmentId && (q.forwarderId ?? q.forwarderName) === agencyKey)
    .sort((a, b) => (b.version ?? 1) - (a.version ?? 1))
}

function valueOf(e: QuoteExtraction | undefined, key: string): unknown {
  return e ? (e as Record<string, unknown>)[key] : undefined
}

// שדה נחשב "חסר" גם כשהוא קיים אבל ערכו 'unclear' — הסוכנות פשוט לא ענתה על השאלה.
export function missingRequiredFields(quote: ShipmentQuote): string[] {
  const e = quote.extraction
  const missing: string[] = []
  for (const key of REQUIRED_QUOTE_FIELDS) {
    const v = valueOf(e, key) ?? (key === 'totalPrice' ? quote.price : key === 'currency' ? quote.currency : undefined)
    if (v === undefined || v === null || v === '' || v === 'unclear') missing.push(QUOTE_FIELD_LABEL[key] ?? key)
  }
  return missing
}

function completenessScore(quote: ShipmentQuote): number {
  const total = REQUIRED_QUOTE_FIELDS.length
  return (total - missingRequiredFields(quote).length) / total
}

export function quoteMode(quote: ShipmentQuote): TransportMode {
  return quote.extraction?.transportMode ?? 'other'
}

function priceOf(q: ShipmentQuote): number | undefined {
  return q.extraction?.totalPrice ?? q.price
}

function transitMaxOf(q: ShipmentQuote): number | undefined {
  return q.extraction?.transitTimeMax ?? q.transitTimeDays
}

function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || max === min) return 1
  return (max - value) / (max - min)
}

export function compareQuotesForMode(quotes: ShipmentQuote[], mode: TransportMode): ModeComparison {
  const metrics: QuoteMetrics[] = quotes.map((q) => {
    const totalPrice = priceOf(q)
    const chargeable = q.extraction?.chargeableWeight
    return {
      quote: q,
      agencyName: q.forwarderName,
      totalPrice,
      currency: q.extraction?.currency ?? q.currency,
      transitMin: q.extraction?.transitTimeMin,
      transitMax: transitMaxOf(q),
      pricePerKg: totalPrice != null && chargeable ? totalPrice / chargeable : undefined,
      completeness: completenessScore(q),
      missingFields: missingRequiredFields(q),
      diffFromCheapestPct: undefined,
      isCheapest: false,
      isFastest: false,
      isMostComplete: false,
    }
  })

  const priced = metrics.filter((m) => m.totalPrice != null)
  const timed = metrics.filter((m) => m.transitMax != null)

  const cheapest = priced.length ? priced.reduce((a, b) => (a.totalPrice! <= b.totalPrice! ? a : b)) : undefined
  const fastest = timed.length ? timed.reduce((a, b) => (a.transitMax! <= b.transitMax! ? a : b)) : undefined
  const mostComplete = metrics.length ? metrics.reduce((a, b) => (a.completeness >= b.completeness ? a : b)) : undefined

  if (cheapest) {
    for (const m of priced) {
      m.diffFromCheapestPct = cheapest.totalPrice! > 0 ? ((m.totalPrice! - cheapest.totalPrice!) / cheapest.totalPrice!) * 100 : 0
    }
    cheapest.isCheapest = true
  }
  if (fastest) fastest.isFastest = true
  if (mostComplete) mostComplete.isMostComplete = true

  // המלצה דורשת לפחות שתי הצעות עם מחיר — אחרת אין מה להשוות.
  const canRecommend = priced.length >= 2
  let recommended: QuoteMetrics | undefined
  let recommendationReason = ''

  if (!canRecommend) {
    recommendationReason =
      priced.length === 1
        ? 'התקבלה הצעה אחת בלבד עם מחיר — אין מספיק מידע להשוואה ולהמלצה.'
        : 'עדיין לא התקבלו הצעות עם מחיר, אין מספיק מידע להמלצה.'
  } else {
    const prices = priced.map((m) => m.totalPrice!)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const transits = timed.map((m) => m.transitMax!)
    const minTransit = transits.length ? Math.min(...transits) : 0
    const maxTransit = transits.length ? Math.max(...transits) : 0

    const scored = priced.map((m) => {
      const priceScore = normalize(m.totalPrice!, minPrice, maxPrice)
      const transitScore = m.transitMax != null && transits.length ? normalize(m.transitMax, minTransit, maxTransit) : 0.5
      const e = m.quote.extraction
      // בונוס קטן על מה שבאמת כלול — הצעה "זולה" שלא כוללת איסוף אינה באמת זולה.
      const inclusionBonus =
        (e?.pickupIncluded === 'included' ? 1 : 0) * 0.4 +
        (e?.originChargesIncluded === 'included' ? 1 : 0) * 0.3 +
        (e?.dgIncluded === 'included' ? 1 : 0) * 0.3
      const penalty = (e?.exclusions?.length ?? 0) * 0.03
      const score = priceScore * 0.45 + transitScore * 0.25 + m.completeness * 0.2 + inclusionBonus * 0.1 - penalty
      return { m, score }
    })

    scored.sort((a, b) => b.score - a.score)
    recommended = scored[0].m

    const parts: string[] = []
    if (recommended.isCheapest) parts.push('המחיר הנמוך ביותר')
    else if (recommended.diffFromCheapestPct != null) parts.push(`יקרה ב-${recommended.diffFromCheapestPct.toFixed(0)}% מהזולה ביותר`)
    if (recommended.isFastest) parts.push('זמן המעבר הקצר ביותר')
    else if (recommended.transitMax != null) parts.push(`זמן מעבר ${recommended.transitMax} ימים`)
    if (recommended.missingFields.length === 0) parts.push('כל הפרטים מלאים')
    else parts.push(`חסרים ${recommended.missingFields.length} פרטים`)

    recommendationReason = `${recommended.agencyName}: ${parts.join(' · ')}`
  }

  metrics.sort((a, b) => (a.totalPrice ?? Infinity) - (b.totalPrice ?? Infinity))

  return { mode, quotes: metrics, cheapest, fastest, mostComplete, recommended, recommendationReason, canRecommend }
}

// מקבץ את ההצעות הנוכחיות לפי סוג הובלה ומחזיר השוואה נפרדת לכל סוג.
export function compareByMode(quotes: ShipmentQuote[]): ModeComparison[] {
  const groups = new Map<TransportMode, ShipmentQuote[]>()
  for (const q of quotes) {
    const m = quoteMode(q)
    groups.set(m, [...(groups.get(m) ?? []), q])
  }
  const order: TransportMode[] = ['air', 'sea', 'road', 'other']
  return order.filter((m) => groups.has(m)).map((m) => compareQuotesForMode(groups.get(m)!, m))
}
