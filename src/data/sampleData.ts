import { Item, Project } from './types'

// נתוני דוגמה בלבד — לצורך בדיקת המבנה והעיצוב. כל פריט אמיתי מופיע פעם אחת בלבד (מקור מידע אחד),
// עם שדה "kind" שקובע איך הוא מוצג ואילו פעולות מתאימות לו.

export const initialItems: Item[] = [
  // אירועים (עם שעה קבועה)
  { id: 'e1', kind: 'event', title: 'פגישה עם צוות השיווק של FOMOWA', domain: 'work', date: '2026-08-02', time: '14:00', status: 'open' },
  { id: 'e2', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-02', time: '19:00', status: 'open' },
  { id: 'e3', kind: 'event', title: 'שיחת וידאו עם דניאל (יוצר תוכן)', domain: 'work', date: '2026-08-03', time: '11:00', status: 'open' },
  { id: 'e4', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-04', time: '19:00', status: 'open' },
  { id: 'e5', kind: 'event', title: 'פגישה עם רואה חשבון', domain: 'finance', date: '2026-08-05', time: '10:00', status: 'open' },
  { id: 'e6', kind: 'event', title: 'מבחן במדעי המדינה', domain: 'studies', date: '2026-08-06', time: '09:00', status: 'open' },
  { id: 'e7', kind: 'event', title: 'אימון אגרוף תאילנדי', domain: 'health', date: '2026-08-07', time: '19:00', status: 'open' },

  // ממתין לטיפול — מחכה לאישור/החלטה שלי
  { id: 'w1', kind: 'waiting', waitingType: 'my_approval', title: 'לאשר תוכן ל-FOMOWA (רילס לאינסטגרם)', domain: 'work', date: '2026-08-02', priority: 'high', status: 'open' },

  // משימות
  { id: 't1', kind: 'task', title: 'המשך בניית Life Control Center', domain: 'personalDevelopment', date: '2026-08-02', priority: 'high', status: 'open' },
  { id: 't2', kind: 'task', title: 'לטפל במסמך אישי', domain: 'personal', date: '2026-07-30', priority: 'high', status: 'open' },
  { id: 't3', kind: 'task', title: 'להגיש עבודה אקדמית', domain: 'studies', date: '2026-08-01', priority: 'high', status: 'open' },
  { id: 't4', kind: 'task', title: 'להתכונן למבחן במדעי המדינה', domain: 'studies', date: '2026-08-06', priority: 'high', status: 'open' },
  { id: 't5', kind: 'task', title: 'להשלים סיכום של שיעור', domain: 'studies', date: '2026-08-04', priority: 'medium', status: 'open' },
  { id: 't6', kind: 'task', title: 'לבדוק הצעה למערכת שעות לעובדים', domain: 'work', date: '2026-08-08', priority: 'medium', status: 'open' },
  { id: 't7', kind: 'task', title: 'לעקוב אחרי משלוח בינלאומי', domain: 'work', date: '2026-08-05', priority: 'medium', status: 'open' },
  { id: 't8', kind: 'task', title: 'מעקב אחרי מספר אימונים השבוע', domain: 'health', date: '2026-08-09', priority: 'low', status: 'open' },
  { id: 't9', kind: 'task', title: 'לבדוק את האקווריום', domain: 'home', date: '2026-08-03', priority: 'medium', status: 'open' },
  { id: 't10', kind: 'task', title: 'לקנות מטאטא', domain: 'home', date: '2026-08-03', priority: 'low', status: 'open' },
  { id: 't11', kind: 'task', title: 'לקנות חומר ניקוי', domain: 'home', date: '2026-08-03', priority: 'low', status: 'open' },
  { id: 't12', kind: 'task', title: 'מעקב אחרי השקעה', domain: 'finance', date: '2026-08-07', priority: 'low', status: 'open' },
  { id: 't13', kind: 'task', title: 'תשלום ביטוח לאומי', domain: 'finance', date: '2026-08-03', priority: 'high', status: 'open' },
  { id: 't14', kind: 'task', title: 'לבדוק רעיון לפרויקט צד', domain: 'personalDevelopment', date: '2026-08-12', priority: 'low', status: 'open' },

  // הושלמו (לצורך חישוב התקדמות)
  { id: 't15', kind: 'task', title: 'לשלוח חוזה שיתוף פעולה לספק אריזות', domain: 'work', date: '2026-07-28', priority: 'medium', status: 'done' },
  { id: 't16', kind: 'task', title: 'להירשם לסמסטר הבא', domain: 'studies', date: '2026-07-25', priority: 'low', status: 'done' },
  { id: 't17', kind: 'task', title: 'לחדש ביטוח רכב', domain: 'personal', date: '2026-07-22', priority: 'medium', status: 'done' },
  { id: 't18', kind: 'task', title: 'לקבוע מנוי חדש בחדר הכושר', domain: 'health', date: '2026-07-20', priority: 'low', status: 'done' },
  { id: 't19', kind: 'task', title: 'לעדכן תקציב חודשי', domain: 'finance', date: '2026-07-27', priority: 'low', status: 'done' },

  // תזכורת
  { id: 'r1', kind: 'reminder', title: 'לשתות מים לפני האימון', domain: 'health', date: '2026-08-02', priority: 'low', status: 'open' },

  // ממתין לטיפול — אני צריך לחזור למישהו
  { id: 'w2', kind: 'waiting', waitingType: 'my_followup', title: 'לחזור לדניאל לגבי הסרטון', domain: 'work', date: '2026-08-02', personName: 'דניאל לוי', notes: 'לא העלה את הסרטון שהתחייב אליו', status: 'open' },
  { id: 'w3', kind: 'waiting', waitingType: 'my_followup', title: 'לבדוק סטטוס משלוח בינלאומי מול הספק', domain: 'work', date: '2026-08-05', personName: 'נציג ספק המשלוחים', status: 'open' },

  // ממתין לטיפול — מחכים לתגובה של מישהו אחר
  { id: 'w4', kind: 'waiting', waitingType: 'other_pending', title: 'טיוטת עבודה אקדמית — ממתינה להערות המנחה', domain: 'studies', date: '2026-08-04', personName: 'רכזת הקורס', status: 'open' },

  // תיבת כניסה (בלי תחום משויך)
  { id: 'i1', kind: 'task', title: 'לבדוק אם צריך לחדש מנוי לחדר כושר', status: 'open' },
  { id: 'i2', kind: 'task', title: 'לשלוח לינק למישהו', status: 'open' },
]

export const projects: Project[] = [
  {
    id: 'p1',
    name: 'השקת מותג FOMOWA',
    domain: 'work',
    status: 'in_progress',
    nextStep: 'לאשר את התוכן האחרון ולתאם תאריך השקה',
    progress: 60,
    // אין עדיין תאריך השקה סופי — לא ממציאים אחד
  },
  {
    id: 'p2',
    name: 'עבודה סמינריונית — מדעי המדינה',
    domain: 'studies',
    status: 'in_progress',
    nextStep: 'לסיים טיוטה ראשונה',
    dueDate: '2026-08-20',
    progress: 35,
  },
  {
    id: 'p3',
    name: 'שדרוג האקווריום',
    domain: 'home',
    status: 'stuck',
    nextStep: 'מחכה שיגיע ציוד שהוזמן',
    progress: 20,
  },
  {
    id: 'p4',
    name: 'בניית Life Control Center',
    domain: 'personalDevelopment',
    status: 'in_progress',
    nextStep: 'לבנות את מסך הבית והתפריט הראשי',
    progress: 15,
  },
]
