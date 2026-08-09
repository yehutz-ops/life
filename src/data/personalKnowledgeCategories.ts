import { ListType } from './types'

export type KnowledgeCategoryId = 'library' | 'quotes' | 'articles' | 'ideas'

export interface KnowledgeCategory {
  id: KnowledgeCategoryId
  name: string
  description: string
  listType: ListType
  destination: string
  addPlaceholder: string
  emptyText: string
  // תוויות לעריכה המצומצמת (QuickNoteModal) — מותאמות לסוג התוכן, בלי שדות תאריך/עדיפות/פרויקט שלא רלוונטיים כאן.
  titleLabel: string
  notesLabel: string
  notesPlaceholder: string
}

export const knowledgeCategories: KnowledgeCategory[] = [
  {
    id: 'library',
    name: 'הספרייה שלי',
    description: 'ספרים, סרטים וסדרות',
    listType: 'library',
    destination: 'הספרייה שלי',
    addPlaceholder: 'הוסף ספר, סרט או סדרה...',
    emptyText: 'הספרייה עדיין ריקה',
    titleLabel: 'שם הספר / הסרט / הסדרה',
    notesLabel: 'פרטים נוספים',
    notesPlaceholder: 'יוצר, סטטוס, עמוד או פרק...',
  },
  {
    id: 'quotes',
    name: 'ציטוטים ורשומות קריאה',
    description: 'ציטוטים ומחשבות מתוך מה שקראת',
    listType: 'quotes',
    destination: 'ציטוטים ורשומות קריאה',
    addPlaceholder: 'הוסף ציטוט או רשומה...',
    emptyText: 'עדיין אין כאן ציטוטים',
    titleLabel: 'הציטוט או הרשומה',
    notesLabel: 'מקור',
    notesPlaceholder: 'שם הספר, המאמר או המחבר...',
  },
  {
    id: 'articles',
    name: 'מאמרים',
    description: 'מאמרים ששווה לחזור אליהם',
    listType: 'articles',
    destination: 'מאמרים',
    addPlaceholder: 'הוסף מאמר...',
    emptyText: 'עדיין אין כאן מאמרים',
    titleLabel: 'כותרת המאמר',
    notesLabel: 'קישור / מקור',
    notesPlaceholder: 'קישור למאמר או שם המקור...',
  },
  {
    id: 'ideas',
    name: 'רעיונות ומחשבות',
    description: 'רעיונות שעולים לך בראש',
    listType: 'ideas',
    destination: 'רעיונות ומחשבות',
    addPlaceholder: 'הוסף רעיון או מחשבה...',
    emptyText: 'עדיין אין כאן רעיונות',
    titleLabel: 'הרעיון',
    notesLabel: 'פרטים נוספים',
    notesPlaceholder: 'הרחבה, הקשר...',
  },
]

export function getKnowledgeCategory(id: KnowledgeCategoryId): KnowledgeCategory {
  return knowledgeCategories.find((c) => c.id === id)!
}
