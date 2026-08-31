import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import UnifiedCalendar from '../components/calendar/UnifiedCalendar'
import { itemsToCalendarEvents } from '../components/calendar/itemAdapter'
import { CalendarEvent } from '../components/calendar/types'

// היומן הכללי — התצוגה הרחבה של היומן המאוחד, עם כל ה-domains יחד. אין כאן שום לוגיקת רשת/תאריכים
// משלו; כל זה חי ב-UnifiedCalendar ומשותף גם לכרטיס היומן בדף הבית וגם ליומני ה-domain.
export default function CalendarPage() {
  const { items, brandContentItems, toggleDone } = useStore()
  const { openEdit, openCreate } = useDetailModal()
  const navigate = useNavigate()

  const events = useMemo<CalendarEvent[]>(() => {
    const itemEvents = itemsToCalendarEvents(
      items.filter((it) => it.status !== 'done' && it.status !== 'cancelled'),
      openEdit,
    )
    // פריטי תוכן (BrandContentItem) הם רשומה נפרדת לגמרי מ-Item — מוצגים כאן כתצוגה בלבד, בלי ליצור
    // Item כפול. פתיחה מנווטת לאותו מקום שהיה קיים קודם ב-CalendarPage (טאב התוכן בדף המותג).
    const contentEvents: CalendarEvent[] = brandContentItems
      .filter((c) => c.date)
      .map((c) => ({
        id: `content-${c.id}`,
        title: c.title,
        date: c.date as string,
        time: c.time,
        domain: 'content',
        kindLabel: 'תוכן',
        onOpen: () => navigate(`/work/brands/${c.brandId}?tab=content&item=${c.id}`),
      }))
    return [...itemEvents, ...contentEvents]
  }, [items, brandContentItems, openEdit, navigate])

  return (
    <div className="pb-6">
      <UnifiedCalendar events={events} onAddEvent={(date) => openCreate(undefined, { date })} onToggleTask={toggleDone} />
    </div>
  )
}
