import { ReactNode, useMemo, useState } from 'react'
import BackButton from '../components/BackButton'
import QuickAddPopover from '../components/hub/QuickAddPopover'
import QuickCaptureBar from '../components/QuickCaptureBar'
import { CalendarIcon, ChecklistIcon, BookIcon, BulbIcon, NewsIcon, TargetIcon } from '../components/hub/hubIcons'
import LineChart from '../components/finance/LineChart'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { useConfirm } from '../data/ConfirmContext'
import { daysUntilLabel, todayISO } from '../utils/date'
import { Item } from '../data/types'
import {
  openTaskCountForCourse,
  nextDeadlineForCourse,
  courseAverageGrade,
  overallAverageGrade,
  gradeTrend,
  degreeProgressPercent,
  computeStudyAttention,
  openStudyItemCount,
  daysUntilNumber,
  groupUpcomingStudyItems,
  latestGradeDelta,
} from '../data/studyMetrics'
import { CourseStatus, StudyMaterialType } from '../data/studyTypes'

// צבע ה-Accent של עמוד הלימודים — כתום חם, מעט בהיר מה-amber-800 של הכפתורים, לשימוש
// במספרים גדולים, בגרף, בפס ההתקדמות ובסימון "היום" ביומן.
const ACCENT = '#E08034'

type IconProps = { className?: string }

function Ico({ children, className = 'w-4 h-4' }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}

const StarIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.8L12 16.9l-5.2 2.75 1-5.8-4.2-4.1 5.8-.85L12 3.6Z" />
  </Ico>
)
const CapIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M12 4 2.5 8.5 12 13l9.5-4.5L12 4Z" />
    <path d="M6.5 10.7V16c0 1.4 2.5 2.7 5.5 2.7s5.5-1.3 5.5-2.7v-5.3" />
  </Ico>
)
const ArrowIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M5 12h13" />
    <path d="m12.5 6 6 6-6 6" />
  </Ico>
)
const TrendIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M3.5 16.5 9 11l3.5 3.5 8-8" />
    <path d="M15.5 6.5h5v5" />
  </Ico>
)
const CodeIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="m8.5 8.5-4 3.5 4 3.5" />
    <path d="m15.5 8.5 4 3.5-4 3.5" />
    <path d="M13.5 5.5 10.5 18.5" />
  </Ico>
)
const NoteIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M6.5 3.5H15l4 4V20a.5.5 0 0 1-.5.5h-12A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5Z" />
    <path d="M14.5 3.5V8H19" />
    <path d="M9 12.5h6M9 16h4" />
  </Ico>
)
const SlidesIcon = (p: IconProps) => (
  <Ico {...p}>
    <rect x="3.5" y="4.5" width="17" height="11" rx="1.2" />
    <path d="M12 15.5V19M9.5 19h5" />
  </Ico>
)
const HeadphonesIcon = (p: IconProps) => (
  <Ico {...p}>
    <path d="M4 13.5v-1.5a8 8 0 0 1 16 0v1.5" />
    <rect x="3" y="13" width="4" height="6" rx="1.3" />
    <rect x="17" y="13" width="4" height="6" rx="1.3" />
  </Ico>
)

const courseStatusOptions = [
  { value: 'in_progress', label: 'בתהליך' },
  { value: 'completed', label: 'הושלם' },
]

const studyKindOptions = [
  { value: 'assignment', label: 'מטלה/תרגיל' },
  { value: 'reading', label: 'קריאה/הכנה' },
  { value: 'exam', label: 'מבחן/בוחן' },
  { value: 'submission', label: 'הגשה/עבודה' },
]

const materialTypeOptions = [
  { value: 'pdf', label: 'PDF' },
  { value: 'summary', label: 'סיכום' },
  { value: 'presentation', label: 'מצגת' },
  { value: 'recording', label: 'הקלטה' },
  { value: 'other', label: 'אחר' },
]

const materialTypeLabel: Record<StudyMaterialType, string> = {
  pdf: 'PDF',
  summary: 'סיכום',
  presentation: 'מצגת',
  recording: 'הקלטה',
  other: 'אחר',
}

