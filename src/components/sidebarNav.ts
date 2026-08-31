// מבנה הניווט של הסיידבר הראשי (דסקטופ בלבד — MobileTabBar ממשיך להשתמש ב-coreLinks הקיים ב-navLinks.ts
// ולא נגע). בכוונה שטוח ומצומצם: כל domain חושף רק 2 קיצורי דרך נבחרים, לא את כל תת-הדפים הקיימים.
import {
  HomeIcon,
  CalendarIcon,
  ChecklistIcon,
  BriefcaseIcon,
  TruckIcon,
  TagIcon,
  GraduationCapIcon,
  BookIcon,
  PersonIcon,
  QuoteIcon,
  WalletIcon,
  ChartIcon,
  ReceiptIcon,
  WrenchIcon,
  SearchIcon,
  SettingsIcon,
  ClipboardIcon,
  LeafIcon,
  CartIcon,
} from './hub/hubIcons'

export interface SidebarChild {
  label: string
  to: string
  icon: (props: { className?: string }) => JSX.Element
}

export interface SidebarGroup {
  id: string
  label: string
  to: string
  icon: (props: { className?: string }) => JSX.Element
  children: SidebarChild[]
}

// תמיד גלויים, לא בתוך accordion — בית / יומן / משימות.
export const globalNavLinks: SidebarChild[] = [
  { label: 'בית', to: '/', icon: HomeIcon },
  { label: 'יומן', to: '/calendar', icon: CalendarIcon },
  { label: 'משימות', to: '/tasks', icon: ChecklistIcon },
]

// חמש קבוצות ה-domain, כל אחת עם עד 2 קיצורי דרך. כתובות היעד לקיצורים בוחרות תמיד את הנתיב
// הקיים המדויק ביותר (routes אמיתיים כמו /work/shipments), ואם אין עמוד ייעודי — חוזרות לעמוד
// ה-hub של ה-domain עצמו (למשל /finance, /studies) במקום להמציא מסך חדש רק בשביל הסיידבר.
export const sidebarGroups: SidebarGroup[] = [
  {
    id: 'work',
    label: 'עבודה',
    to: '/work',
    icon: BriefcaseIcon,
    children: [
      { label: 'יבוא ומשלוחים', to: '/work/shipments', icon: TruckIcon },
      { label: 'קידום מותגים', to: '/work/brands', icon: TagIcon },
    ],
  },
  {
    id: 'studies',
    label: 'לימודים',
    to: '/studies',
    icon: GraduationCapIcon,
    children: [
      { label: 'הקורסים שלי', to: '/studies', icon: BookIcon },
      { label: 'מטלות וציונים', to: '/studies', icon: ClipboardIcon },
    ],
  },
  {
    id: 'personal',
    label: 'אישי',
    to: '/personal',
    icon: PersonIcon,
    children: [
      { label: 'ספרייה וציטוטים', to: '/personal/library', icon: QuoteIcon },
      { label: 'התפתחות אישית', to: '/personal', icon: LeafIcon },
    ],
  },
  {
    id: 'finance',
    label: 'כספים',
    to: '/finance',
    icon: WalletIcon,
    children: [
      { label: 'לוח כספים', to: '/finance', icon: ChartIcon },
      { label: 'תשלומים / התחייבויות', to: '/finance', icon: ReceiptIcon },
    ],
  },
  {
    id: 'household',
    label: 'בית',
    to: '/household',
    icon: HomeIcon,
    children: [
      { label: 'רשימת קניות', to: '/household', icon: CartIcon },
      { label: 'תחזוקה וחשבונות', to: '/household', icon: WrenchIcon },
    ],
  },
]

// כלים תחתונים — לא מתערבבים בתוך קבוצות ה-domain.
export const bottomUtilityLinks: SidebarChild[] = [
  { label: 'חיפוש', to: '/search', icon: SearchIcon },
  { label: 'הגדרות', to: '/settings', icon: SettingsIcon },
]
