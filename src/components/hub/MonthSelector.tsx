const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function shiftMonth(month: string, delta: number): string {
  const year = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7)) - 1
  const d = new Date(year, m + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// אותו דפוס ניווט-חודשי כמו ב-MiniDomainCalendar, אך כרכיב עצמאי לשימוש מחוץ ללוח שנה —
// דשבורדים של משפיענים/קמפיינים וכל מסך אחר שצריך "עבור בין חודשים".
export default function MonthSelector({ month, onChange, className = '' }: { month: string; onChange: (month: string) => void; className?: string }) {
  const year = Number(month.slice(0, 4))
  const m = Number(month.slice(5, 7)) - 1

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      <button
        onClick={() => onChange(shiftMonth(month, -1))}
        className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
        aria-label="חודש קודם"
      >
        →
      </button>
      <span className="font-medium text-stone-600 dark:text-stone-300 min-w-[90px] text-center">
        {monthNames[m]} {year}
      </span>
      <button
        onClick={() => onChange(shiftMonth(month, 1))}
        className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800"
        aria-label="חודש הבא"
      >
        ←
      </button>
    </div>
  )
}
