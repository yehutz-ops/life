import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { ChecklistIcon, CalendarIcon, MailIcon, ChevronDownIcon } from './hub/hubIcons'
import { globalNavLinks, sidebarGroups, bottomUtilityLinks } from './sidebarNav'
import { computeTodaySummary } from '../data/todaySummary'
import { todayISO } from '../utils/date'

// ===== פלטת הניווט החמה =====
// גוונים חמים בלבד (חום/טרהקוטה/ענבר עמוק/קרם) — נגזרים מאותה משפחה של accent המערכת (amber-800),
// רק רוויים ומעומקים יותר מהבז' החיוור הקודם. הכיתוב מרוכז כאן כדי שכל שורות הניווט יישארו עקביות.
const ROW_BASE = 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] transition-all duration-200'
const ROW_IDLE =
  'text-stone-600 dark:text-stone-300 font-medium hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:shadow-sm hover:shadow-amber-950/10'
const ROW_ACTIVE = 'bg-[#F1E0CD] dark:bg-[#3B2A1C] text-[#7C3D1D] dark:text-amber-300 font-semibold shadow-sm shadow-amber-950/10'

const CHILD_BASE = 'flex items-center gap-2.5 pr-9 pl-3 py-2 rounded-lg text-[12.5px] transition-all duration-200'
const CHILD_IDLE =
  'text-stone-500 dark:text-stone-400 hover:bg-[#FAF3EA] dark:hover:bg-[#261D16] hover:text-[#8C4A2B] dark:hover:text-amber-300'
const CHILD_ACTIVE = 'bg-[#F8EDDF] dark:bg-[#31241A] text-[#8C4A2B] dark:text-amber-300 font-medium'

// רקע דקורטיבי לכרטיס "היום שלכם" — SVG מוטבע (בלי נכס חיצוני), בגווני הקרם/טרהקוטה של המערכת.
// ממוסך בהדרגה לכיוון הטקסט (ימין ב-RTL) כך שהקריאוּת נשמרת מלאה; דקורטיבי בלבד ולכן aria-hidden.
function TodayCardDecor() {
  return (
    <svg viewBox="0 0 150 110" preserveAspectRatio="xMinYMax slice" aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 h-full w-[46%] opacity-70">
      <defs>
        <linearGradient id="lccTodaySky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E6BE95" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#F6E8D8" stopOpacity="0.05" />
        </linearGradient>
        {/* דעיכה תלולה: הציור נעלם לגמרי הרבה לפני אזור הטקסט (ימין ב-RTL) */}
        <linearGradient id="lccTodayFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="72%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <mask id="lccTodayMask">
          <rect width="150" height="110" fill="url(#lccTodayFade)" />
        </mask>
      </defs>
      <g mask="url(#lccTodayMask)">
        <rect width="150" height="110" fill="url(#lccTodaySky)" />
        {/* שמש נמוכה */}
        <circle cx="99" cy="36" r="14" fill="#DFA771" opacity="0.2" />
        {/* צוק */}
        <path d="M0 86c13-2 22-10 35-10s21 7 34 9v25H0Z" fill="#CFA77E" opacity="0.22" />
        {/* מגדלור */}
        <path d="M32 50h7.5l2 26H30Z" fill="#C08355" opacity="0.3" />
        <rect x="30.5" y="45.5" width="10.5" height="4.5" rx="1.6" fill="#A8623A" opacity="0.3" />
        <path d="M35 41.5h2.5v4H35Z" fill="#A8623A" opacity="0.22" />
        {/* מים */}
        <path d="M0 91h150M0 98h150M0 105h150" stroke="#C79E76" strokeOpacity="0.18" strokeWidth="1.3" strokeLinecap="round" />
      </g>
    </svg>
  )
}

interface TodayRow {
  key: string
  to: string
  text: string
  icon: (props: { className?: string }) => JSX.Element
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { items, inboxEntries } = useStore()
  const { pathname } = useLocation()
  const today = todayISO()