const materialTiles: { type: StudyMaterialType; label: string; icon: (p: IconProps) => JSX.Element; bg: string; fg: string }[] = [
  { type: 'summary', label: 'סיכומים', icon: NoteIcon, bg: 'bg-violet-50 dark:bg-violet-950/30', fg: 'text-violet-500 dark:text-violet-300' },
  { type: 'presentation', label: 'מצגות', icon: SlidesIcon, bg: 'bg-emerald-50 dark:bg-emerald-950/30', fg: 'text-emerald-500 dark:text-emerald-300' },
  { type: 'pdf', label: 'מאמרים', icon: NewsIcon, bg: 'bg-orange-50 dark:bg-orange-950/30', fg: 'text-orange-500 dark:text-orange-300' },
  { type: 'recording', label: 'הקלטות', icon: HeadphonesIcon, bg: 'bg-blue-50 dark:bg-blue-950/30', fg: 'text-blue-500 dark:text-blue-300' },
]

const COURSE_ACCENTS = [
  { bg: 'bg-violet-50 dark:bg-violet-950/30', fg: 'text-violet-500 dark:text-violet-300', bar: 'bg-violet-400', dot: 'bg-violet-400', icon: BulbIcon },
  { bg: 'bg-emerald-50 dark:bg-emerald-950/30', fg: 'text-emerald-500 dark:text-emerald-300', bar: 'bg-emerald-400', dot: 'bg-emerald-400', icon: TrendIcon },
  { bg: 'bg-blue-50 dark:bg-blue-950/30', fg: 'text-blue-500 dark:text-blue-300', bar: 'bg-blue-400', dot: 'bg-blue-400', icon: BookIcon },
  { bg: 'bg-orange-50 dark:bg-orange-950/30', fg: 'text-orange-500 dark:text-orange-300', bar: 'bg-orange-400', dot: 'bg-orange-400', icon: CodeIcon },
  { bg: 'bg-rose-50 dark:bg-rose-950/30', fg: 'text-rose-500 dark:text-rose-300', bar: 'bg-rose-400', dot: 'bg-rose-400', icon: NewsIcon },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/30', fg: 'text-cyan-500 dark:text-cyan-300', bar: 'bg-cyan-400', dot: 'bg-cyan-400', icon: TargetIcon },
]

const WEEKDAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function startOfWeek(d: Date) {
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  copy.setDate(copy.getDate() - copy.getDay())
  return copy
}

// משטח בסיסי לעמוד — רדיוס 16px וגבול עדין, מעט הדוק יותר מ-Card הכללי (rounded-3xl).
function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">{title}</h2>
      {action}
    </div>
  )
}

function PanelHead({ icon: Icon, title, onAdd, addLabel }: { icon: (p: IconProps) => JSX.Element; title: string; onAdd?: () => void; addLabel?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="w-4 h-4 shrink-0 text-stone-300 dark:text-stone-600" />
        <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap">{title}</h2>
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          title={addLabel}
          aria-label={addLabel}
          className="w-6 h-6 shrink-0 rounded-lg text-stone-400 dark:text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-800 dark:hover:text-amber-400 flex items-center justify-center text-base leading-none transition-colors"
        >
          +
        </button>
      )}
    </div>
  )
}

function AddLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-amber-800 dark:hover:text-amber-400 transition-colors shrink-0">
      {label}
    </button>
  )
}

const dueColumns: { key: 'today' | 'thisWeek' | 'later'; label: string }[] = [
  { key: 'today', label: 'היום' },
  { key: 'thisWeek', label: 'השבוע' },
  { key: 'later', label: 'בהמשך' },
]

