import { Item, Project } from '../data/types'
import { Brand, BrandProduct, BrandCampaign } from '../data/brandTypes'

const MAX_ITEMS = 20
const MAX_PROJECTS = 10
const MAX_BRANDS = 10
const MAX_PRODUCTS = 15
const MAX_CAMPAIGNS = 10

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

// חיפוש מקומי מקביל עבור מותגים/מוצרים/קמפיינים — כדי שה-AI יוכל לזהות ולשייך brandId/productId/campaignId
// אמיתיים (למשל "FOMOWA", "Pannaco Tahaa"), במקום להשאיר את השיוך רק ל-projectId או להמציא כלום.
export function findRelevantBrandContext(text: string, brands: Brand[], products: BrandProduct[], campaigns: BrandCampaign[]) {
  const terms = words(text)

  function score(haystack: string): number {
    if (!terms.length) return 0
    return terms.reduce((sum, t) => (haystack.toLowerCase().includes(t.toLowerCase()) ? sum + 1 : sum), 0)
  }

  const scoredBrands = brands.map((b) => ({ b, s: score(b.name) })).sort((a, b) => b.s - a.s)
  const scoredProducts = products.map((p) => ({ p, s: score(p.name) })).sort((a, b) => b.s - a.s)
  const scoredCampaigns = campaigns.map((c) => ({ c, s: score(c.name) })).sort((a, b) => b.s - a.s)

  const matchedBrands = scoredBrands.filter((x) => x.s > 0).map((x) => x.b)
  const matchedProducts = scoredProducts.filter((x) => x.s > 0).map((x) => x.p)
  const matchedCampaigns = scoredCampaigns.filter((x) => x.s > 0).map((x) => x.c)

  // אם מוצר תואם, כדאי לכלול גם את המותג שלו גם אם שם המותג עצמו לא הוזכר מילולית —
  // כדי שה-AI יוכל למלא גם brandId וגם productId יחד (למשל "לצלם את Pannaco Tahaa").
  const brandIdsFromProducts = new Set(matchedProducts.map((p) => p.brandId))
  const brandsFromProducts = brands.filter((b) => brandIdsFromProducts.has(b.id) && !matchedBrands.some((mb) => mb.id === b.id))

  const brands2 = matchedBrands.length || brandsFromProducts.length ? [...matchedBrands, ...brandsFromProducts] : brands
  const products2 = matchedProducts
  const campaigns2 = matchedCampaigns.length ? matchedCampaigns : campaigns.filter((c) => brandIdsFromProducts.has(c.brandId) || matchedBrands.some((b) => b.id === c.brandId))

  return {
    brands: brands2.slice(0, MAX_BRANDS).map((b) => ({ id: b.id, name: b.name, domain: b.domain })),
    products: products2.slice(0, MAX_PRODUCTS).map((p) => ({ id: p.id, name: p.name, brandId: p.brandId })),
    campaigns: campaigns2.slice(0, MAX_CAMPAIGNS).map((c) => ({ id: c.id, name: c.name, brandId: c.brandId })),
  }
}
