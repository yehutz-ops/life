import { DomainId } from './types'

export interface DomainConfig {
  id: DomainId
  name: string
  icon: string
  path: string
  imageSrc: string // נתיב תמונת רקע לכרטיס בדף הבית; אם הקובץ לא קיים עדיין, הכרטיס נופל לגרדיאנט+אייקון
  description: string
  comingSoon: string
  classes: {
    bg: string
    text: string
    chip: string
    dot: string
    bar: string
    ring: string
  }
  // צבע Accent ייעודי לכרטיסי הריבוע בדף הבית החדש — נפרד לגמרי מ-classes (שממשיך לשמש
  // ללא שינוי את התג/הכרטיסייה הישנה בכל שאר העמודים), כדי לא לשנות את המראה של עמודים אחרים.
  homeAccent?: {
    hex: string
    text: string
    bar: string
    ring: string
  }
}

export const domainList: DomainConfig[] = [
  {
    id: 'work',
    name: 'עבודה',
    icon: '💼',
    path: '/work',
    imageSrc: '/domain-images/work.jpg',
    description: 'שיתופי פעולה, מותגים ותוכן',
    comingSoon: 'יוצרי תוכן ושיתופי פעולה, מותגים והשקות, מרכז תוכן, ספקים ומשלוחים, עובדים',
    classes: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      text: 'text-amber-800 dark:text-amber-300',
      chip: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
      dot: 'bg-amber-600',
      bar: 'bg-amber-600',
      ring: 'ring-amber-200',
    },
    homeAccent: {
      hex: '#3557D6',
      text: 'text-[#3557D6]',
      bar: 'bg-[#3557D6]',
      ring: 'focus-visible:ring-[#3557D6]',
    },
  },
  {
    id: 'studies',
    name: 'לימודים',
    icon: '🎓',
    path: '/studies',
    imageSrc: '/domain-images/studies.jpg',
    description: 'קורסים, מטלות ומבחנים',
    comingSoon: 'קורסים, מטלות, מבחנים, תוכנית לימוד ומעקב נקודות זכות',
    classes: {
      bg: 'bg-orange-50 dark:bg-orange-950/30',
      text: 'text-orange-800 dark:text-orange-300',
      chip: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
      dot: 'bg-orange-600',
      bar: 'bg-orange-600',
      ring: 'ring-orange-200',
    },
    homeAccent: {
      hex: '#12897A',
      text: 'text-[#12897A]',
      bar: 'bg-[#12897A]',
      ring: 'focus-visible:ring-[#12897A]',
    },
  },
  {
    id: 'personal',
    name: 'אישי',
    icon: '👤',
    path: '/personal',
    imageSrc: '/domain-images/personal.jpg',
    description: 'סידורים, משפחה ומסמכים',
    comingSoon: 'סידורים, תשלומים ומסמכים אישיים, משפחה, תהליכים בירוקרטיים',
    classes: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      text: 'text-rose-800 dark:text-rose-300',
      chip: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
      ring: 'ring-rose-200',
    },
    homeAccent: {
      hex: '#D9622B',
      text: 'text-[#D9622B]',
      bar: 'bg-[#D9622B]',
      ring: 'focus-visible:ring-[#D9622B]',
    },
  },
  {
    id: 'home',
    name: 'בית',
    icon: '🏠',
    path: '/household',
    imageSrc: '/domain-images/home.jpg',
    description: 'קניות, תחזוקה ותשלומים',
    comingSoon: 'רשימת קניות, תחזוקה ותיקונים, ציוד לבית, אקווריום, תשלומים הקשורים לבית',
    classes: {
      bg: 'bg-lime-50 dark:bg-lime-950/30',
      text: 'text-lime-800 dark:text-lime-300',
      chip: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300',
      dot: 'bg-lime-600',
      bar: 'bg-lime-600',
      ring: 'ring-lime-200',
    },
    homeAccent: {
      hex: '#5B7A3E',
      text: 'text-[#5B7A3E]',
      bar: 'bg-[#5B7A3E]',
      ring: 'focus-visible:ring-[#5B7A3E]',
    },
  },
  {
    id: 'health',
    name: 'בריאות וספורט',
    icon: '🥊',
    path: '/health',
    imageSrc: '/domain-images/health.jpg',
    description: 'אימונים ומטרות בריאות',
    comingSoon: 'יומן אימונים, מטרות אישיות ומעקב התקדמות',
    classes: {
      bg: 'bg-yellow-50 dark:bg-yellow-950/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      chip: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
      dot: 'bg-yellow-600',
      bar: 'bg-yellow-600',
      ring: 'ring-yellow-200',
    },
  },
  {
    id: 'finance',
    name: 'כספים',
    icon: '💰',
    path: '/finance',
    imageSrc: '/domain-images/finance.jpg',
    description: 'השקעות, תשלומים ויעדים',
    comingSoon: 'מעקב השקעות, התחייבויות ותשלומים, ויעדים כספיים',
    classes: {
      bg: 'bg-stone-100 dark:bg-stone-800/50',
      text: 'text-stone-700 dark:text-stone-300',
      chip: 'bg-stone-200 text-stone-700 dark:bg-stone-700 dark:text-stone-300',
      dot: 'bg-stone-500',
      bar: 'bg-stone-500',
      ring: 'ring-stone-300',
    },
    homeAccent: {
      hex: '#6B4FA0',
      text: 'text-[#6B4FA0]',
      bar: 'bg-[#6B4FA0]',
      ring: 'focus-visible:ring-[#6B4FA0]',
    },
  },
  {
    id: 'personalDevelopment',
    name: 'פיתוח אישי ויוזמות',
    icon: '💡',
    path: '/personal-development',
    imageSrc: '/domain-images/personalDevelopment.jpg',
    description: 'רעיונות ופרויקטים אישיים',
    comingSoon: 'מאגר רעיונות, פרויקטים צדדיים ומטרות לטווח ארוך',
    classes: {
      bg: 'bg-violet-50 dark:bg-violet-950/30',
      text: 'text-violet-800 dark:text-violet-300',
      chip: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
      dot: 'bg-violet-500',
      bar: 'bg-violet-500',
      ring: 'ring-violet-200',
    },
  },
]

export function getDomain(id: DomainId): DomainConfig {
  return domainList.find((d) => d.id === id)!
}
