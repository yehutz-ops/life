import { getMeta, setMeta } from '../data/db/database'

const KEY = 'aiUsageStats'

// תמחור Claude Haiku 4.5 (לפי $ למיליון טוקנים) — לצורך הערכה בלבד למשתמש.
const PRICE_PER_M_INPUT = 1.0
const PRICE_PER_M_OUTPUT = 5.0

export interface AiUsageStats {
  calls: number
  inputTokens: number
  outputTokens: number
}

const empty: AiUsageStats = { calls: 0, inputTokens: 0, outputTokens: 0 }

export async function getUsageStats(): Promise<AiUsageStats> {
  const raw = await getMeta(KEY)
  if (!raw) return empty
  try {
    return { ...empty, ...JSON.parse(raw) }
  } catch {
    return empty
  }
}

export async function recordUsage(inputTokens: number, outputTokens: number) {
  const current = await getUsageStats()
  const next: AiUsageStats = {
    calls: current.calls + 1,
    inputTokens: current.inputTokens + inputTokens,
    outputTokens: current.outputTokens + outputTokens,
  }
  await setMeta(KEY, JSON.stringify(next))
  return next
}

export async function resetUsageStats() {
  await setMeta(KEY, JSON.stringify(empty))
}

export function estimateCostUsd(stats: AiUsageStats): number {
  return (stats.inputTokens / 1_000_000) * PRICE_PER_M_INPUT + (stats.outputTokens / 1_000_000) * PRICE_PER_M_OUTPUT
}
