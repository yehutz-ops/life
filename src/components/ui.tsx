import { ReactNode } from 'react'
import { DomainId, Priority, ItemKind, WaitingType } from '../data/types'
import { getDomain } from '../data/domains'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{children}</h2>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
  )
}

export function DomainBadge({ domain }: { domain?: DomainId }) {
  if (!domain) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
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
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function PriorityChip({ priority }: { priority?: Priority }) {
  if (!priority) return null
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
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <span>{kindIcon[kind]}</span>
      <span>{kindLabel[kind]}</span>
    </span>
  )
}

export function ProgressBar({ value, colorClass }: { value: number; colorClass: string }) {
  return (
    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div className={`h-full ${colorClass} rounded-full transition-all`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function FilterChip({
  active,
  onClick,
  children,
  tone = 'indigo',
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  tone?: 'indigo' | 'dark'
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? tone === 'dark'
            ? 'bg-gray-800 text-white border-gray-800 dark:bg-gray-200 dark:text-gray-900 dark:border-gray-200'
            : 'bg-indigo-600 text-white border-indigo-600'
          : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700 dark:hover:border-gray-600'
      }`}
    >
      {children}
    </button>
  )
}

export function EmptyLine({ text }: { text: string }) {
  return <li className="text-sm text-gray-400 dark:text-gray-500 py-2">{text}</li>
}
