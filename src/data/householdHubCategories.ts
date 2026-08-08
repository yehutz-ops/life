import { ListType } from './types'

export type HouseholdCategoryId = 'shopping' | 'maintenance' | 'bills'

export interface HouseholdHubCategory {
  id: HouseholdCategoryId
  name: string
  description: string
  imageSrc: string
  listType: ListType
  destination: string
  emptyText: string
  addPlaceholder: string
}

// צבע Accent אחד ויחיד לכל האתר (זהה לצבע ה-Accent הפונקציונלי הקיים כבר בסיידבר/כפתורים) —
// לפי העיקרון החדש: לתחום אין Theme משלו, הצבע משמש רק לפרטים קטנים ופונקציונליים.
export const SITE_ACCENT_HEX = '#92400E'
export const SITE_ACCENT_RING = 'focus-visible:ring-[#92400E]'

export const householdHubCategories: HouseholdHubCategory[] = [
  {
    id: 'shopping',
    name: 'רשימת קניות',
    description: 'הפתק על המקרר',
    imageSrc: '/hub-images/household/shopping.jpg',
    listType: 'shopping',
    destination: 'רשימת קניות',
    emptyText: 'רשימת הקניות ריקה',
    addPlaceholder: 'הוסף לרשימת הקניות...',
  },
  {
    id: 'maintenance',
    name: 'תחזוקה וארגון',
    description: 'תיקונים, בעלי מקצוע וסידורי בית',
    imageSrc: '/hub-images/household/maintenance.jpg',
    listType: 'maintenance',
    destination: 'תחזוקה וארגון',
    emptyText: 'אין כרגע משימות תחזוקה פתוחות',
    addPlaceholder: 'הוסף לתחזוקה וארגון...',
  },
  {
    id: 'bills',
    name: 'חשבונות הבית',
    description: 'תשלומים ומעקב חשבונות',
    imageSrc: '/hub-images/household/bills.jpg',
    listType: 'bills',
    destination: 'חשבונות הבית',
    emptyText: 'אין כרגע חשבונות פתוחים',
    addPlaceholder: 'הוסף חשבון...',
  },
]

export function getHouseholdCategory(id: HouseholdCategoryId): HouseholdHubCategory {
  return householdHubCategories.find((c) => c.id === id)!
}
