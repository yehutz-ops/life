import Anthropic from '@anthropic-ai/sdk'
import { AI_RESPONSE_SCHEMA } from './aiSchema'
import { buildSystemPrompt, RoutingRuleContext } from './systemPrompt'
import { findMentionedRelativeDate } from './relativeDates'

const MODEL = 'claude-haiku-4-5'
const TIMEZONE = 'Asia/Jerusalem'

export type AiErrorType = 'auth' | 'rate_limit' | 'network' | 'server' | 'unknown'

export interface ClassifiedError {
  type: AiErrorType
  message: string
}

// מסווג שגיאה לקטגוריה בטוחה להצגה למשתמש — אף פעם לא כולל את המפתח או פרטים טכניים גולמיים.
export function classifyError(err: unknown): ClassifiedError {
  if (err instanceof Anthropic.AuthenticationError) {
    return { type: 'auth', message: 'המפתח שהוזן לא תקין, או שאין לו הרשאה. כדאי לבדוק את המפתח ב-.env.local.' }
  }
  if (err instanceof Anthropic.RateLimitError) {
    return { type: 'rate_limit', message: 'יותר מדי בקשות כרגע. אפשר לנסות שוב בעוד רגע.' }
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return { type: 'network', message: 'אין חיבור לשרתי Claude כרגע. בדוק את החיבור לאינטרנט ונסה שוב.' }
  }
  if (err instanceof Anthropic.APIError) {
    return { type: 'server', message: 'שירות Claude החזיר שגיאה זמנית. אפשר לנסות שוב עוד רגע.' }
  }
  return { type: 'unknown', message: 'קרתה תקלה לא צפויה. אפשר לנסות שוב.' }
}

export async function testConnection(apiKey: string): Promise<{ ok: true } | { ok: false; error: ClassifiedError }> {
  try {
    const client = new Anthropic({ apiKey })
    await client.messages.create({
      model: MODEL,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'ping' }],
    })
    return { ok: true }
  } catch (err) {
    console.error('[ai/test-connection] failed:', (err as any)?.message ?? err)
    return { ok: false, error: classifyError(err) }
  }
}

export interface AiCommandRequest {
  text: string
  relevantItems: Array<{ id: string; title: string; kind: string; domain: string; date?: string; status: string }>
  relevantProjects: Array<{ id: string; name: string; domain: string }>
  relevantBrands?: Array<{ id: string; name: string; domain: string }>
  relevantProducts?: Array<{ id: string; name: string; brandId: string }>
  relevantCampaigns?: Array<{ id: string; name: string; brandId: string }>
  routingRules?: RoutingRuleContext[]
}

export async function handleAiCommand(apiKey: string, body: AiCommandRequest) {
  const client = new Anthropic({ apiKey })
  const now = new Date()
  const { prompt: system, dates } = buildSystemPrompt(now, TIMEZONE, body.routingRules ?? [])

  const context = {
    items: body.relevantItems.slice(0, 20),
    projects: body.relevantProjects.slice(0, 10),
    brands: (body.relevantBrands ?? []).slice(0, 10),
    products: (body.relevantProducts ?? []).slice(0, 15),
    campaigns: (body.relevantCampaigns ?? []).slice(0, 10),
  }

  const userMessage = `בקשת המשתמש: "${body.text}"\n\nפריטים, פרויקטים, מותגים, מוצרים וקמפיינים רלוונטיים שנמצאו במערכת (JSON, רק אלה מותרים כ-matchedItemIds/matchedProjectIds/projectId/brandId/productId/campaignId):\n${JSON.stringify(context)}`

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: 'user', content: userMessage }],
    output_config: { format: { type: 'json_schema', schema: AI_RESPONSE_SCHEMA } },
  } as any)

  if (response.stop_reason === 'refusal') {
    throw new Error('הבקשה נדחתה על ידי המערכת')
  }

  const textBlock = response.content.find((b: any) => b.type === 'text') as any
  if (!textBlock) throw new Error('לא התקבלה תשובה תקינה')

  const parsed = JSON.parse(textBlock.text)

  const validItemIds = new Set(context.items.map((it) => it.id))
  const validProjectIds = new Set(context.projects.map((p) => p.id))
  const validBrandIds = new Set(context.brands.map((b) => b.id))
  const validProductIds = new Set(context.products.map((p) => p.id))
  const validCampaignIds = new Set(context.campaigns.map((c) => c.id))
  parsed.matchedItemIds = (parsed.matchedItemIds ?? []).filter((id: string) => validItemIds.has(id))
  parsed.matchedProjectIds = (parsed.matchedProjectIds ?? []).filter((id: string) => validProjectIds.has(id))
  if (parsed.draft?.projectId && !validProjectIds.has(parsed.draft.projectId)) {
    parsed.draft.projectId = null
  }
  if (parsed.draft?.brandId && !validBrandIds.has(parsed.draft.brandId)) {
    parsed.draft.brandId = null
  }
  if (parsed.draft?.productId && !validProductIds.has(parsed.draft.productId)) {
    parsed.draft.productId = null
  }
  if (parsed.draft?.campaignId && !validCampaignIds.has(parsed.draft.campaignId)) {
    parsed.draft.campaignId = null
  }

  // קו הגנה שני על תאריכים יחסיים — עצמאי מהחישוב הפנימי של המודל. אם המשפט המקורי מזכיר
  // תאריך יחסי מפורש (מחר / יום בשבוע / "בעוד שבוע"), התאריך המוחזר חייב להתאים לחישוב הדטרמיניסטי.
  if (parsed.draft?.date) {
    const mentioned = findMentionedRelativeDate(body.text, dates)
    if (mentioned && mentioned.iso !== parsed.draft.date) {
      console.warn(`[ai] תיקון תאריך יחסי: "${mentioned.label}" — המודל החזיר ${parsed.draft.date}, מתקן ל-${mentioned.iso}`)
      parsed.draft.date = mentioned.iso
    }
  }

  return {
    result: parsed,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  }
}