  // ה-domain הפעיל כרגע — לפי ה-to של הקבוצה או של אחד מהילדים שלה, כדי שגם נתיב עמוק
  // בתוך domain (למשל /work/shipments/17) יפתח אוטומטית את הקבוצה הנכונה.
  const activeGroupId = useMemo(() => {
    const g = sidebarGroups.find(
      (g) => pathname === g.to || pathname.startsWith(g.to + '/') || g.children.some((c) => pathname === c.to || pathname.startsWith(c.to + '/')),
    )
    return g?.id ?? null
  }, [pathname])

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => (activeGroupId ? { [activeGroupId]: true } : {}))

  // נתיב ה-domain הפעיל תמיד נפתח אוטומטית; קבוצות שהמשתמש פתח ידנית לא נסגרות בעל-כורחן בניווט.
  useEffect(() => {
    if (activeGroupId) setOpenGroups((prev) => (prev[activeGroupId] ? prev : { ...prev, [activeGroupId]: true }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGroupId])

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // שלוש שורות קבועות, כל אחת מנוסחת לפי המצב האמיתי — כולל מצבי "הכול נקי" חיוביים,
  // כדי שהכרטיס יישאר אינפורמטיבי גם ביום ריק במקום פשוט להיעלם.
  const todayRows: TodayRow[] = useMemo(() => {
    const now = new Date()
    const nowHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const s = computeTodaySummary(items, inboxEntries, today, nowHHMM)

    const tasksText =
      s.tasksOpen > 1
        ? `${s.tasksOpen} משימות להיום`
        : s.tasksOpen === 1
          ? 'נשארה לך משימה אחת להיום'
          : s.tasksDone > 0
            ? 'סיימת את כל המשימות להיום ✓'
            : 'אין משימות מתוכננות להיום'

    const eventText = s.nextEvent
      ? `${s.nextEvent.title} · ${s.nextEvent.time}`
      : s.eventsToday > 0
        ? 'אין עוד פגישות היום ✓'
        : 'אין פגישות מתוכננות להיום'

    const mailText =
      s.emailsNeedingAttention > 1
        ? `${s.emailsNeedingAttention} מיילים דורשים טיפול`
        : s.emailsNeedingAttention === 1
          ? 'מייל אחד דורש טיפול'
          : 'אין מיילים שממתינים לך ✓'

    return [
      { key: 'tasks', to: '/tasks', icon: ChecklistIcon, text: tasksText },
      { key: 'event', to: '/calendar', icon: CalendarIcon, text: eventText },
      { key: 'mail', to: '/inbox', icon: MailIcon, text: mailText },
    ]
  }, [items, inboxEntries, today])

  const globalLinkClass = ({ isActive }: { isActive: boolean }) => `${ROW_BASE} ${isActive ? ROW_ACTIVE : ROW_IDLE}`

  const utilityLinkClass = ({ isActive }: { isActive: boolean }) =>
    `${ROW_BASE} ${isActive ? ROW_ACTIVE : 'text-stone-500 dark:text-stone-400 font-medium hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:shadow-sm hover:shadow-amber-950/10'}`

  const collapsedIconClass = (active: boolean) =>
    `w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
      active
        ? 'bg-[#F1E0CD] dark:bg-[#3B2A1C] text-[#7C3D1D] dark:text-amber-300 shadow-sm shadow-amber-950/10'
        : 'text-stone-400 dark:text-stone-500 hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 hover:shadow-sm hover:shadow-amber-950/10'
    }`

  return (
    <aside
      className={`hidden md:flex md:flex-col shrink-0 border-l border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 sticky top-0 h-screen transition-all ${
        collapsed ? 'w-20 p-3' : 'w-72 p-3.5'
      }`}
    >
      {/* לוגו — זהות המותג נשארת (font-elegant), רק הריווח סביבה מתהדק ומתיישר */}
      <div className="flex items-center justify-between px-1.5 pt-1 pb-3 shrink-0">
        {!collapsed && (
          <div>
            <div className="text-[19px] leading-tight font-elegant font-bold text-stone-900 dark:text-stone-100">Life Control Center</div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">מרכז שליטה אישי</div>
          </div>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'הרחב תפריט' : 'כווץ תפריט'}
          className="w-8 h-8 shrink-0 rounded-lg hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:text-[#8C4A2B] dark:hover:text-amber-300 flex items-center justify-center text-stone-400 transition-all duration-200"
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      {/* כל תוכן הניווט גולל כגוש אחד — כולל ה-Utilities התחתונות; כך אין אזור ריק "תפוס" בין
          הקבוצות לבין חיפוש/הגדרות כשמעט קבוצות פתוחות, וכשהרבה פתוחות הכול גולל יחד בטבעיות. */}
      <div className={`flex-1 min-h-0 overflow-y-auto ${collapsed ? 'flex flex-col items-center gap-1' : ''}`}>
        {/* כרטיס "היום שלכם" — שלוש שורות אמיתיות מה-store, בלי קריאת רשת (הסיידבר מותקן בכל עמוד) */}
        {!collapsed && (
          <div className="relative overflow-hidden mb-3 rounded-2xl border border-[#EBDAC5] dark:border-stone-800 bg-gradient-to-br from-[#FCF3E8] via-[#FAF6F0] to-[#F8F3EC] dark:from-[#2B2119] dark:via-[#241D18] dark:to-[#221C17] shadow-sm shadow-stone-200/60 dark:shadow-none p-3.5">
            <TodayCardDecor />
            <div className="relative">
              <div className="text-[13px] font-bold text-[#5C3A21] dark:text-stone-100 mb-2.5">היום שלכם</div>
              <div className="space-y-2.5">
                {todayRows.map((r) => (
                  <Link key={r.key} to={r.to} className="flex items-center gap-2.5 group">
                    <span className="w-6 h-6 rounded-md border border-[#DCBE9E] dark:border-amber-800 bg-white/70 dark:bg-transparent flex items-center justify-center shrink-0 text-[#9A5630] dark:text-amber-400 group-hover:bg-[#F3E0CB] dark:group-hover:bg-amber-950/40 transition-all duration-200">
                      <r.icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="flex-1 min-w-0 text-[12.5px] text-stone-600 dark:text-stone-300 truncate group-hover:text-[#8C4A2B] dark:group-hover:text-amber-300 transition-colors duration-200" title={r.text}>
                      {r.text}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {!collapsed ? (
          <>
            <nav className="space-y-0.5">
              {globalNavLinks.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.to === '/'} className={globalLinkClass}>
                  <l.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{l.label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="mt-1">
              {sidebarGroups.map((g) => {
                const groupActive = pathname === g.to || pathname.startsWith(g.to + '/')
                const open = !!openGroups[g.id]
                return (
                  <div key={g.id} className="py-1 border-t border-stone-100 dark:border-stone-800">
                    <div className={`flex items-center rounded-xl transition-all duration-200 ${groupActive ? ROW_ACTIVE : 'hover:bg-[#F7EDE1] dark:hover:bg-[#2C2119] hover:shadow-sm hover:shadow-amber-950/10'}`}>
                      <Link
                        to={g.to}
                        className={`flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] transition-all duration-200 ${
                          groupActive ? 'text-[#7C3D1D] dark:text-amber-300 font-semibold' : 'text-stone-700 dark:text-stone-200 font-medium hover:text-[#8C4A2B] dark:hover:text-amber-300'
                        }`}
                      >
                        <g.icon className="w-5 h-5 shrink-0" />
                        <span className="truncate">{g.label}</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleGroup(g.id)}
                        aria-label={open ? `כווץ ${g.label}` : `הרחב ${g.label}`}
                        aria-expanded={open}
                        className={`w-9 h-9 shrink-0 flex items-center justify-center transition-all duration-200 ${
                          groupActive ? 'text-[#A8683F] dark:text-amber-400' : 'text-stone-300 dark:text-stone-600 hover:text-[#8C4A2B] dark:hover:text-amber-300'
                        }`}
                      >
                        <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>

                    <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="pb-1 pt-0.5 space-y-0.5">
                          {g.children.map((c) => {
                            const childActive = c.to !== g.to && (pathname === c.to || pathname.startsWith(c.to + '/'))
                            return (
                              <Link key={c.label} to={c.to} className={`${CHILD_BASE} ${childActive ? CHILD_ACTIVE : CHILD_IDLE}`}>
                                <c.icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{c.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Utilities תחתונות — חיפוש/הגדרות, מופרדות מקבוצות ה-domain אך זורמות טבעית אחריהן */}
            <div className="mt-1 pt-2 border-t border-stone-100 dark:border-stone-800 space-y-0.5">
              {bottomUtilityLinks.map((l) => (
                <NavLink key={l.to} to={l.to} className={utilityLinkClass}>
                  <l.icon className="w-5 h-5 shrink-0" />
                  <span className="truncate">{l.label}</span>
                </NavLink>
              ))}
            </div>
          </>
        ) : (
          <>
            {globalNavLinks.map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} title={l.label} className={({ isActive }) => collapsedIconClass(isActive)}>
                <l.icon className="w-5 h-5" />
              </NavLink>
            ))}
            <div className="w-8 h-px bg-stone-100 dark:bg-stone-800 my-1" />
            {sidebarGroups.map((g) => (
              <Link key={g.id} to={g.to} title={g.label} className={collapsedIconClass(pathname === g.to || pathname.startsWith(g.to + '/'))}>
                <g.icon className="w-5 h-5" />
              </Link>
            ))}
            <div className="w-8 h-px bg-stone-100 dark:bg-stone-800 my-1" />
            {bottomUtilityLinks.map((l) => (
              <NavLink key={l.to} to={l.to} title={l.label} className={({ isActive }) => collapsedIconClass(isActive)}>
                <l.icon className="w-5 h-5" />
              </NavLink>
            ))}
          </>
        )}
      </div>
    </aside>
  )
}
