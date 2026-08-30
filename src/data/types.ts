export type DomainId = 'work' | 'studies' | 'personal' | 'home' | 'health' | 'finance' | 'personalDevelopment'

export type ItemKind = 'task' | 'event' | 'reminder' | 'waiting'
export type WaitingType = 'my_followup' | 'other_pending' | 'my_approval'
export type Priority = 'low' | 'medium' | 'high'
export type ItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled' | 'waiting'
export type ProjectStatus = 'in_progress' | 'done'
export type Theme = 'light' | 'dark' | 'system'
export type InboxSource = 'typed' | 'spoken' | 'email'
export type EmailAccountId = 'work' | 'personal'
export type InboxStatus = 'pending' | 'sorted' | 'deleted'
export type ListType =
  | 'shopping'
  | 'errands'
  | 'meetings'
  | 'studies_admin'
  | 'content'
  | 'brands'
  | 'general'
  | 'maintenance'
  | 'bills'
  | 'library'
  | 'quotes'
  | 'articles'
  | 'ideas'

// קטגוריות הוצאה קבועות לחשבונות בית (listType: 'bills') — ראו Item.category.
export const BILL_CATEGORIES = ['סופר', 'חשמל', 'מים', 'אינטרנט', 'ועד בית', 'אחר'] as const

export interface Item {
  id: string
  title: string
  kind: ItemKind
  domain: DomainId
  destination?: string
  listType?: ListType
  projectId?: string
  brandId?: string
  contentItemId?: string
  date?: string
  startTime?: string
  endTime?: string
  priority: Priority
  status: ItemStatus
  waitingType?: WaitingType
  personName?: string
  notes?: string
  amount?: number
  currency?: string
  category?: string // סיווג הוצאה — רלוונטי רק ל-listType: 'bills', ראו BILL_CATEGORIES
  // שדות "ידע ותרבות" (הספרייה שלי / ציטוטים / מאמרים / רעיונות) — Additive, אופציונליים,
  // בשימוש רק כשרלוונטי להקשר. לא נוגעים בשום Item קיים אחר.
  itemSubtype?: string // סוג מקור/מדיה: book | article | movie | series | lecture | other
  source?: string // שם המקור (ציטוטים)
  topic?: string // הקשר/נושא (ציטוטים, רעיונות)
  author?: string // מחבר/במאי (ציטוטים, הספרייה שלי)
  rating?: number // דירוג אישי (הספרייה שלי)
  stage?: string // שלב עבודה כללי, למשל למאמרים: idea | draft | editing | done
  summary?: string // תקציר/רעיון קצר (מאמרים)
  convertTo?: string // 'article' | 'project' — סימון עתידי בלבד (רעיונות)
  // שדות עמוד לימודים — Additive, אופציונליים, רלוונטיים רק כש-domain === 'studies'.
  courseId?: string // קישור לקורס (src/data/studyTypes.ts), לא משפיע על פריטים בתחומים אחרים
  studyKind?: 'assignment' | 'reading' | 'exam' | 'submission'
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Project {
  id: string
  name: string
  domain: DomainId
  description?: string
  status: ProjectStatus
  progress: number
  nextStep: string
  dueDate?: string
  isStuck: boolean
  stuckReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InboxEntry {
  id: string
  text: string
  source: InboxSource
  createdAt: string
  status: InboxStatus
  sortedItemId?: string
  // רלוונטי רק כש-source === 'email' — הקשר לתצוגה במסך המיון, לא משפיע על הלוגיקה עצמה.
  emailAccount?: EmailAccountId
  emailFrom?: string
  emailSubject?: string
}
