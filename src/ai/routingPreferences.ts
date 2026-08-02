import { DomainId } from '../data/types'
import { getMeta, setMeta } from '../data/db/database'

export interface RoutingRule {
  id: string
  keyword: string
  domain: DomainId
  destination?: string
  weight: number
  source: 'seed' | 'learned'
}

const META_KEY = 'aiRoutingRules'

// העדפות ניתוב התחלתיות — רמזים סבירים לפי הדוגמאות שהוגדרו, לא חוקים מוחלטים.
const SEED_RULES: RoutingRule[] = [
  { id: 'seed-1', keyword: 'בית מדרש', domain: 'studies', destination: 'בית מדרש', weight: 3, source: 'seed' },
  { id: 'seed-2', keyword: 'נקודות זכות', domain: 'studies', destination: 'נקודות זכות', weight: 3, source: 'seed' },
  { id: 'seed-3', keyword: 'מכבסה', domain: 'home', destination: 'כביסה', weight: 3, source: 'seed' },
  { id: 'seed-4', keyword: 'כביסה', domain: 'home', destination: 'כביסה', weight: 3, source: 'seed' },
  { id: 'seed-5', keyword: 'FOMOWA', domain: 'work', destination: 'מותגים', weight: 3, source: 'seed' },
  { id: 'seed-6', keyword: 'Reel', domain: 'work', destination: 'תוכן', weight: 3, source: 'seed' },
  { id: 'seed-7', keyword: 'Story', domain: 'work', destination: 'תוכן', weight: 3, source: 'seed' },
  { id: 'seed-8', keyword: 'פוסט', domain: 'work', destination: 'תוכן', weight: 3, source: 'seed' },
  { id: 'seed-9', keyword: 'ספק', domain: 'work', destination: 'ספקים ומשלוחים', weight: 3, source: 'seed' },
  { id: 'seed-10', keyword: 'משלוח', domain: 'work', destination: 'ספקים ומשלוחים', weight: 3, source: 'seed' },
]

const STOPWORDS = new Set(['את', 'של', 'עם', 'לא', 'כן', 'גם', 'רק', 'אני', 'אתה', 'היא', 'הוא', 'הם', 'זה', 'זאת', 'אבל', 'כדי', 'צריך', 'צריכה'])

async function readRules(): Promise<RoutingRule[]> {
  const raw = await getMeta(META_KEY)
  if (!raw) {
    await setMeta(META_KEY, JSON.stringify(SEED_RULES))
    return SEED_RULES
  }
  try {
    return JSON.parse(raw) as RoutingRule[]
  } catch {
    return SEED_RULES
  }
}

async function writeRules(rules: RoutingRule[]): Promise<void> {
  await setMeta(META_KEY, JSON.stringify(rules))
}

export async function getRoutingRules(): Promise<RoutingRule[]> {
  return readRules()
}

export async function deleteRoutingRule(id: string): Promise<void> {
  const rules = await readRules()
  await writeRules(rules.filter((r) => r.id !== id))
}

// שולף מילת מפתח מייצגת מכותרת — המילה המשמעותית הארוכה ביותר, לא מילת קישור.
function extractKeyword(title: string): string | null {
  const candidates = title
    .split(/[\s,.:;!?"'()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w))
  if (!candidates.length) return null
  return candidates.reduce((longest, w) => (w.length > longest.length ? w : longest), candidates[0])
}

// כשמשתמש משנה ידנית תחום/יעד של פריט — שומרים את התיקון כהעדפה מקומית.
// תיקון חד-פעמי לא הופך לחוק מוחלט; רק תיקונים חוזרים מעלים את המשקל.
export async function recordDomainCorrection(title: string, domain: DomainId, destination?: string): Promise<void> {
  const keyword = extractKeyword(title)
  if (!keyword) return
  const rules = await readRules()
  const existing = rules.find((r) => r.keyword.toLowerCase() === keyword.toLowerCase() && r.domain === domain)
  if (existing) {
    existing.weight += 1
    if (destination) existing.destination = destination
  } else {
    rules.push({ id: `learned-${Date.now()}`, keyword, domain, destination, weight: 1, source: 'learned' })
  }
  await writeRules(rules)
}
