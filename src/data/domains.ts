import { DomainId } from './types'

export interface DomainConfig {
  id: DomainId
  name: string
  icon: string
  path: string
  comingSoon: string
  classes: {
    bg: string
    text: string
    chip: string
    dot: string
    bar: string
  }
}

export const domainList: DomainConfig[] = [
  {
    id: 'work',
    name: 'עבודה',
    icon: '💼',
    path: '/work',
    comingSoon: 'יוצרי תוכן ושיתופי פעולה, מותגים והשקות, מרכז תוכן, ספקים ומשלוחים, עובדים',
    classes: {
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      chip: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
      dot: 'bg-blue-500',
      bar: 'bg-blue-500',
    },
  },
  {
    id: 'studies',
    name: 'לימודים',
    icon: '🎓',
    path: '/studies',
    comingSoon: 'קורסים, מטלות, מבחנים, תוכנית לימוד ומעקב נקודות זכות',
    classes: {
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      chip: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
      dot: 'bg-purple-500',
      bar: 'bg-purple-500',
    },
  },
  {
    id: 'personal',
    name: 'אישי',
    icon: '👤',
    path: '/personal',
    comingSoon: 'סידורים, תשלומים ומסמכים אישיים, משפחה, תהליכים בירוקרטיים',
    classes: {
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-teal-300',
      chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
      dot: 'bg-teal-500',
      bar: 'bg-teal-500',
    },
  },
  {
    id: 'home',
    name: 'בית',
    icon: '🏠',
    path: '/household',
    comingSoon: 'רשימת קניות, תחזוקה ותיקונים, ציוד לבית, אקווריום, תשלומים הקשורים לבית',
    classes: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
      dot: 'bg-emerald-500',
      bar: 'bg-emerald-500',
    },
  },
  {
    id: 'health',
    name: 'בריאות וספורט',
    icon: '🥊',
    path: '/health',
    comingSoon: 'יומן אימונים, מטרות אישיות ומעקב התקדמות',
    classes: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
    },
  },
  {
    id: 'finance',
    name: 'כספים',
    icon: '💰',
    path: '/finance',
    comingSoon: 'מעקב השקעות, התחייבויות ותשלומים, ויעדים כספיים',
    classes: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
      dot: 'bg-amber-500',
      bar: 'bg-amber-500',
    },
  },
  {
    id: 'personalDevelopment',
    name: 'פיתוח אישי ויוזמות',
    icon: '💡',
    path: '/personal-development',
    comingSoon: 'מאגר רעיונות, פרויקטים צדדיים ומטרות לטווח ארוך',
    classes: {
      bg: 'bg-violet-50 dark:bg-violet-950/40',
      text: 'text-violet-700 dark:text-violet-300',
      chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300',
      dot: 'bg-violet-500',
      bar: 'bg-violet-500',
    },
  },
]

export function getDomain(id: DomainId): DomainConfig {
  return domainList.find((d) => d.id === id)!
}
