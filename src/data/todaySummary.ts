// סיכום "היום שלכם" עבור כרטיס הסיידבר. בכוונה לא קורא ל-Gmail (fetchHomeEmails) — הסיידבר מחובר על כל
// עמוד באפליקציה, ולכן חייב להישאר קריאה מקומית וזולה על ה-store הקיים בלבד, בלי קריאת רשת בכל ניווט.
// מספר "המיילים הדורשים טיפול" נגזר מ-inboxEntries הממתינים (אותה הגדרה כמו emailInboxCount בדף הבית),
// לא מרשימת המיילים האחרונים מ-Gmail.
//
// הסיכום מחזיר גם ספירות "הושלם" ולא רק "פתוח", כי הכרטיס מנסח טקסט לפי מצב: יש הבדל בין
// "סיימת את הכל" לבין "אין בכלל משימות היום", ואי אפשר להבחין ביניהם מספירת הפתוחים לבדה.
import { Item, ItemStatus, InboxEntry } from './types'

const isActive = (status: ItemStatus) => status !== 'done' && status !== 'cancelled'

export interface TodaySummary {
  tasksOpen: number
  tasksDone: number
  nextEvent: { title: string; time: string } | null
  eventsToday: number
  emailsNeedingAttention: number
}

export function computeTodaySummary(items: Item[], inboxEntries: InboxEntry[], todayIso: string, nowHHMM: string): TodaySummary {
  const dayItems = items.filter((it) => it.date === todayIso)
  const openItems = dayItems
    .filter((it) => isActive(it.status))
    .sort((a, b) => (a.startTime ?? '99:99').localeCompare(b.startTime ?? '99:99'))

  const openEvents = openItems.filter((it) => it.kind === 'event' && it.startTime)
  // הפגישה הקרובה שעוד לא התחילה. אם כולן כבר עברו — אין "הבאה", וזה מצב נפרד בניסוח.
  const upcoming = openEvents.find((it) => (it.startTime as string) >= nowHHMM) ?? null

  return {
    tasksOpen: openItems.filter((it) => it.kind !== 'event').length,
    tasksDone: dayItems.filter((it) => it.kind !== 'event' && it.status === 'done').length,
    nextEvent: upcoming ? { title: upcoming.title, time: upcoming.startTime as string } : null,
    eventsToday: dayItems.filter((it) => it.kind === 'event').length,
    emailsNeedingAttention: inboxEntries.filter((e) => e.status === 'pending' && e.source === 'email').length,
  }
}
