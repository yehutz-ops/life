import { TagIcon, BulbIcon, TruckIcon, UsersIcon, ChecklistIcon, MegaphoneIcon } from '../components/hub/hubIcons'

export type WorkAreaId = 'brand-promotion' | 'content-ideas' | 'import-shipping' | 'influencers' | 'campaigns' | 'more'

export interface WorkArea {
  id: WorkAreaId
  name: string
  description: string
  imageSrc: string
  icon: (props: { className?: string }) => JSX.Element
  // רק 'more' עדיין מוביל לעמוד "בקרוב" — שאר הכרטיסים מובילים למערכות קיימות ובנויות.
  to: string
}

export const workAreas: WorkArea[] = [
  {
    id: 'brand-promotion',
    name: 'קידום מותגים',
    description: 'מותגים, תוכן מותגי וקמפיינים',
    imageSrc: '/hub-images/work/brands.jpg',
    icon: TagIcon,
    to: '/work/brands',
  },
  {
    id: 'content-ideas',
    name: 'רעיונות וכתיבת תסריטים',
    description: 'רעיונות לתוכן, Reels ותסריטים',
    imageSrc: '/hub-images/work/content-ideas.jpg',
    icon: BulbIcon,
    to: '/work/ideas',
  },
  {
    id: 'import-shipping',
    name: 'יבוא ומשלוחים',
    description: 'ספקים, הזמנות ומשלוחים',
    imageSrc: '/hub-images/work/shipments.jpg',
    icon: TruckIcon,
    to: '/work/shipments',
  },
  {
    id: 'influencers',
    name: 'משפיענים',
    description: 'יוצרי תוכן ושיתופי פעולה',
    imageSrc: '/hub-images/work/collaborations.jpg',
    icon: UsersIcon,
    to: '/work/influencers',
  },
  {
    id: 'campaigns',
    name: 'ניהול קמפיינים',
    description: 'קמפיינים ממומנים ברשתות',
    imageSrc: '/hub-images/work/campaigns.jpg',
    icon: MegaphoneIcon,
    to: '/work/campaigns',
  },
  {
    id: 'more',
    name: 'נוספים',
    description: 'משימות עבודה כלליות',
    imageSrc: '/hub-images/work/more.jpg',
    icon: ChecklistIcon,
    to: '/work/area/more',
  },
]

export function getWorkArea(id: WorkAreaId): WorkArea {
  return workAreas.find((a) => a.id === id)!
}
