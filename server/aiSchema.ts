// סכימת ה-JSON שה-AI חייב להחזיר. שדות עם ערך אפשרי null נשארים תמיד בתשובה,
// לפי הנחיה מפורשת: "כל השדות יכולים להיות קיימים עם ערך null, במקום מבנה מורכב מדי".
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
      required: ['title', 'type', 'domain', 'date', 'startTime', 'priority', 'projectId', 'brandId', 'relatedPerson', 'notes'],
      properties: {
        title: { type: 'string' },
        type: { type: 'string', enum: ['task', 'event', 'reminder', 'waiting'] },
        domain: {
          anyOf: [
            { type: 'string', enum: ['work', 'studies', 'personal', 'home', 'health', 'finance', 'development'] },
            { type: 'null' },
          ],
        },
        date: { type: ['string', 'null'] },
        startTime: { type: ['string', 'null'] },
        priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        projectId: { type: ['string', 'null'] },
        brandId: { type: ['string', 'null'] },
        relatedPerson: { type: ['string', 'null'] },
        notes: { type: ['string', 'null'] },
      },
    },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
    clarificationQuestion: { type: ['string', 'null'] },
  },
} as const
