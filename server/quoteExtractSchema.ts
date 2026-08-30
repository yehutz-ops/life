// סכמת החילוץ של הצעת מחיר משילוח (Quote) מתוך מייל תשובה של סוכנות.
// כל שדה מוחזר עם value/status/source/confidence — כדי שנוכל להציג למשתמש *מאיפה* הגיע כל נתון
// וכמה בטוחים בו, ולסמן חוסר/סתירה במקום לנחש.

export const QUOTE_FIELD_KEYS = [
  'transportMode',
  'totalPrice',
  'currency',
  'pickupIncluded',
  'originChargesIncluded',
  'destinationChargesIncluded',
  'customsIncluded',
  'dgIncluded',
  'chargeableWeight',
  'cartons',
  'pallets',
  'volume',
  'transitTimeMin',
  'transitTimeMax',
  'departureDate',
  'validityDate',
  'carrier',
  'route',
] as const

export type QuoteFieldKey = (typeof QUOTE_FIELD_KEYS)[number]

export const QUOTE_EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['isQuote', 'fields', 'additionalCharges', 'exclusions', 'notes'],
  properties: {
    // האם המייל בכלל מכיל הצעת מחיר. "לא" הוא פלט לגיטימי (אישור קבלה, שאלת הבהרה וכו').
    isQuote: { type: 'boolean' },
    isRevision: { type: 'boolean' },
    agencyName: { type: ['string', 'null'] },
    fields: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['field', 'value', 'status', 'source', 'confidence'],
        properties: {
          field: { type: 'string', enum: [...QUOTE_FIELD_KEYS] },
          // מוחזר תמיד כמחרוזת (או null) — ההמרה למספר/בוליאני נעשית אצלנו, כדי להימנע
          // מטיפוסים מעורבים בפלט המובנה.
          value: { type: ['string', 'null'] },
          status: { type: 'string', enum: ['extracted', 'missing', 'conflict'] },
          source: { type: ['string', 'null'] },
          confidence: { type: 'number' },
        },
      },
    },
    additionalCharges: { type: 'array', items: { type: 'string' } },
    exclusions: { type: 'array', items: { type: 'string' } },
    notes: { type: ['string', 'null'] },
  },
} as const
