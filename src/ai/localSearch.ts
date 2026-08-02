import { Item, Project } from '../data/types'

const MAX_ITEMS = 20
const MAX_PROJECTS = 10

function words(text: string): string[] {
  return text
    .split(/[\s,.:;!?"'()]+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2)
}

// חיפוש מקומי בסיסי לפי מילות מפתח, כדי לא לשלוח את כל מסד הנתונים ל-AI —
// רק את הפריטים שנראים רלוונטיים לבקשה.
export function findRelevant(text: string, items: Item[], projects: Project[]) {
  const terms = words(text)

  function score(haystack: string): number {
    if (!terms.length) return 0
    return terms.reduce((sum, t) => (haystack.includes(t) ? sum + 1 : sum), 0)
  }

  const scoredItems = items
    .map((it) => ({ it, s: score(it.title) + (it.notes ? score(it.notes) * 0.5 : 0) + (it.personName ? score(it.personName) : 0) }))
    .sort((a, b) => b.s - a.s)

  const scoredProjects = projects
    .map((p) => ({ p, s: score(p.name) + (p.description ? score(p.description) * 0.5 : 0) }))
    .sort((a, b) => b.s - a.s)

  const matchedItems = scoredItems.filter((x) => x.s > 0).map((x) => x.it)
  const matchedProjects = scoredProjects.filter((x) => x.s > 0).map((x) => x.p)

  // אם אין התאמות מילוליות ברורות, שולחים מדגם קטן ומגוון (הפתוחים/הקרובים ביותר)
  // כדי שגם בקשות כלליות ("מה יש לי היום") יקבלו הקשר.
  const items2 = matchedItems.length
    ? matchedItems
    : [...items].filter((it) => it.status !== 'done' && it.status !== 'cancelled').sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'))

  const projects2 = matchedProjects.length ? matchedProjects : projects.filter((p) => p.status !== 'done')

  return {
    items: items2.slice(0, MAX_ITEMS).map((it) => ({
      id: it.id,
      title: it.title,
      kind: it.kind,
      domain: it.domain,
      date: it.date,
      status: it.status,
    })),
    projects: projects2.slice(0, MAX_PROJECTS).map((p) => ({ id: p.id, name: p.name, domain: p.domain })),
  }
}
