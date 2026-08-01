export function nowISO(): string {
  return new Date().toISOString()
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function tomorrowISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'לילה טוב'
  if (h < 12) return 'בוקר טוב'
  if (h < 17) return 'צהריים טובים'
  if (h < 21) return 'ערב טוב'
  return 'לילה טוב'
}

export function formatFullHebrewDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false
  return iso < todayISO()
}

export function isToday(iso?: string): boolean {
  return iso === todayISO()
}

export function daysUntilLabel(iso?: string): string {
  if (!iso) return 'ללא תאריך'
  const today = new Date(todayISO() + 'T00:00:00')
  const target = new Date(iso + 'T00:00:00')
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff === -1) return 'אתמול'
  if (diff > 1) return `בעוד ${diff} ימים`
  return `לפני ${Math.abs(diff)} ימים`
}
