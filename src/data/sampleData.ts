import { Item, Project, InboxEntry } from './types'

// נתוני דוגמה — נטענים פעם אחת בלבד, רק אם המסד ריק לגמרי.
const C = '2026-07-15T09:00:00.000Z'

export const sampleItems: Item[] = [
  { id: 'e1', kind: 'event', title: 'פגישה עם צוות השיווק של FOMOWA', domain: 'work', date: '2026-08-02', startTime: '14:00', endTime: '15:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e2', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-02', startTime: '19:00', endTime: '20:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e3', kind: 'event', title: 'שיחת וידאו עם דניאל (יוצר תוכן)', domain: 'work', date: '2026-08-03', startTime: '11:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e4', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-04', startTime: '19:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e5', kind: 'event', title: 'פגישה עם רואה חשבון', domain: 'finance', date: '2026-08-05', startTime: '10:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e6', kind: 'event', title: 'מבחן במדעי המדינה', domain: 'studies', date: '2026-08-06', startTime: '09:00', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 'e7', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-07', startTime: '19:00', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },

  { id: 'w1', kind: 'waiting', waitingType: 'my_approval', title: 'לאשר תוכן ל-FOMOWA (רילס לאינסטגרם)', domain: 'work', projectId: 'p1', date: '2026-08-02', priority: 'high', status: 'waiting', createdAt: C, updatedAt: C },
  { id: 'w2', kind: 'waiting', waitingType: 'my_followup', title: 'לחזור לדניאל לגבי הסרטון', domain: 'work', date: '2026-08-02', personName: 'דניאל לוי', notes: 'לא העלה את הסרטון שהתחייב אליו', priority: 'medium', status: 'waiting', createdAt: C, updatedAt: C },
  { id: 'w3', kind: 'waiting', waitingType: 'my_followup', title: 'לבדוק סטטוס משלוח בינלאומי מול הספק', domain: 'work', date: '2026-08-05', personName: 'נציג ספק המשלוחים', priority: 'medium', status: 'waiting', createdAt: C, updatedAt: C },
  { id: 'w4', kind: 'waiting', waitingType: 'other_pending', title: 'טיוטת עבודה אקדמית — ממתינה להערות המנחה', domain: 'studies', date: '2026-08-04', personName: 'רכזת הקורס', priority: 'medium', status: 'waiting', createdAt: C, updatedAt: C },

  { id: 't1', kind: 'task', title: 'המשך בניית Life Control Center', domain: 'personalDevelopment', projectId: 'p4', date: '2026-08-02', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 't2', kind: 'task', title: 'לטפל במסמך אישי', domain: 'personal', date: '2026-07-30', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 't3', kind: 'task', title: 'להגיש עבודה אקדמית', domain: 'studies', projectId: 'p2', date: '2026-08-01', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 't4', kind: 'task', title: 'להתכונן למבחן במדעי המדינה', domain: 'studies', date: '2026-08-06', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 't5', kind: 'task', title: 'להשלים סיכום של שיעור', domain: 'studies', date: '2026-08-04', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 't6', kind: 'task', title: 'לבדוק הצעה למערכת שעות לעובדים', domain: 'work', date: '2026-08-08', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 't7', kind: 'task', title: 'לעקוב אחרי משלוח בינלאומי', domain: 'work', date: '2026-08-05', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 't8', kind: 'task', title: 'מעקב אחרי מספר אימונים השבוע', domain: 'health', date: '2026-08-09', priority: 'low', status: 'open', createdAt: C, updatedAt: C },
  { id: 't9', kind: 'task', title: 'לבדוק את האקווריום', domain: 'home', projectId: 'p3', date: '2026-08-03', priority: 'medium', status: 'open', createdAt: C, updatedAt: C },
  { id: 't10', kind: 'task', title: 'לקנות מטאטא', domain: 'home', date: '2026-08-03', priority: 'low', status: 'open', createdAt: C, updatedAt: C },
  { id: 't11', kind: 'task', title: 'לקנות חומר ניקוי', domain: 'home', date: '2026-08-03', priority: 'low', status: 'open', createdAt: C, updatedAt: C },
  { id: 't12', kind: 'task', title: 'מעקב אחרי השקעה', domain: 'finance', date: '2026-08-07', priority: 'low', status: 'open', createdAt: C, updatedAt: C },
  { id: 't13', kind: 'task', title: 'תשלום ביטוח לאומי', domain: 'finance', date: '2026-08-03', priority: 'high', status: 'open', createdAt: C, updatedAt: C },
  { id: 't14', kind: 'task', title: 'לבדוק רעיון לפרויקט צד', domain: 'personalDevelopment', date: '2026-08-12', priority: 'low', status: 'open', createdAt: C, updatedAt: C },

  { id: 't15', kind: 'task', title: 'לשלוח חוזה שיתוף פעולה לספק אריזות', domain: 'work', date: '2026-07-28', priority: 'medium', status: 'done', createdAt: C, updatedAt: C, completedAt: '2026-07-28T12:00:00.000Z' },
  { id: 't16', kind: 'task', title: 'להירשם לסמסטר הבא', domain: 'studies', date: '2026-07-25', priority: 'low', status: 'done', createdAt: C, updatedAt: C, completedAt: '2026-07-25T12:00:00.000Z' },
  { id: 't17', kind: 'task', title: 'לחדש ביטוח רכב', domain: 'personal', date: '2026-07-22', priority: 'medium', status: 'done', createdAt: C, updatedAt: C, completedAt: '2026-07-22T12:00:00.000Z' },
  { id: 't18', kind: 'task', title: 'לקבוע מנוי חדש בחדר הכושר', domain: 'health', date: '2026-07-20', priority: 'low', status: 'done', createdAt: C, updatedAt: C, completedAt: '2026-07-20T12:00:00.000Z' },
  { id: 't19', kind: 'task', title: 'לעדכן תקציב חודשי', domain: 'finance', date: '2026-07-27', priority: 'low', status: 'done', createdAt: C, updatedAt: C, completedAt: '2026-07-27T12:00:00.000Z' },

  { id: 'r1', kind: 'reminder', title: 'לשתות מים לפני האימון', domain: 'health', date: '2026-08-02', priority: 'low', status: 'open', createdAt: C, updatedAt: C },
]

export const sampleProjects: Project[] = [
  {
    id: 'p1',
    name: 'השקת מותג FOMOWA',
    domain: 'work',
    description: 'קמפיין השקה למותג עם יוצרי תוכן',
    status: 'in_progress',
    nextStep: 'לאשר את התוכן האחרון ולתאם תאריך השקה',
    progress: 60,
    isStuck: false,
    createdAt: C,
    updatedAt: C,
  },
  {
    id: 'p2',
    name: 'עבודה סמינריונית — מדעי המדינה',
    domain: 'studies',
    status: 'in_progress',
    nextStep: 'לסיים טיוטה ראשונה',
    dueDate: '2026-08-20',
    progress: 35,
    isStuck: false,
    createdAt: C,
    updatedAt: C,
  },
  {
    id: 'p3',
    name: 'שדרוג האקווריום',
    domain: 'home',
    status: 'in_progress',
    nextStep: 'מחכה שיגיע ציוד שהוזמן',
    progress: 20,
    isStuck: true,
    stuckReason: 'ממתין למשלוח ציוד שהוזמן באינטרנט',
    createdAt: C,
    updatedAt: C,
  },
  {
    id: 'p4',
    name: 'בניית Life Control Center',
    domain: 'personalDevelopment',
    status: 'in_progress',
    nextStep: 'לחבר שמירה מקומית אמיתית',
    progress: 25,
    isStuck: false,
    createdAt: C,
    updatedAt: C,
  },
]

export const sampleInboxEntries: InboxEntry[] = [
  { id: 'i1', text: 'לבדוק אם צריך לחדש מנוי לחדר כושר', source: 'typed', createdAt: C, status: 'pending' },
  { id: 'i2', text: 'לשלוח לינק למישהו', source: 'typed', createdAt: C, status: 'pending' },
]
