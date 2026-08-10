// אייקונים קוויים מינימליים, ללא תלות בספריית אייקונים חיצונית — stroke=currentColor בלבד.
import { ReactNode } from 'react'
import { WorkCategoryId } from '../../data/workHubCategories'

type IconProps = { className?: string }

function Base({ children, className = 'w-4 h-4' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

export function TagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12.6 2.6H4a1.4 1.4 0 0 0-1.4 1.4v8.6c0 .37.15.73.41 1l9 9c.55.55 1.44.55 2 0l7.6-7.6c.55-.55.55-1.44 0-2l-9-9a1.4 1.4 0 0 0-1-.4Z" />
      <circle cx="7.5" cy="7.5" r="1.3" />
    </Base>
  )
}

export function CameraIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h2.5L8 5.5h8L17.5 8H20a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.3" />
    </Base>
  )
}

export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
      <circle cx="17.5" cy="9" r="2.3" />
      <path d="M15.5 14.2c2.6.4 4.5 2.6 4.5 5.3" />
    </Base>
  )
}

export function BoxIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3.5 8 12 3.5 20.5 8 12 12.5 3.5 8Z" />
      <path d="M3.5 8v8.5L12 21l8.5-4.5V8" />
      <path d="M12 12.5V21" />
    </Base>
  )
}

export function TruckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="2.5" y="7" width="11" height="9" rx="1" />
      <path d="M13.5 10h3.6l3.4 3.2V16h-7Z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </Base>
  )
}

export function MegaphoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 10v4a1 1 0 0 0 1 1h2l1.2 4.4a1 1 0 0 0 1 .7H10l-.9-5" />
      <path d="M6 10 17 5v13L6 14Z" />
      <path d="M17 8.5c1.4.5 2.5 1.8 2.5 3.5s-1.1 3-2.5 3.5" />
    </Base>
  )
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
    </Base>
  )
}

export function BriefcaseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="1.5" />
      <path d="M8 7.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1.5" />
      <path d="M3 12.5h18" />
    </Base>
  )
}

export function ChecklistIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="1.5" />
      <path d="M8 8.5h8M8 12h8M8 15.5h5" />
      <path d="M6.6 8.4l.7.7 1-1.1" />
    </Base>
  )
}

export function HomeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
      <path d="M10 20v-5h4v5" />
    </Base>
  )
}

export function ShoppingBagIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5.5 8h13l1 12.5a1 1 0 0 1-1 1.1H5.5a1 1 0 0 1-1-1.1L5.5 8Z" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
    </Base>
  )
}

export function WrenchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.5 6.5a4 4 0 0 0-5.4 4.9L3.5 17l3 3 5.6-5.6a4 4 0 0 0 4.9-5.4l-2.6 2.6-2.1-.6-.6-2.1 2.6-2.4Z" />
    </Base>
  )
}

export function ReceiptIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-17Z" />
      <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </Base>
  )
}

export function PersonIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-6.5 7-6.5s7 2.9 7 6.5" />
    </Base>
  )
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 5.5c2-1 5-1 7 .3V19c-2-1.3-5-1.3-7-.3Z" />
      <path d="M20 5.5c-2-1-5-1-7 .3V19c2-1.3 5-1.3 7-.3Z" />
    </Base>
  )
}

export function QuoteIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 8.5c-1.7 0-3 1.3-3 3v1.5a2 2 0 0 0 2 2h1.5v-3.5H6c0-1.4.6-2.2 1.8-2.6L7 8.5Z" />
      <path d="M16 8.5c-1.7 0-3 1.3-3 3v1.5a2 2 0 0 0 2 2h1.5v-3.5H15c0-1.4.6-2.2 1.8-2.6L16 8.5Z" />
    </Base>
  )
}

export function NewsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="5.5" width="13" height="13" rx="1.3" />
      <path d="M7 9.5h6M7 12.5h6M7 15.5h3.5" />
      <path d="M16.5 8.5H19a1 1 0 0 1 1 1v8a1.5 1.5 0 0 1-1.5 1.5H8" />
    </Base>
  )
}

export function BulbIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 17.5h6" />
      <path d="M9.5 20h5" />
      <path d="M12 3.5a5.7 5.7 0 0 0-3.2 10.4c.6.5 1 1.2 1 2.1h4.4c0-.9.4-1.6 1-2.1A5.7 5.7 0 0 0 12 3.5Z" />
    </Base>
  )
}

export function TargetIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" />
    </Base>
  )
}

export function CompassIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M14.8 9.2 13 13l-3.8 1.8L11 11Z" />
    </Base>
  )
}

export function HeartIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 19.5s-7-4.4-7-9.7A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7 2.6c0 5.3-7 9.7-7 9.7Z" />
    </Base>
  )
}

export function WalletIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h11A1.5 1.5 0 0 1 18 7.5V9H5.5A1.5 1.5 0 0 1 4 7.5Z" />
      <path d="M4 7.5v9A1.5 1.5 0 0 0 5.5 18h13a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 18.5 9H5.5" />
      <circle cx="16" cy="13" r="1.1" fill="currentColor" stroke="none" />
    </Base>
  )
}

export const workCategoryIcons: Record<WorkCategoryId | 'brands', (props: IconProps) => JSX.Element> = {
  brands: TagIcon,
  content: CameraIcon,
  collaborations: UsersIcon,
  shipments: BoxIcon,
  suppliers: TruckIcon,
  campaigns: MegaphoneIcon,
  meetings: CalendarIcon,
  operations: ChecklistIcon,
}
