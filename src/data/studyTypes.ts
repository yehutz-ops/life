// מקור הרשומה — מוכן מראש לאינטגרציות עתידיות (Gmail / למדה / אינ-בר). כרגע כל הרשומות נוצרות ידנית,
// אבל השדה קיים מהתחלה כדי שאפשר יהיה לחבר מקורות חיצוניים בלי שינוי סכמה, כולל זיהוי התנגשויות בין מקורות.
export type StudyRecordSource = 'manual' | 'gmail' | 'lemida' | 'inbar'

export type CourseStatus = 'in_progress' | 'completed'

export interface Course {
  id: string
  name: string
  code?: string
  category?: string
  status: CourseStatus
  credits?: number
  nextSessionLabel?: string // טקסט חופשי ידני — אין עדיין מערכת שעות אמיתית
  recordSource: StudyRecordSource
  sourceRef?: string // מזהה/קישור חיצוני, לשימוש עתידי בהתאמת רשומות ממקור חיצוני
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Grade {
  id: string
  courseId: string
  label: string // לדוגמה "מבחן אמצע", "עבודה 1", "ציון סופי"
  value: number
  weight?: number // אחוז מהציון הסופי בקורס, אם ידוע
  date?: string
  recordSource: StudyRecordSource
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DegreeRequirementCategory {
  id: string
  label: string // לדוגמה "יהדות", "בית מדרש", "דרישות תואר"
  creditsRequired: number
  creditsCompleted: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export type StudyMaterialType = 'pdf' | 'summary' | 'presentation' | 'recording' | 'other'

export interface StudyMaterial {
  id: string
  courseId: string
  title: string
  type: StudyMaterialType
  url?: string // קישור בלבד — לא נשמר קובץ, ראו הערה ב-shipmentTypes.ts לתבנית Blob אם יידרש בעתיד
  notes?: string
  recordSource: StudyRecordSource
  createdAt: string
  updatedAt: string
}
