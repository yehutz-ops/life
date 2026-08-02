import { Item, Project } from '../data/types'
import { findRelevant } from './localSearch'
import { AiResponse } from './types'
import { recordUsage } from './usageTracking'

export class AiClientError extends Error {}

// בדיקה קלה: האם בכלל הוגדר מפתח בשרת. לא מבצעת קריאה אמיתית ל-Claude, אין עלות.
export async function checkAiHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/ai/health')
    if (!res.ok) return false
    const data = await res.json()
    return !!data.configured
  } catch {
    return false
  }
}

export interface ConnectionTestResult {
  ok: boolean
  errorType?: string
  message?: string
}

// בדיקת חיבור אמיתית — קריאה מינימלית ל-Claude API. מופעלת רק בלחיצה מפורשת על "בדיקת חיבור".
export async function testAiConnection(): Promise<ConnectionTestResult> {
  try {
    const res = await fetch('/api/ai/test-connection', { method: 'POST' })
    const data = await res.json()
    if (data.ok) return { ok: true }
    return { ok: false, errorType: data.error?.type, message: data.error?.message }
  } catch {
    return { ok: false, errorType: 'network', message: 'אין חיבור לאינטרנט כרגע.' }
  }
}

export async function askAi(text: string, items: Item[], projects: Project[]): Promise<AiResponse> {
  const { items: relevantItems, projects: relevantProjects } = findRelevant(text, items, projects)

  let res: Response
  try {
    res = await fetch('/api/ai/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, relevantItems, relevantProjects }),
    })
  } catch {
    throw new AiClientError('אין חיבור לאינטרנט כרגע. אפשר להמשיך להשתמש בחיפוש הרגיל, ולנסות שוב מאוחר יותר.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new AiClientError(data?.message ?? 'לא הצלחתי להתחבר ל-Claude כרגע. אפשר לנסות שוב עוד רגע.')
  }

  const data = await res.json()
  await recordUsage(data.usage.inputTokens, data.usage.outputTokens)
  return data.result as AiResponse
}
