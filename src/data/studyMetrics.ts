// שכבת חישוב טהורה לעמוד הלימודים — פועלת על רשומות גולמיות (קורסים/ציונים/פריטים, שהוזנו ידנית
// כרגע) ומחזירה מספרים/רשימות גזורות, בלי לשמור שום דבר בעצמה. כשבעתיד יתחברו מקורות אמיתיים
// (Gmail/למדה/אינ-בר), רק אופן הזנת הרשומות הגולמיות ישתנה — הפונקציות האלה ימשיכו לעבוד בלי שינוי.
import { Item } from './types'
import { Grade, DegreeRequirementCategory } from './studyTypes'
import { BarPoint } from '../components/finance/BarChart'

function isOpenItem(it: Item): boolean {
  return it.status !== 'done' && it.status !== 'cancelled'
}

export function studyItemsForCourse(items: Item[], courseId: string): Item[] {
  return items.filter((it) => it.domain === 'studies' && it.courseId === courseId)
}

export function openTaskCountForCourse(items: Item[], courseId: string): number {
  return studyItemsForCourse(items, courseId).filter((it) => it.kind !== 'event' && isOpenItem(it)).length
}

export function nextDeadlineForCourse(items: Item[], courseId: string): Item | undefined {
  return studyItemsForCourse(items, courseId)
    .filter((it) => it.date && isOpenItem(it))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))[0]
}

export function courseAverageGrade(grades: Grade[], courseId: string): number | undefined {
  const courseGrades = grades.filter((g) => g.courseId === courseId)
  if (!courseGrades.length) return undefined
  return courseGrades.reduce((sum, g) => sum + g.value, 0) / courseGrades.length
}

export function overallAverageGrade(grades: Grade[]): number | undefined {
  if (!grades.length) return undefined
  return grades.reduce((sum, g) => sum + g.value, 0) / grades.length
}

// מגמת ציונים — ממוין לפי תאריך (או תאריך יצירה אם אין תאריך), עד ל-N האחרונים, מוכן ישירות ל-BarChart.
export function gradeTrend(grades: Grade[], limit = 8): BarPoint[] {
  return [...grades]
    .sort((a, b) => (a.date ?? a.createdAt).localeCompare(b.date ?? b.createdAt))
    .slice(-limit)
    .map((g) => ({ label: g.label, value: g.value }))
}

// הפרש בין הציון האחרון לזה שלפניו — להצגת מגמה ("+2.4") ליד הממוצע. undefined כשאין מספיק נתונים.
export function latestGradeDelta(grades: Grade[]): number | undefined {
  if (grades.length < 2) return undefined
  const sorted = [...grades].sort((a, b) => (a.date ?? a.createdAt).localeCompare(b.date ?? b.createdAt))
  const last = sorted[sorted.length - 1]
  const prev = sorted[sorted.length - 2]
  return Math.round((last.value - prev.value) * 10) / 10
}

export function degreeProgressPercent(categories: DegreeRequirementCategory[]): number {
  const required = categories.reduce((sum, c) => sum + c.creditsRequired, 0)
  if (required <= 0) return 0
  const completed = categories.reduce((sum, c) => sum + c.creditsCompleted, 0)
  return Math.min(100, Math.round((completed / required) * 100))
}

export interface StudyAttention {
  next?: Item
  nextClass?: Item
  nextAssignmentOrReading?: Item
  nextExamOrSubmission?: Item
  latestGrade?: Grade
}

// "עכשיו בלימודים" — כל השדות נגזרים מ-Item/Grade קיימים, שום דבר לא נשמר כאן.
export function computeStudyAttention(items: Item[], grades: Grade[]): StudyAttention {
  const studyItems = items.filter((it) => it.domain === 'studies' && it.date && isOpenItem(it))
  const byDate = [...studyItems].sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const latestGrade = [...grades].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

  return {
    next: byDate[0],
    nextClass: byDate.find((it) => it.kind === 'event'),
    nextAssignmentOrReading: byDate.find((it) => it.studyKind === 'assignment' || it.studyKind === 'reading'),
    nextExamOrSubmission: byDate.find((it) => it.studyKind === 'exam' || it.studyKind === 'submission'),
    latestGrade,
  }
}

export function openStudyItemCount(items: Item[]): number {
  return items.filter((it) => it.domain === 'studies' && it.kind !== 'event' && isOpenItem(it)).length
}

// מספר ימים שלמים עד תאריך (יכול להיות שלילי לתאריך שעבר) — לצורך תצוגות כמו "5 ימים" בכרטיסי סטטוס.
export function daysUntilNumber(iso: string, today = new Date()): number {
  const target = new Date(iso + 'T00:00:00')
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - base.getTime()) / 86400000)
}

export interface UpcomingBuckets {
  today: Item[]
  thisWeek: Item[]
  later: Item[]
}

// כל הפריטים הפתוחים והמתוארכים בתחום הלימודים, מקובצים לשלושה טווחי זמן — משמש לפאנל "דדליינים קרובים".
export function groupUpcomingStudyItems(items: Item[], todayIso: string): UpcomingBuckets {
  const dated = items
    .filter((it) => it.domain === 'studies' && it.date && it.date >= todayIso && isOpenItem(it))
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  const buckets: UpcomingBuckets = { today: [], thisWeek: [], later: [] }
  for (const it of dated) {
    const days = daysUntilNumber(it.date!)
    if (days <= 0) buckets.today.push(it)
    else if (days <= 7) buckets.thisWeek.push(it)
    else buckets.later.push(it)
  }
  return buckets
}
