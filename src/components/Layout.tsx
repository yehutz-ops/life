import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import QuickAddFAB from './QuickAddFAB'
import QuickAddModal from './QuickAddModal'
import ItemDetailModal from './ItemDetailModal'
import ThemeToggle from './ThemeToggle'

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100" dir="rtl">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <div className="flex justify-end mb-4">
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
      <QuickAddFAB />
      <QuickAddModal />
      <ItemDetailModal />
    </div>
  )
}
