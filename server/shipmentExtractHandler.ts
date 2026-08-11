import Anthropic from '@anthropic-ai/sdk'
import { SHIPMENT_EXTRACT_SCHEMA, SHIPMENT_EXTRACT_FIELD_KEYS } from './shipmentExtractSchema'

const MODEL = 'claude-haiku-4-5'

const SYSTEM_PROMPT = `את/ה מסייע/ת בחילוץ פרטי משלוח לצורך בקשת הצעת מחיר לשילוח (RFQ), מתוך מסמכים/תמונות/טקסט שצורפו על ידי המשתמש (חשבונית/Invoice, Packing List, MSDS/SDS, תמונות/צילומי מסך, טקסט מודבק).

יש להחזיר מערך fields — פריט אחד לכל אחד מהשדות הבאים בדיוק (16 שדות, כל אחד פעם אחת): ${SHIPMENT_EXTRACT_FIELD_KEYS.join(', ')}.
כל פריט הוא אובייקט עם field/value/status/source/conflicts:
- אם הערך מופיע במפורש במקור אחד וברור: status="extracted", value=הערך המדויק כפי שמופיע במקור (בלי לנסח מחדש, בלי לתרגם — רק לנרמל פורמט כשצוין להלן), source=שם קצר של המקור (למשל שם הקובץ שצורף, או "טקסט שהודבק" אם המידע הגיע מהטקסט המודבק).
- אם הערך לא מופיע בשום מקור: status="missing", value=null, source=null, conflicts=[].
- אם שני מקורות (או יותר) נותנים ערכים שונים וסותרים לאותו שדה: status="conflict", value=null, source=null, conflicts=רשימת כל הערכים החולקים עם המקור של כל אחד. אל תבחרו ערך אחד באופן שרירותי כשיש סתירה, ואל תציינו את הערך החולק בתוך מחרוזת source (למשל "X, ולפי מקור אחר Y") — זהו תמיד סימן שהייתם צריכים להשתמש ב-status="conflict" עם conflicts מלא במקום.
- לעולם אל תמציאו או תנחשו ערך שלא כתוב במפורש באחד המקורות. חוסר מידע הוא תוצאה לגיטימית ("missing"), לא כשל.

כללי נרמול פורמט (רק כשהערך אכן קיים במקור):
- readyDate: פורמט YYYY-MM-DD.
- weight: מספר בלבד, ביחידות ק"ג (אם המקור מציין ליברות/lbs, המר לק"ג ותציין זאת ב-notes).
- cartons, palletCount: מספר שלם בלבד, כמחרוזת.
- onPallet: "true" אם יש אזכור מפורש שהמטען על משטח/פלטה (pallet), אחרת "false" אם יש אינדיקציה ברורה שאין, אחרת "missing".
- isDangerousGoods: "true" אם יש אזכור מפורש לחומר מסוכן/Dangerous Goods/DG/UN number/MSDS רלוונטי לסיכון בפועל, "false" אם יש אינדיקציה מפורשת ש"non-hazardous"/"not restricted", אחרת "missing" (עצם צירוף קובץ MSDS לבדו אינו הוכחה חד-משמעית ל-DG — יש לבדוק את התוכן בפועל).
- name: כותרת קצרה למשלוח. חלצו רק אם מופיעה כותרת/נושא מפורשים במקור (למשל שורת נושא במייל, כותרת מסמך). אם אין כותרת מפורשת — "missing" (אל תמציאו כותרת מהמידע האחר).

לכל קובץ שצורף, נחשו קטגוריה (documentGuesses) מתוך: invoice / packing_list / msds_sds / other, לפי שם הקובץ ותוכנו.

שדה notes: הערה קצרה אחת (או null) אם יש משהו חשוב שהמשתמש צריך לדעת (למשל המרת יחידות, מסמך שלא ניתן היה לקרוא, אי-ודאות).`

export interface ShipmentExtractFileInput {
  fileName: string
  mediaType: string
  base64: string
}

export interface ShipmentExtractRequest {
  files: ShipmentExtractFileInput[]
  pastedText?: string
}

const IMAGE_MEDIA_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

export async function handleShipmentExtract(apiKey: string, body: ShipmentExtractRequest) {
  const client = new Anthropic({ apiKey })

  const content: Anthropic.Messages.ContentBlockParam[] = []
  for (const file of body.files ?? []) {
    content.push({ type: 'text', text: `קובץ מצורף: ${file.fileName}` })
    if (file.mediaType === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.base64 } } as any)
    } else if (IMAGE_MEDIA_TYPES.has(file.mediaType)) {
      content.push({ type: 'image', source: { type: 'base64', media_type: file.mediaType as any, data: file.base64 } })
    } else {
      content.push({ type: 'text', text: `(סוג הקובץ ${file.mediaType || 'לא ידוע'} אינו נתמך לקריאה אוטומטית — לא נכלל בניתוח)` })
    }
  }
  if (body.pastedText?.trim()) {
    content.push({ type: 'text', text: `טקסט שהודבק על ידי המשתמש:\n${body.pastedText.trim()}` })
  }
  content.push({ type: 'text', text: 'חלצו את פרטי המשלוח מהחומר לעיל, בהתאם לכללים בהוראות המערכת.' })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema: SHIPMENT_EXTRACT_SCHEMA } },
  } as any)

  if (response.stop_reason === 'refusal') {
    throw new Error('הבקשה נדחתה על ידי המערכת')
  }

  const textBlock = response.content.find((b: any) => b.type === 'text') as any
  if (!textBlock) throw new Error('לא התקבלה תשובה תקינה')

  const raw = JSON.parse(textBlock.text)
  const rawFields: any[] = Array.isArray(raw.fields) ? raw.fields : []
  const byKey = new Map(rawFields.map((f) => [f.field, f]))

  // הופכים את המערך למבנה מפתח→ערך שהלקוח עובד איתו. אם המודל השמיט שדה, מסמנים "חסר" במקום לקרוס.
  const result: Record<string, unknown> = {}
  for (const key of SHIPMENT_EXTRACT_FIELD_KEYS) {
    const entry = byKey.get(key)
    if (!entry || typeof entry !== 'object') {
      result[key] = { value: null, status: 'missing', source: null, conflicts: [] }
    } else {
      result[key] = {
        value: entry.value ?? null,
        status: entry.status ?? 'missing',
        source: entry.source ?? null,
        conflicts: Array.isArray(entry.conflicts) ? entry.conflicts : [],
      }
    }
  }
  result.documentGuesses = Array.isArray(raw.documentGuesses) ? raw.documentGuesses : []
  result.notes = raw.notes ?? null

  return {
    result,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  }
}
