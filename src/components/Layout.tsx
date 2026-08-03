import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import QuickAddFAB from './QuickAddFAB'
import QuickAddModal from './QuickAddModal'
import ItemDetailModal from './ItemDetailModal'
import ProjectFormModal from './ProjectFormModal'
import ThemeToggle from './ThemeToggle'
import { useStore } from '../data/StoreContext'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const isHome = useLocation().pathname === '/'
  const { loading } = useStore()

  return (
    <div className="flex min-h-screen bg-[#F7F5F1] dark:bg-[#1C1A18] text-stone-900 dark:text-stone-100" dir="rtl">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <main className="flex-1 min-w-0 p-6 lg:p-10 max-w-5xl mx-auto w-full">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-stone-400 dark:text-stone-500 text-sm">טוען את המידע השמור...</div>
        ) : (
          <Outlet />
        )}
      </main>
      {!isHome && <QuickAddFAB />}
      <QuickAddModal />
      <ItemDetailModal />
      <ProjectFormModal />
    </div>
  )
}
