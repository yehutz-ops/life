// סכימת ה-JSON שה-AI חייב להחזיר. שדות עם ערך אפשרי null נשארים תמיד בתשובה,
// לפי הנחיה מפורשת: "כל השדות יכולים להיות קיימים עם ערך null, במקום מבנה מורכב מדי".
//
// שדות עם enum שיכולים גם להיות null (domain, listType) חייבים anyOf ולא type:['string','null']+enum —
// שילוב type-array עם enum נדחה על ידי הוולידטור של Claude (ראו server/aiHandler.ts / תיקון מהשלב הקודם).
export const AI_RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['intent', 'answer', 'matchedItemIds', 'matchedProjectIds', 'draft', 'confidence', 'clarificationQuestion'],
  properties: {
    intent: { type: 'string', enum: ['create_draft', 'search', 'clarification'] },
    answer: { type: 'string' },
    matchedItemIds: { type: 'array', items: { type: 'string' } },
    matchedProjectIds: { type: 'array', items: { type: 'string' } },
    draft: {
      type: ['object', 'null'],
      additionalProperties: false,
      required: [
        'title', 'itemType', 'domain', 'destination', 'listType',
        'date', 'startTime', 'endTime', 'priority', 'person',
        'projectId', 'brandId', 'productId', 'campaignId',
        'needsCalendar', 'needsApproval', 'notes', 'amount', 'currency',
      ],
      properties: {
        title: { type: 'string' },
        itemType: { type: 'string', enum: ['task', 'event', 'reminder', 'waiting', 'shopping_item', 'content_item'] },
        domain: {
          anyOf: [
            { type: 'string', enum: ['work', 'studies', 'personal', 'home', 'health', 'finance', 'development'] },
            { type: 'null' },
          ],
        },
        destination: { type: ['string', 'null'] },
        listType: {
          anyOf: [
            { type: 'string', enum: ['shopping', 'errands', 'meetings', 'studies_admin', 'content', 'brands', 'general', 'maintenance', 'bills'] },
            { type: 'null' },
          ],
        },
        date: { type: ['string', 'null'] },
        startTime: { type: ['string', 'null'] },
        endTime: { type: ['string', 'null'] },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        person: { type: ['string', 'null'] },
        projectId: { type: ['string', 'null'] },
        brandId: { type: ['string', 'null'] },
        productId: { type: ['string', 'null'] },
        campaignId: { type: ['string', 'null'] },
        needsCalendar: { type: 'boolean' },
        needsApproval: { type: 'boolean' },
        notes: { type: ['string', 'null'] },
        amount: { type: ['number', 'null'] },
        currency: { type: ['string', 'null'] },
      },
    },
    confidence: { type: 'number' },
    clarificationQuestion: { type: ['string', 'null'] },
  },
} as const
