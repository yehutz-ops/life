// זיהוי כפילות/עדכון בסיסי עבור אירועי יומן שנוצרים אוטומטית (Gmail וכו'). מכוון-שמרנות: מעדיף
// ליצור פריט חדש על פני לשייך בטעות לפריט לא-קשור — "אם לא בטוחים שזה אותו דבר, לא ממזגים".
// זה לא זיהוי-ישות אמיתי (embeddings/fuzzy matching מלא) — היוריסטיקה פשוטה ומוצהרת ככזו.
import { Item } from '../data/types'
import { MappedDraft } from '../ai/mapDraft'

const DAY_MS = 86400000
const DATE_WINDOW_DAYS = 21 // חלון סביר לשינוי דדליין/מועד פגישה בין שתי הודעות על אותו אירוע
const TITLE_OVERLAP_THRESHOLD = 0.5 // לפחות מחצית ממילות הכותרת (הארוכה מבין השתיים) חופפות

function normalizeWords(title: string): Set<string> {
  return new Set(
    title
      .replace(/["'׳״.,:;!?()[\]{}]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 1),
  )
}

function titleOverlapScore(a: string, b: string): number {
  const wa = normalizeWords(a)
  const wb = normalizeWords(b)
  if (wa.size === 0 || wb.size === 0) return 0
  let shared = 0
  for (const w of wa) if (wb.has(w)) shared++
  return shared / Math.max(wa.size, wb.size)
}

const isActive = (status: Item['status']) => status !== 'done' && status !== 'cancelled'

// מחפש פריט קיים שכנראה "אותו אירוע" כמו הטיוטה שסווגה כרגע: אותו domain, פתוח, נוצר בעצמו
// ידנית/מ-Gmail (לא RFQ/תוכן וכו'), עם תאריך בטווח סביר וכותרת חופפת מספיק. מחזיר את ההתאמה
// הכי טובה שעוברת את הסף, או null אם אין התאמה בטוחה מספיק.
export function findLikelyDuplicate(items: Item[], mapped: MappedDraft): Item | null {
  if (!mapped.domain || !mapped.date) return null
  let best: { item: Item; score: number } | null = null
  for (const it of items) {
    if (it.domain !== mapped.domain) continue
    if (!isActive(it.status)) continue
    if (!it.date) continue
    if (it.eventSource && it.eventSource !== 'gmail' && it.eventSource !== 'manual') continue
    const days = Math.abs((new Date(it.date).getTime() - new Date(mapped.date).getTime()) / DAY_MS)
    if (days > DATE_WINDOW_DAYS) continue
    const score = titleOverlapScore(it.title, mapped.title)
    if (score >= TITLE_OVERLAP_THRESHOLD && (!best || score > best.score)) best = { item: it, score }
  }
  return best?.item ?? null
}

export function formatShortDate(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()}/${d.getMonth() + 1}`
}
