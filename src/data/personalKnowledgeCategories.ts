import { ListType } from './types'
import { QuickAddField } from '../components/hub/QuickAddPopover'

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
  // טופס ה-Quick Add (QuickAddPopover) — שדות ראשיים ומשניים ("פרטים נוספים") מותאמים לתחום.
  quickAddTitle: string
  quickAddFields: QuickAddField[]
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
    quickAddTitle: 'פריט חדש בספרייה',
    quickAddFields: [
      {
        key: 'itemSubtype',
        label: 'סוג',
        type: 'select',
        required: true,
        options: [
          { value: 'book', label: 'ספר' },
          { value: 'movie', label: 'סרט' },
          { value: 'series', label: 'סדרה' },
        ],
      },
      { key: 'title', label: 'שם', type: 'text', required: true, placeholder: 'שם הספר / הסרט / הסדרה' },
      {
        key: 'status',
        label: 'סטטוס',
        type: 'select',
        options: [
          { value: 'open', label: 'רוצה לקרוא / לראות' },
          { value: 'in_progress', label: 'בתהליך' },
          { value: 'done', label: 'סיימתי' },
        ],
      },
      { key: 'rating', label: 'דירוג אישי (1-5)', type: 'number', secondary: true, placeholder: '1-5' },
      { key: 'author', label: 'מחבר / במאי', type: 'text', secondary: true },
      { key: 'notes', label: 'הערה קצרה', type: 'textarea', secondary: true },
    ],
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
    quickAddTitle: 'ציטוט או רשומת קריאה חדשה',
    quickAddFields: [
      { key: 'title', label: 'הציטוט / העובדה / הקטע שרוצים לשמור', type: 'textarea', required: true },
      {
        key: 'itemSubtype',
        label: 'סוג מקור',
        type: 'select',
        options: [
          { value: 'book', label: 'ספר' },
          { value: 'article', label: 'מאמר' },
          { value: 'movie', label: 'סרט' },
          { value: 'series', label: 'סדרה' },
          { value: 'lecture', label: 'הרצאה' },
          { value: 'other', label: 'אחר' },
        ],
      },
      { key: 'source', label: 'שם המקור', type: 'text' },
      { key: 'topic', label: 'הקשר / נושא', type: 'text', placeholder: "לדוגמה: ז'בוטינסקי וביאליק" },
      { key: 'author', label: 'מחבר', type: 'text', secondary: true },
      { key: 'notes', label: 'פרטים נוספים', type: 'textarea', secondary: true, placeholder: 'עמוד/פרק, דמות קשורה, שנה, הערה אישית...' },
    ],
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
    quickAddTitle: 'מאמר חדש',
    quickAddFields: [
      { key: 'title', label: 'כותרת המאמר', type: 'text', required: true },
      { key: 'summary', label: 'רעיון / תקציר קצר', type: 'textarea' },
      {
        key: 'stage',
        label: 'סטטוס',
        type: 'select',
        options: [
          { value: 'idea', label: 'רעיון' },
          { value: 'draft', label: 'טיוטה' },
          { value: 'editing', label: 'בעריכה' },
          { value: 'done', label: 'הושלם' },
        ],
      },
    ],
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
    quickAddTitle: 'רעיון או מחשבה חדשים',
    quickAddFields: [
      { key: 'title', label: 'הרעיון / המחשבה', type: 'textarea', required: true },
      { key: 'topic', label: 'נושא / הקשר', type: 'text' },
      { key: 'notes', label: 'הערה', type: 'textarea', secondary: true },
      {
        key: 'convertTo',
        label: 'עשוי להפוך בעתיד ל...',
        type: 'select',
        secondary: true,
        options: [
          { value: 'article', label: 'מאמר' },
          { value: 'project', label: 'פרויקט' },
        ],
      },
    ],
  },
]

export function getKnowledgeCategory(id: KnowledgeCategoryId): KnowledgeCategory {
  return knowledgeCategories.find((c) => c.id === id)!
}
