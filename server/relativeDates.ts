// חישוב תאריכים יחסיים ("מחר", "יום שלישי הקרוב" וכו') בקוד דטרמיניסטי — לא סומכים על ה-AI
// לחשב בעצמו חשבון ימים, כי זה מקום שבו מודלי שפה טועים בקלות. התאריך היחיד שה-AI מקבל
// לחישוב הוא היום הנוכחי; כל תאריך יחסי אחר מחושב כאן ומועבר לו מוכן, וגם מאומת בדיעבד.

const WEEKDAY_ORDER = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] // index תואם ל-JS Date#getUTCDay()

function addDaysToISO(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function isoWeekdayIndex(isoDate: string): number {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay()
}

export interface UpcomingDates {
  todayISO: string
  tomorrow: string
  dayAfterTomorrow: string
  inOneWeek: string
  byWeekdayIndex: string[] // אינדקס 0=ראשון..6=שבת -> התאריך הקרוב של אותו יום (אף פעם לא היום עצמו)
  table: { label: string; iso: string }[]
}

export function computeUpcomingDates(todayISO: string): UpcomingDates {
  const todayIdx = isoWeekdayIndex(todayISO)
  const byWeekdayIndex: string[] = []
  for (let idx = 0; idx < 7; idx++) {
    // "הקרוב" = ההופעה העתידית הבאה של אותו יום — גם אם היום עצמו הוא אותו יום בשבוע, מתכוונים לשבוע הבא.
    let delta = (idx - todayIdx + 7) % 7
    if (delta === 0) delta = 7
    byWeekdayIndex[idx] = addDaysToISO(todayISO, delta)
  }
  const tomorrow = addDaysToISO(todayISO, 1)
  const dayAfterTomorrow = addDaysToISO(todayISO, 2)
  const inOneWeek = addDaysToISO(todayISO, 7)

  const table = [
    { label: 'היום', iso: todayISO },
    { label: 'מחר', iso: tomorrow },
    { label: 'מחרתיים', iso: dayAfterTomorrow },
    { label: 'בעוד שבוע', iso: inOneWeek },
    ...WEEKDAY_ORDER.map((name, idx) => ({ label: `יום ${name} הקרוב`, iso: byWeekdayIndex[idx] })),
  ]

  return { todayISO, tomorrow, dayAfterTomorrow, inOneWeek, byWeekdayIndex, table }
}

export interface MentionedDate {
  label: string
  iso: string
}

// מזהה אזכור מפורש של תאריך יחסי בטקסט המקורי של המשתמש, כדי לוודא (ובמידת הצורך לתקן)
// את התאריך שה-AI החזיר — קו הגנה שני, בלתי תלוי בחישוב הפנימי של המודל.
export function findMentionedRelativeDate(text: string, dates: UpcomingDates): MentionedDate | null {
  if (/מחרתיים/.test(text)) return { label: 'מחרתיים', iso: dates.dayAfterTomorrow }
  if (/מחר(?!תיים)/.test(text)) return { label: 'מחר', iso: dates.tomorrow }
  if (/בעוד\s*שבוע/.test(text)) return { label: 'בעוד שבוע', iso: dates.inOneWeek }

  const dayPattern = /(?:ב\s*)?יום\s+(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)/g
  let match: RegExpExecArray | null
  let last: MentionedDate | null = null
  while ((match = dayPattern.exec(text))) {
    const idx = WEEKDAY_ORDER.indexOf(match[1])
    if (idx >= 0) last = { label: `יום ${match[1]}`, iso: dates.byWeekdayIndex[idx] }
  }
  if (last) return last

  if (/(?:^|[^א-ת])שבת(?:[^א-ת]|$)/.test(text)) {
    return { label: 'שבת', iso: dates.byWeekdayIndex[6] }
  }
  return null
}
