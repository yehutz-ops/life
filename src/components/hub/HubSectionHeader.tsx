import { ReactNode } from 'react'

export default function HubSectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-sm font-semibold text-stone-500 dark:text-stone-400">{title}</h2>
      {action}
    </div>
  )
}
