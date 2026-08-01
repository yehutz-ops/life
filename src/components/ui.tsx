import { ReactNode } from 'react'
import { DomainId, Priority, ItemKind, WaitingType } from '../data/types'
import { getDomain } from '../data/domains'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-6 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-stone-800 dark:text-stone-100">{children}</h2>
      {hint && <span className="text-xs text-stone-400 dark:text-stone-500">{hint}</span>}
    </div>
  )
}

export function DomainBadge({ domain }: { domain?: DomainId }) {
  if (!domain) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
        <span>📥</span>
        <span>תיבת כניסה</span>
      </span>
    )
  }
  const d = getDomain(domain)
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${d.classes.chip}`}>
      <span>{d.icon}</span>
      <span>{d.name}</span>
    </span>
  )
}

const priorityLabels: Record<Priority, string> = { high: 'גבוהה', medium: 'בינונית', low: 'נמוכה' }
const priorityClasses: Record<Priority, string> = {
  high: 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900',
  medium: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  low: 'bg-stone-50 text-stone-400 dark:bg-stone-800/50 dark:text-stone-500',
}

export function PriorityChip({ priority }: { priority?: Priority }) {
  if (!priority || priority === 'low') return null
  return <span className={`text-xs font-medium px-2 py-1 rounded-full ${priorityClasses[priority]}`}>עדיפות {priorityLabels[priority]}</span>
}

export const kindIcon: Record<ItemKind, string> = { task: '📋', event: '📅', reminder: '⏰', waiting: '🕓' }
export const kindLabel: Record<ItemKind, string> = { task: 'משימה', event: 'אירוע', reminder: 'תזכורת', waiting: 'ממתין לטיפול' }
export const waitingTypeLabel: Record<WaitingType, string> = {
  my_followup: 'אני צריך לחזור אליהם',
  other_pending: 'מחכים לתגובה של מישהו אחר',
  my_approval: 'מחכה לאישור/החלטה שלי',
}
export const waitingTypeIcon: Record<WaitingType, string> = { my_followup: '📞', other_pending: '⏳', my_approval: '✅' }

export function KindBadge({ kind }: { kind: ItemKind }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400">
      <span>{kindIcon[kind]}</span>
      <span>{kindLabel[kind]}</span>
    </span>
  )
}

export function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
  tone = 'primary',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'primary' | 'dark'
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? tone === 'dark'
            ? 'bg-stone-800 text-white border-stone-800 dark:bg-stone-200 dark:text-stone-900 dark:border-stone-200'
            : 'bg-amber-800 text-white border-amber-800'
          : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700 dark:hover:border-stone-600'
      }`}
    >
      {children}
    </button>
  )
}

export function EmptyLine({ text }: { text: string }) {
  return <li className="text-sm text-stone-400 dark:text-stone-500 py-2">{text}</li>
}
