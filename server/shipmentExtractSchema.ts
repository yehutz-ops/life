// סכימת JSON לחילוץ פרטי משלוח (RFQ) ממסמכים/תמונות/טקסט מודבק. כל שדה חוזר עם value/status/source/conflicts —
// כדי שהלקוח יוכל להציג "מקור" לכל ערך, לסמן "חסר" בלי להמציא, ולסמן סתירה בין מקורות במקום לבחור שרירותית.
//
// מבנה כרשימה (fields[]) ולא כאובייקט עם 16 שדות נפרדים בכוונה: ל-Claude יש הגבלה של 16 פרמטרים
// עם union/anyOf types לכל סכימת structured-output; 16 שדות × value/source נאלבליים היו חוצים אותה
// בהרבה (ראו שגיאת "too many parameters with union types" שהתקבלה בפועל). ברשימה, סכימת הפריט
// היחידה (FIELD_ENTRY_SCHEMA) נספרת פעם אחת בלבד.

const FIELD_KEYS = [
  'name',
  'originCountry',
  'originCity',
  'supplierName',
  'pickupAddress',
  'contactPerson',
  'contactEmail',
  'contactPhone',
  'readyDate',
  'cartons',
  'weight',
  'dimensions',
  'onPallet',
  'palletCount',
  'goodsType',
  'isDangerousGoods',
] as const

export type ShipmentExtractFieldKey = (typeof FIELD_KEYS)[number]
export const SHIPMENT_EXTRACT_FIELD_KEYS = FIELD_KEYS

const FIELD_ENTRY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['field', 'value', 'status', 'source', 'conflicts'],
  properties: {
    field: { type: 'string', enum: FIELD_KEYS },
    value: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['extracted', 'missing', 'conflict'] },
    source: { type: ['string', 'null'] },
    conflicts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['value', 'source'],
        properties: { value: { type: 'string' }, source: { type: 'string' } },
      },
    },
  },
} as const

export const SHIPMENT_EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['fields', 'documentGuesses', 'notes'],
  properties: {
    fields: { type: 'array', items: FIELD_ENTRY_SCHEMA },
    documentGuesses: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['fileName', 'category'],
        properties: {
          fileName: { type: 'string' },
          category: { type: 'string', enum: ['invoice', 'packing_list', 'msds_sds', 'other'] },
        },
      },
    },
    notes: { type: ['string', 'null'] },
  },
} as const
