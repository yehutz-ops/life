// עזרי תאריך משותפים ליומן המאוחד — מרכזים במקום אחד את מה ששלוש מימושי היומן הקודמים
// (CalendarPage, MiniDomainCalendar, WeekCalendar) שכפלו כל אחד בנפרד.
export const WEEKDAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
export const WEEKDAY_FULL = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת']
export const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export function startOfWeek(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  c.setDate(c.getDate() - c.getDay())
  return c
}

// 42 תאים (6 שבועות) — תמיד מתחילים ביום א' של השבוע שמכיל את היום הראשון בחודש, כך שהרשת
// תמיד שלמה ועקבית גם כשהחודש נפתח/נסגר באמצע שבוע.
export function monthGridCells(monthCursor: Date): Date[] {
  const gridStart = startOfWeek(startOfMonth(monthCursor))
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    return d
  })
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`
}
