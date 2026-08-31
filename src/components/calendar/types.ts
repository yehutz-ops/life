// "אירוע יומן" הוא ייצוג-תצוגה בלבד, לא ישות שנשמרת. כל CalendarEvent נבנה בזמן ריצה מתוך רשומה
// אמיתית שכבר קיימת (Item, BrandContentItem וכו') — כך שהיומן המאוחד יכול להציג את אותה רשומה
// בכמה מקומות (יומן כללי / יומן domain / כרטיס בדף הבית) בלי לשכפל אותה אף פעם.
import { DomainId, EventSource, EVENT_SOURCE_LABEL } from '../../data/types'

export type EventProvenance = EventSource
export const PROVENANCE_LABEL = EVENT_SOURCE_LABEL

export interface CalendarEvent {
  id: string
  title: string
  date: string // YYYY-MM-DD
  time?: string // HH:MM — ללא שעה = "כל היום"
  endTime?: string
  domain: DomainId | 'content'
  kindLabel?: string // תווית קצרה לסוג (משימה/אירוע/תזכורת/תוכן) לתצוגה בפאנל היום הנבחר
  done?: boolean
  // אירוע שנוצר אוטומטית ע"י checkEmailAccount.ts בביטחון בינוני — ממתין לאישור/עריכה של המשתמש.
  pending?: boolean
  source?: EventProvenance // מקור הרשומה — מוצג כתווית קטנה בפרטי האירוע כשקיים
  onOpen: () => void
}

// גוון accent לכל domain — משמש אך ורק כאינדיקטור קטן (נקודה/מסגרת דקה/רקע קליל), לא לצביעת תא שלם.
export const DOMAIN_EVENT_COLOR: Record<DomainId | 'content', string> = {
  work: '#3557D6', // אינדיגו/כחול
  studies: '#12897A', // טורקיז
  personal: '#D9622B', // טרהקוטה
  home: '#5B7A3E', // זית
  finance: '#6B4FA0', // סגול
  health: '#B8860B',
  personalDevelopment: '#7C3D1D',
  content: '#92400E',
}