export default function StudiesPage() {
  const {
    items,
    courses,
    grades,
    degreeRequirementCategories,
    studyMaterials,
    addItem,
    addCourse,
    updateCourse,
    deleteCourse,
    addGrade,
    addDegreeRequirementCategory,
    addStudyMaterial,
    deleteStudyMaterial,
  } = useStore()
  const { openEdit } = useDetailModal()
  const confirm = useConfirm()

  const [courseModal, setCourseModal] = useState<{ id?: string } | null>(null)
  const [gradeModalOpen, setGradeModalOpen] = useState(false)
  const [degreeModalOpen, setDegreeModalOpen] = useState(false)
  const [materialModalOpen, setMaterialModalOpen] = useState(false)
  const [deadlineModalOpen, setDeadlineModalOpen] = useState(false)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))

  const studyItems = useMemo(() => items.filter((it) => it.domain === 'studies'), [items])
  const attention = useMemo(() => computeStudyAttention(items, grades), [items, grades])
  const overallAvg = useMemo(() => overallAverageGrade(grades), [grades])
  const trend = useMemo(() => gradeTrend(grades), [grades])
  const delta = useMemo(() => latestGradeDelta(grades), [grades])
  const degreeProgress = degreeProgressPercent(degreeRequirementCategories)
  const creditsCompleted = degreeRequirementCategories.reduce((sum, c) => sum + c.creditsCompleted, 0)
  const creditsRequired = degreeRequirementCategories.reduce((sum, c) => sum + c.creditsRequired, 0)
  const openCount = openStudyItemCount(items)
  const upcoming = useMemo(() => groupUpcomingStudyItems(items, todayISO()), [items])

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name
  const courseAccent = (courseId?: string) => {
    const idx = courses.findIndex((c) => c.id === courseId)
    return COURSE_ACCENTS[idx >= 0 ? idx % COURSE_ACCENTS.length : 0]
  }
  const editingCourse = courseModal?.id ? courses.find((c) => c.id === courseModal.id) : undefined

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)), [weekStart])
  const monthLabel = `${MONTHS[weekDays[3].getMonth()]} ${weekDays[3].getFullYear()}`
  const itemsByDate = useMemo(() => {
    const map: Record<string, Item[]> = {}
    studyItems.forEach((it) => {
      if (!it.date) return
      map[it.date] = map[it.date] || []
      map[it.date].push(it)
    })
    return map
  }, [studyItems])

  async function handleSaveCourse(values: Record<string, string>) {
    const name = values.name?.trim()
    if (!name) return
    const data = {
      name,
      code: values.code || undefined,
      category: values.category || undefined,
      status: (values.status as CourseStatus) || 'in_progress',
      credits: values.credits ? Number(values.credits) : undefined,
      nextSessionLabel: values.nextSessionLabel || undefined,
      notes: values.notes || undefined,
      recordSource: 'manual' as const,
    }
    if (courseModal?.id) await updateCourse(courseModal.id, data)
    else await addCourse(data)
    setCourseModal(null)
  }

  async function handleDeleteCourse() {
    if (!courseModal?.id) return
    const ok = await confirm({ title: 'למחוק את הקורס?', message: `"${editingCourse?.name}" יימחק לצמיתות.`, confirmLabel: 'מחק', danger: true })
    if (ok) {
      await deleteCourse(courseModal.id)
      setCourseModal(null)
    }
  }

  async function handleSaveGrade(values: Record<string, string>) {
    const label = values.label?.trim()
    const courseId = values.courseId
    const value = values.value ? Number(values.value) : undefined
    if (!label || !courseId || value === undefined) return
    await addGrade({ courseId, label, value, weight: values.weight ? Number(values.weight) : undefined, date: values.date || undefined, recordSource: 'manual' })
    setGradeModalOpen(false)
  }

  async function handleSaveDegreeCategory(values: Record<string, string>) {
    const label = values.label?.trim()
    if (!label) return
    await addDegreeRequirementCategory({
      label,
      creditsRequired: Number(values.creditsRequired) || 0,
      creditsCompleted: Number(values.creditsCompleted) || 0,
    })
    setDegreeModalOpen(false)
  }

  async function handleSaveMaterial(values: Record<string, string>) {
    const title = values.title?.trim()
    const courseId = values.courseId
    if (!title || !courseId) return
    await addStudyMaterial({
      courseId,
      title,
      type: (values.type as StudyMaterialType) || 'other',
      url: values.url || undefined,
      recordSource: 'manual',
    })
    setMaterialModalOpen(false)
  }

  async function handleSaveDeadline(values: Record<string, string>) {
    const title = values.title?.trim()
    if (!title) return
    await addItem({
      title,
      kind: 'task',
      domain: 'studies',
      courseId: values.courseId || undefined,
      studyKind: (values.studyKind as Item['studyKind']) || undefined,
      date: values.date || undefined,
      priority: 'medium',
      status: 'open',
    })
    setDeadlineModalOpen(false)
  }

  const nextExam = attention.nextExamOrSubmission

  return (
    <div className="space-y-9 pb-24">
      {/* Header */}
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="w-14 h-14 rounded-2xl bg-[#FBF0E2] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
              <CapIcon className="w-7 h-7 text-amber-800/80 dark:text-amber-300" />
            </span>
            <h1 className="text-3xl sm:text-[34px] font-extrabold text-stone-900 dark:text-stone-100 leading-none">לימודים</h1>
          </div>
          <BackButton to="/" label="דף הבית" />
        </div>
        <QuickCaptureBar variant="inline" placeholder="מה תרצה ללמוד או להשלים היום?" />
      </div>

      {/* השבוע בלימודים */}
      <section>
        <SectionHead title="השבוע בלימודים" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* הדבר הבא */}
          <Panel className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-6 h-6 rounded-full bg-[#FBF0E2] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
                <ArrowIcon className="w-3.5 h-3.5 text-amber-800/70 dark:text-amber-300" />
              </span>
              <span className="text-xs text-stone-400 dark:text-stone-500">הדבר הבא</span>
            </div>
            <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 truncate">{attention.next?.title ?? 'אין כלום קרוב'}</div>
            {attention.next?.date && (
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-stone-400 dark:text-stone-500">
                <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {daysUntilLabel(attention.next.date)}
                  {attention.next.startTime ? ` · ${attention.next.startTime}` : ''}
                </span>
              </div>
            )}
          </Panel>

          {/* מבחן / הגשה קרובים */}
          <Panel className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />
                  <span className="text-xs text-stone-400 dark:text-stone-500">מבחן / הגשה קרובים</span>
                </div>
                <div className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 truncate">{nextExam?.title ?? 'אין אירוע קרוב'}</div>
                {nextExam?.date && <div className="text-xs text-stone-400 dark:text-stone-500 mt-1.5 truncate">{courseName(nextExam.courseId) ?? daysUntilLabel(nextExam.date)}</div>}
              </div>
              <div className="text-center shrink-0">
                <div className="text-[32px] leading-none font-extrabold" style={{ color: nextExam?.date ? ACCENT : undefined }}>
                  {nextExam?.date ? Math.max(0, daysUntilNumber(nextExam.date)) : <span className="text-stone-200 dark:text-stone-700">—</span>}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5">ימים</div>
              </div>
            </div>
          </Panel>

          {/* מטלות פתוחות */}
          <Panel className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <ChecklistIcon className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />
                <span className="text-xs text-stone-400 dark:text-stone-500">מטלות פתוחות</span>
              </div>
              <div className="text-center shrink-0">
                <div className="text-[32px] leading-none font-extrabold" style={{ color: ACCENT }}>
                  {openCount}
                </div>
                <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1.5">מטלות</div>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      {/* הקורסים שלי */}
      <section>
        <SectionHead title="הקורסים שלי" action={<AddLink onClick={() => setCourseModal({})} label="+ קורס חדש" />} />
        {courses.length === 0 ? (
          <Panel className="p-10 text-center text-sm text-stone-400 dark:text-stone-500">עדיין אין קורסים</Panel>
        ) : (
          <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(218px, 1fr))' }}>
            {courses.map((c, i) => {
              const accent = COURSE_ACCENTS[i % COURSE_ACCENTS.length]
              const Icon = accent.icon
              const count = openTaskCountForCourse(items, c.id)
              const deadline = nextDeadlineForCourse(items, c.id)
              const avg = courseAverageGrade(grades, c.id)
              const meta = deadline
                ? { icon: CalendarIcon, text: `${deadline.title} · ${daysUntilLabel(deadline.date)}` }
                : avg !== undefined
                  ? { icon: StarIcon, text: `הציון האחרון: ${avg.toFixed(0)}` }
                  : { icon: CalendarIcon, text: c.nextSessionLabel || 'אין עדכונים' }
              const MetaIcon = meta.icon
              return (
                <Panel key={c.id} className="group relative p-4 pb-3.5 overflow-hidden transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-stone-800 dark:text-stone-100 truncate">{c.name}</h3>
                      <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">{count} מטלות פתוחות</div>
                    </div>
                    <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent.bg}`}>
                      <Icon className={`w-5 h-5 ${accent.fg}`} />
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 text-xs text-stone-400 dark:text-stone-500">
                    <MetaIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{meta.text}</span>
                  </div>
                  <button
                    onClick={() => setCourseModal({ id: c.id })}
                    title="עריכת קורס"
                    className="absolute left-3 top-3 w-7 h-7 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✎
                  </button>
                  <span className={`absolute inset-x-0 bottom-0 h-[3px] ${accent.bar}`} />
                </Panel>
              )
            })}
          </div>
        )}
      </section>

      {/* ציונים · התקדמות בתואר · דדליינים */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.26fr_1fr_1.18fr] gap-5">
        {/* ציונים */}
        <Panel className="p-4 sm:p-5">
          <PanelHead icon={StarIcon} title="ציונים" onAdd={() => setGradeModalOpen(true)} addLabel="הוספת ציון" />
          <div className="flex items-start gap-4">
            <div className="shrink-0">
              <div className="text-xs text-stone-400 dark:text-stone-500">ממוצע כללי</div>
              <div className="text-[30px] leading-none font-extrabold mt-1.5" style={{ color: overallAvg !== undefined ? ACCENT : undefined }}>
                {overallAvg !== undefined ? overallAvg.toFixed(1) : <span className="text-stone-200 dark:text-stone-700">—</span>}
              </div>
              {delta !== undefined && (
                <>
                  <div className={`flex items-center gap-1 mt-2.5 text-xs font-semibold ${delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                    <span>{delta >= 0 ? '↑' : '↓'}</span>
                    <span>
                      {delta >= 0 ? '+' : ''}
                      {delta}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">מהציון הקודם</div>
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {trend.length > 1 ? (
                <LineChart data={trend} color={ACCENT} showAxis height={112} />
              ) : (
                <div className="h-[112px] flex items-center justify-center text-center text-[11px] text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl px-3">
                  גרף המגמה יופיע אחרי שיהיו שני ציונים
                </div>
              )}
            </div>
          </div>
        </Panel>

        {/* התקדמות בתואר */}
        <Panel className="p-5">
          <PanelHead icon={CapIcon} title="התקדמות בתואר" onAdd={() => setDegreeModalOpen(true)} addLabel="הוספת קטגוריית דרישות" />
          {degreeRequirementCategories.length === 0 ? (
            <div className="py-8 text-center text-sm text-stone-400 dark:text-stone-500">עדיין לא הוגדרו דרישות תואר</div>
          ) : (
            <>
              <div className="flex items-baseline gap-2.5">
                <span className="text-[30px] leading-none font-extrabold" style={{ color: ACCENT }}>
                  {degreeProgress}%
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500">הושלמו בדרך לתואר</span>
              </div>
              <div className="mt-4 h-2 rounded-full bg-[#FAEEE1] dark:bg-stone-800 overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${degreeProgress}%`, background: ACCENT }} />
              </div>
              <div className="mt-5 grid grid-cols-3 divide-x divide-x-reverse divide-stone-100 dark:divide-stone-800 text-center">
                <div>
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{creditsCompleted}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">נק' שהושלמו</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{creditsRequired}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">נדרש סה"כ</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{Math.max(0, creditsRequired - creditsCompleted)}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">נותרו</div>
                </div>
              </div>
            </>
          )}
        </Panel>

        {/* דדליינים קרובים */}
        <Panel className="p-5">
          <PanelHead icon={CalendarIcon} title="דדליינים קרובים" onAdd={() => setDeadlineModalOpen(true)} addLabel="הוספת דדליין" />
          <div className="grid grid-cols-3 gap-2">
            {dueColumns.map((col) => (
              <div key={col.key} className="min-w-0">
                <div className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 mb-2 text-center">{col.label}</div>
                <div className="rounded-xl border border-stone-100 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/30 p-1.5 space-y-1.5 min-h-[84px]">
                  {upcoming[col.key].length === 0 && <div className="text-[10px] text-stone-300 dark:text-stone-600 text-center pt-5">—</div>}
                  {upcoming[col.key].slice(0, 2).map((it) => {
                    const accent = courseAccent(it.courseId)
                    return (
                      <button
                        key={it.id}
                        onClick={() => openEdit(it.id)}
                        title={it.title}
                        className="w-full text-right rounded-lg px-1.5 py-1 hover:bg-white dark:hover:bg-stone-800 transition-colors"
                      >
                        <span className="flex items-start gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${accent.dot}`} />
                          <span className="block min-w-0 flex-1 text-[11px] font-medium leading-tight text-stone-700 dark:text-stone-200 truncate">{it.title}</span>
                        </span>
                        <span className="block text-[10px] leading-tight text-stone-400 dark:text-stone-500 truncate mt-0.5">
                          {courseName(it.courseId) ?? daysUntilLabel(it.date)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* יומן לימודים + חומרי לימוד */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5 items-start">
        {/* יומן לימודים */}
        <Panel className="p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />
              <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100">יומן לימודים</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekStart(startOfWeek(new Date()))}
                className="px-2.5 h-7 rounded-lg bg-stone-100 dark:bg-stone-800 text-[11px] font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
              >
                היום
              </button>
              <span className="text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">{monthLabel}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setWeekStart((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate() - 7))}
                  aria-label="שבוע קודם"
                  className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs"
                >
                  →
                </button>
                <button
                  onClick={() => setWeekStart((w) => new Date(w.getFullYear(), w.getMonth(), w.getDate() + 7))}
                  aria-label="שבוע הבא"
                  className="w-7 h-7 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 text-xs"
                >
                  ←
                </button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => {
              const iso = toISO(d)
              const isToday = iso === todayISO()
              const dayItems = itemsByDate[iso] || []
              return (
                <div key={iso} className="min-w-0">
                  <div className="text-center mb-2">
                    <div className="text-[10px] text-stone-400 dark:text-stone-500">{WEEKDAYS[i]}</div>
                    <div
                      className={`mx-auto mt-1 w-7 h-7 flex items-center justify-center rounded-full text-[13px] ${isToday ? 'text-white font-bold' : 'text-stone-700 dark:text-stone-200 font-semibold'}`}
                      style={isToday ? { background: ACCENT } : undefined}
                    >
                      {d.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1 min-h-[96px]">
                    {dayItems.slice(0, 3).map((it) => {
                      const accent = courseAccent(it.courseId)
                      return (
                        <button
                          key={it.id}
                          onClick={() => openEdit(it.id)}
                          className={`w-full text-right rounded-lg px-1.5 py-1.5 ${accent.bg} hover:opacity-75 transition-opacity`}
                        >
                          <span className={`block text-[10px] font-semibold leading-tight truncate ${accent.fg}`}>{it.title}</span>
                          <span className="block text-[9px] leading-tight text-stone-400 dark:text-stone-500 truncate mt-0.5">{courseName(it.courseId) ?? '—'}</span>
                        </button>
                      )
                    })}
                    {dayItems.length > 3 && <div className="text-[9px] text-stone-400 dark:text-stone-500 text-center">+{dayItems.length - 3}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        {/* חומרי לימוד */}
        <div>
          <SectionHead title="חומרי לימוד" action={<AddLink onClick={() => setMaterialModalOpen(true)} label="+ חומר לימוד" />} />
          <div className="grid grid-cols-4 gap-3">
            {materialTiles.map((m) => {
              const Icon = m.icon
              return (
                <Panel key={m.type} className="p-3.5 text-center transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md">
                  <span className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${m.bg}`}>
                    <Icon className={`w-5 h-5 ${m.fg}`} />
                  </span>
                  <div className="text-[13px] font-semibold text-stone-800 dark:text-stone-100">{m.label}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{studyMaterials.filter((sm) => sm.type === m.type).length} פריטים</div>
                </Panel>
              )
            })}
          </div>
          {studyMaterials.length > 0 && (
            <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
              {studyMaterials.slice(0, 3).map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-2 py-1.5 group">
                  <div className="text-xs text-stone-600 dark:text-stone-300 truncate">
                    {m.url ? (
                      <a href={m.url} target="_blank" rel="noreferrer" className="hover:underline">
                        {m.title}
                      </a>
                    ) : (
                      m.title
                    )}{' '}
                    <span className="text-stone-400 dark:text-stone-500">
                      · {materialTypeLabel[m.type]} · {courseName(m.courseId) ?? '—'}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteStudyMaterial(m.id)}
                    className="w-5 h-5 shrink-0 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <QuickAddPopover
        open={courseModal !== null}
        title={courseModal?.id ? 'עריכת קורס' : 'קורס חדש'}
        onClose={() => setCourseModal(null)}
        onSave={handleSaveCourse}
        onDelete={courseModal?.id ? handleDeleteCourse : undefined}
        initialValues={
          editingCourse
            ? {
                name: editingCourse.name,
                code: editingCourse.code ?? '',
                category: editingCourse.category ?? '',
                status: editingCourse.status,
                credits: editingCourse.credits?.toString() ?? '',
                nextSessionLabel: editingCourse.nextSessionLabel ?? '',
                notes: editingCourse.notes ?? '',
              }
            : undefined
        }
        fields={[
          { key: 'name', label: 'שם הקורס', type: 'text', required: true },
          { key: 'code', label: 'מספר קורס', type: 'text' },
          { key: 'category', label: 'קטגוריה', type: 'text' },
          { key: 'status', label: 'סטטוס', type: 'select', options: courseStatusOptions },
          { key: 'credits', label: 'נקודות זכות', type: 'number' },
          { key: 'nextSessionLabel', label: 'השיעור הבא', type: 'text', secondary: true },
          { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
        ]}
      />

      <QuickAddPopover
        open={gradeModalOpen}
        title="ציון חדש"
        onClose={() => setGradeModalOpen(false)}
        onSave={handleSaveGrade}
        fields={[
          { key: 'courseId', label: 'קורס', type: 'select', required: true, options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { key: 'label', label: 'שם הציון', type: 'text', required: true, placeholder: 'לדוגמה: מבחן אמצע' },
          { key: 'value', label: 'ציון', type: 'number', required: true },
          { key: 'weight', label: 'משקל באחוזים', type: 'number', secondary: true },
          { key: 'date', label: 'תאריך', type: 'date', secondary: true },
        ]}
      />

      <QuickAddPopover
        open={degreeModalOpen}
        title="קטגוריית דרישות תואר"
        onClose={() => setDegreeModalOpen(false)}
        onSave={handleSaveDegreeCategory}
        fields={[
          { key: 'label', label: 'שם הקטגוריה', type: 'text', required: true, placeholder: 'לדוגמה: יהדות' },
          { key: 'creditsRequired', label: 'נקודות זכות נדרשות', type: 'number', required: true },
          { key: 'creditsCompleted', label: 'נקודות זכות שהושלמו', type: 'number' },
        ]}
      />

      <QuickAddPopover
        open={materialModalOpen}
        title="חומר לימוד חדש"
        onClose={() => setMaterialModalOpen(false)}
        onSave={handleSaveMaterial}
        fields={[
          { key: 'courseId', label: 'קורס', type: 'select', required: true, options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { key: 'title', label: 'שם', type: 'text', required: true },
          { key: 'type', label: 'סוג', type: 'select', options: materialTypeOptions },
          { key: 'url', label: 'קישור', type: 'text', secondary: true },
        ]}
      />

      <QuickAddPopover
        open={deadlineModalOpen}
        title="דדליין חדש"
        onClose={() => setDeadlineModalOpen(false)}
        onSave={handleSaveDeadline}
        fields={[
          { key: 'title', label: 'כותרת', type: 'text', required: true },
          { key: 'courseId', label: 'קורס', type: 'select', options: courses.map((c) => ({ value: c.id, label: c.name })) },
          { key: 'studyKind', label: 'סוג', type: 'select', options: studyKindOptions },
          { key: 'date', label: 'תאריך', type: 'date' },
        ]}
      />
    </div>
  )
}
