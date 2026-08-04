import { Item } from './types'

export type WorkCategoryId = 'content' | 'collaborations' | 'shipments' | 'suppliers' | 'campaigns' | 'meetings' | 'operations'

export interface WorkHubCategory {
  id: WorkCategoryId
  name: string
  description: string
  imageSrc: string
  accentHex: string
  ringClass: string
  route: string
  emptyText: string
}

// "מותגים וקידום" מוביל ישירות ל-/work/brands הקיים ואינו חלק מ-WorkCategoryPage — יש שם כבר מערכת מלאה.
export const workBrandsCategory = {
  id: 'brands' as const,
  name: 'מותגים וקידום',
  description: 'ניהול מותגים, השקות וקידום',
  imageSrc: '/hub-images/work/brands.jpg',
  accentHex: '#7C5CBF',
  ringClass: 'focus-visible:ring-[#7C5CBF]',
  route: '/work/brands',
}

export const workHubCategories: WorkHubCategory[] = [
  {
    id: 'content',
    name: 'תוכן וסושיאל',
    description: 'יצירת תוכן, פוסטים וסושיאל',
    imageSrc: '/hub-images/work/content.jpg',
    accentHex: '#12897A',
    ringClass: 'focus-visible:ring-[#12897A]',
    route: '/work/content',
    emptyText: 'אין כרגע פריטי תוכן',
  },
  {
    id: 'collaborations',
    name: 'שיתופי פעולה ומשפיענים',
    description: 'משפיענים ושותפויות',
    imageSrc: '/hub-images/work/collaborations.jpg',
    accentHex: '#D9622B',
    ringClass: 'focus-visible:ring-[#D9622B]',
    route: '/work/collaborations',
    emptyText: 'אין כרגע שיתופי פעולה פתוחים',
  },
  {
    id: 'shipments',
    name: 'משלוחים והזמנות',
    description: 'מעקב משלוחים והזמנות',
    imageSrc: '/hub-images/work/shipments.jpg',
    accentHex: '#3557D6',
    ringClass: 'focus-visible:ring-[#3557D6]',
    route: '/work/shipments',
    emptyText: 'אין כרגע משלוחים פעילים',
  },
  {
    id: 'suppliers',
    name: 'ספקים ויבוא',
    description: 'ספקים, מסמכים ויבוא',
    imageSrc: '/hub-images/work/suppliers.jpg',
    accentHex: '#C98A1E',
    ringClass: 'focus-visible:ring-[#C98A1E]',
    route: '/work/suppliers',
    emptyText: 'אין כרגע פריטים הקשורים לספקים',
  },
  {
    id: 'campaigns',
    name: 'קמפיינים',
    description: 'קמפיינים והשקות',
    imageSrc: '/hub-images/work/campaigns.jpg',
    accentHex: '#C23B5E',
    ringClass: 'focus-visible:ring-[#C23B5E]',
    route: '/work/campaigns',
    emptyText: 'אין כרגע קמפיינים',
  },
  {
    id: 'meetings',
    name: 'פגישות',
    description: 'פגישות ואירועי עבודה',
    imageSrc: '/hub-images/work/meetings.jpg',
    accentHex: '#6B4FA0',
    ringClass: 'focus-visible:ring-[#6B4FA0]',
    route: '/work/meetings',
    emptyText: 'אין פגישות קרובות',
  },
  {
    id: 'operations',
    name: 'תפעול',
    description: 'משימות ופרויקטים תפעוליים',
    imageSrc: '/hub-images/work/operations.jpg',
    accentHex: '#4C7A3E',
    ringClass: 'focus-visible:ring-[#4C7A3E]',
    route: '/work/operations',
    emptyText: 'אין משימות תפעול פתוחות',
  },
]

export function getWorkCategory(id: WorkCategoryId): WorkHubCategory {
  return workHubCategories.find((c) => c.id === id)!
}

// סיווג זמני של פריטי עבודה לקטגוריות ההאב, לפי מילות מפתח אמיתיות בכותרת/הערות/personName —
// עד שיתווספו שדות סיווג מסודרים ל-Item. לא נכתב בחזרה ל-IndexedDB, לא יוצר עותקים.
// פריטים עם brandId מוצגים רק תחת "מותגים וקידום" (/work/brands) ולא נכנסים לסיווג הזה כלל,
// כדי שלא יופיעו כפול. סדר עדיפות בין הקטגוריות הנותרות: פגישה → משלוח → ספק → שיתוף פעולה → תפעול (ברירת מחדל).
export function classifyWorkItem(item: Item): WorkCategoryId | null {
  if (item.brandId) return null
  if (item.kind === 'event') return 'meetings'
  const text = `${item.title} ${item.notes ?? ''} ${item.personName ?? ''}`
  if (text.includes('משלוח')) return 'shipments'
  if (text.includes('ספק')) return 'suppliers'
  if (item.personName) return 'collaborations'
  return 'operations'
}
