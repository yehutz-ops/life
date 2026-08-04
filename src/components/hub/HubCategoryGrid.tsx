import { ReactNode } from 'react'

export default function HubCategoryGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">{children}</div>
}
