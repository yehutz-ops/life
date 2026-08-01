import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import QuickAddFAB from './QuickAddFAB'
import QuickAddModal from './QuickAddModal'
import ItemDetailModal from './ItemDetailModal'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const isHome = useLocation().pathname === '/'

  return (
    <div className="flex min-h-screen bg-stone-50 dark:bg-stone-950 warm-texture text-stone-900 dark:text-stone-100" dir="rtl">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
      {!isHome && <QuickAddFAB />}
      <QuickAddModal />
      <ItemDetailModal />
    </div>
  )
}
