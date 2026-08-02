import { Item, Project } from '../data/types'
import { findRelevant } from './localSearch'
import { AiResponse } from './types'
import { recordUsage } from './usageTracking'

export class AiClientError extends Error {}

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
