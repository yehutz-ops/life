import Anthropic from '@anthropic-ai/sdk'
import { AI_RESPONSE_SCHEMA } from './aiSchema'
import { buildSystemPrompt } from './systemPrompt'

const MODEL = 'claude-haiku-4-5'
const TIMEZONE = 'Asia/Jerusalem'

export interface AiCommandRequest {
  text: string
  relevantItems: Array<{ id: string; title: string; kind: string; domain: string; date?: string; status: string }>
  relevantProjects: Array<{ id: string; name: string; domain: string }>
}

export async function handleAiCommand(apiKey: string, body: AiCommandRequest) {
  const client = new Anthropic({ apiKey })
  const now = new Date()
  const system = buildSystemPrompt(now, TIMEZONE)

  const context = {
    items: body.relevantItems.slice(0, 20),
    projects: body.relevantProjects.slice(0, 10),
  }

  const userMessage = `בקשת המשתמש: "${body.text}"\n\nפריטים ופרויקטים רלוונטיים שנמצאו במערכת (JSON, רק אלה מותרים כ-matchedItemIds/matchedProjectIds/projectId):\n${JSON.stringify(context)}`

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
  parsed.matchedItemIds = (parsed.matchedItemIds ?? []).filter((id: string) => validItemIds.has(id))
  parsed.matchedProjectIds = (parsed.matchedProjectIds ?? []).filter((id: string) => validProjectIds.has(id))
  if (parsed.draft?.projectId && !validProjectIds.has(parsed.draft.projectId)) {
    parsed.draft.projectId = null
  }

  return {
    result: parsed,
    usage: { inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens },
  }
}
