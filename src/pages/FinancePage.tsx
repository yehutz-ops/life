import { WalletIcon, BulbIcon, CalendarIcon, TargetIcon } from '../components/hub/hubIcons'
import DomainHubLayout from '../components/hub/DomainHubLayout'
import HubSectionHeader from '../components/hub/HubSectionHeader'
import QuickCaptureBar from '../components/QuickCaptureBar'
import DonutChart from '../components/finance/DonutChart'
import AreaLineChart from '../components/finance/AreaLineChart'
import BarChart from '../components/finance/BarChart'
import Sparkline from '../components/finance/Sparkline'
import RadialProgress from '../components/finance/RadialProgress'
import MiniAreaChart from '../components/finance/MiniAreaChart'
import {
  mockMonthSummary,
  mockMonthlyTrend,
  mockExpenseCategories,
  mockAvailableMoneyTrend,
  mockUpcomingBills,
  mockInvestments,
  mockPension,
  mockLoans,
} from '../data/financeMockData'

function formatILS(n: number) {
  return `${Math.round(n).toLocaleString('he-IL')}₪`
}

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/60 dark:border-stone-800 p-5 ${className}`}>{children}</div>
}

// "DD/MM" (כמו ב-mockUpcomingBills) -> מספר ימים מהיום האמיתי (תאריך אמיתי, לא Mock).
function daysUntil(dmy: string): number {
  const [day, month] = dmy.split('/').map(Number)
  const now = new Date()
  const target = new Date(now.getFullYear(), month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

type InsightTone = 'calm' | 'warm' | 'alert'

const TONE_BG: Record<InsightTone, string> = {
  calm: 'bg-emerald-50 dark:bg-emerald-950/40',
  warm: 'bg-amber-50 dark:bg-amber-950/40',
  alert: 'bg-red-50 dark:bg-red-950/40',
}
const TONE_TEXT: Record<InsightTone, string> = {
  calm: 'text-emerald-700 dark:text-emerald-400',
  warm: 'text-amber-800 dark:text-amber-400',
  alert: 'text-red-700 dark:text-red-400',
}
const TONE_HEX: Record<InsightTone, string> = {
  calm: '#0F6E56',
  warm: '#B45309',
  alert: '#A32D2D',
}

interface Insight {
  icon: (props: { className?: string }) => JSX.Element
  title: string
  description: string
  tone: InsightTone
  wide?: boolean
}

export default function FinancePage() {
  const s = mockMonthSummary
  const barData = mockMonthlyTrend.map((m) => ({ label: m.month, value: m.expenses }))
  const availableTrendValues = mockAvailableMoneyTrend.map((p) => p.value)

  // תאריך אמיתי (לא Mock) — כמה ימים יש בחודש הנוכחי וכמה נשארו, לצורך "מותר להוציא היום" והתחזית.
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const dayOfMonth = now.getDate()
  const daysRemainingInclusive = Math.max(1, daysInMonth - dayOfMonth + 1)
  const daysRemainingExclusive = Math.max(0, daysInMonth - dayOfMonth)
  const daysElapsed = Math.max(1, dayOfMonth)

  const hasAvailable = typeof s.availableThisMonth === 'number'
  const dailyAllowance = hasAvailable ? s.availableThisMonth / daysRemainingInclusive : null

  const dailyAvgSpend = s.expensesThisMonth / daysElapsed
  const projectedAdditionalSpend = dailyAvgSpend * daysRemainingExclusive
  const projectedEndOfMonth = hasAvailable ? s.availableThisMonth - projectedAdditionalSpend : null

  const nearestBill = [...mockUpcomingBills].sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0]
  const [prevMonth, currentMonth] = mockMonthlyTrend.slice(-2)
  const momChangePercent = prevMonth?.expenses ? Math.round(((currentMonth.expenses - prevMonth.expenses) / prevMonth.expenses) * 100) : null

  const dailyAllowanceTone: InsightTone = dailyAllowance !== null && dailyAllowance < 150 ? 'warm' : 'calm'
  const forecastTone: InsightTone = projectedEndOfMonth === null ? 'calm' : projectedEndOfMonth >= 0 ? 'calm' : 'alert'

  // נקודות ל-Mini Area Chart של התחזית: אינטרפולציה פשוטה בין "פנוי נוכחי" ל"תחזית סוף חודש" —
  // אותו חישוב שכבר קיים (projectedEndOfMonth), רק מוצג כקו מדורג במקום שתי נקודות בלבד.
  const FORECAST_STEPS = 6
  const forecastPoints =
    hasAvailable && projectedEndOfMonth !== null
      ? Array.from({ length: FORECAST_STEPS }, (_, i) => s.availableThisMonth + (projectedEndOfMonth - s.availableThisMonth) * (i / (FORECAST_STEPS - 1)))
      : []
  const forecastLabels = ['היום', '', '', '', '', 'סוף החודש']

  // כל התובנות מחושבות מהנתונים שכבר מוצגים בעמוד (עדיין Mock ברמת כל הדף) — לא נוספו נתוני הדגמה נפרדים.
  const insights: Insight[] = []
  if (dailyAllowance !== null) {
    insights.push({ icon: WalletIcon, title: 'תקציב יומי', description: `נשארו לך כ-${formatILS(dailyAllowance)} ליום עד סוף החודש`, tone: dailyAllowanceTone })
  }
  if (nearestBill) {
    const d = daysUntil(nearestBill.date)
    insights.push({
      icon: CalendarIcon,
      title: 'חיוב קרוב',
      description: d <= 0 ? `היום צפוי חיוב של ${formatILS(nearestBill.amount)} (${nearestBill.name})` : `בעוד ${d} ימים צפוי חיוב של ${formatILS(nearestBill.amount)} (${nearestBill.name})`,
      tone: 'calm',
    })
  }
  if (projectedEndOfMonth !== null) {
    insights.push({
      icon: TargetIcon,
      title: 'תחזית סוף חודש',
      description: projectedEndOfMonth >= 0 ? `בקצב הנוכחי צפויים להישאר ${formatILS(projectedEndOfMonth)}` : `בקצב הנוכחי צפויה חריגה של ${formatILS(Math.abs(projectedEndOfMonth))}`,
      tone: forecastTone,
      wide: true,
    })
  }
  if (momChangePercent !== null) {
    insights.push({
      icon: BulbIcon,
      title: 'מול חודש שעבר',
      description: `ההוצאות ${momChangePercent >= 0 ? 'גבוהות' : 'נמוכות'} ב-${Math.abs(momChangePercent)}% מהחודש שעבר`,
      tone: momChangePercent >= 0 ? 'warm' : 'calm',
    })
  }

  return (
    <DomainHubLayout name="כספים" icon={WalletIcon}>
      <QuickCaptureBar />

      {/* Header + פנוי החודש */}
      <div className="text-center py-4">
        <div className="text-xs font-medium tracking-wide text-stone-400 dark:text-stone-500 uppercase">פנוי החודש</div>
        <div className="text-5xl font-bold text-stone-800 dark:text-stone-100 mt-2">{formatILS(s.availableThisMonth)}</div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-5 text-sm">
          <div>
            <span className="text-stone-400 dark:text-stone-500">נזיל עכשיו · </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{formatILS(s.liquidNow)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500">הכנסות החודש · </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{formatILS(s.incomeThisMonth)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500">הוצאות החודש · </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{formatILS(s.expensesThisMonth)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500">הוצאות קבועות · </span>
            <span className="font-medium text-stone-700 dark:text-stone-200">{formatILS(s.fixedExpenses)}</span>
          </div>
          <div>
            <span className="text-stone-400 dark:text-stone-500">צפוי לרדת עד סוף החודש · </span>
            <span className="font-medium text-amber-800 dark:text-amber-400">{formatILS(s.projectedDrop)}</span>
          </div>
        </div>
      </div>

      {/* 1 + 2. כמה מותר להוציא היום | תחזית לסוף החודש */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Panel className="lg:col-span-1 flex flex-col items-center text-center">
          <div className="w-full">
            <HubSectionHeader title="כמה מותר להוציא היום" />
          </div>
          {dailyAllowance !== null ? (
            <>
              <RadialProgress percent={(dayOfMonth / daysInMonth) * 100} color={TONE_HEX[dailyAllowanceTone]} size={108}>
                <span className="text-xl font-bold text-stone-800 dark:text-stone-100">{formatILS(dailyAllowance)}</span>
              </RadialProgress>
              <div className="text-xs text-stone-400 dark:text-stone-500 mt-3">נשארו {daysRemainingInclusive} ימים לחודש</div>
            </>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500 py-8">אין עדיין מספיק נתונים לחישוב תקציב יומי</p>
          )}
        </Panel>

        <Panel className="lg:col-span-2">
          <HubSectionHeader title="תחזית לסוף החודש" />
          {projectedEndOfMonth !== null ? (
            <>
              <p className="text-sm text-stone-700 dark:text-stone-200 mb-2">
                {projectedEndOfMonth >= 0
                  ? `בקצב ההוצאות הנוכחי, צפויים להישאר כ-${formatILS(projectedEndOfMonth)} בסוף החודש.`
                  : `בקצב ההוצאות הנוכחי, צפויה חריגה של כ-${formatILS(Math.abs(projectedEndOfMonth))} עד סוף החודש.`}
              </p>
              <MiniAreaChart data={forecastPoints} labels={forecastLabels} color={TONE_HEX[forecastTone]} height={110} />
            </>
          ) : (
            <p className="text-sm text-stone-400 dark:text-stone-500">אין עדיין מספיק נתונים לחישוב תחזית.</p>
          )}
        </Panel>
      </div>

      {/* 3. תובנות חכמות */}
      {insights.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {insights.map((insight, i) => {
            const Icon = insight.icon
            return (
              <div
                key={i}
                className={`rounded-2xl border border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 p-4 ${insight.wide ? 'col-span-2' : 'col-span-1'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${TONE_BG[insight.tone]}`}>
                    <Icon className={`w-3.5 h-3.5 ${TONE_TEXT[insight.tone]}`} />
                  </span>
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">{insight.title}</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400">{insight.description}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* שורה: הכנסות מול הוצאות | הוצאות לפי קטגוריה | הוצאות קרובות */}
      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        <Panel>
          <HubSectionHeader title="הכנסות מול הוצאות" />
          <AreaLineChart data={mockMonthlyTrend} />
        </Panel>

        <Panel>
          <HubSectionHeader title="חלוקת הוצאות החודש" />
          <DonutChart data={mockExpenseCategories} />
        </Panel>

        <Panel>
          <HubSectionHeader title="הוצאות קרובות" />
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {mockUpcomingBills.map((b) => (
              <li key={b.name} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-stone-800 dark:text-stone-100">{b.name}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium text-stone-700 dark:text-stone-200">{formatILS(b.amount)}</span>
                  <span className="text-xs text-stone-400 dark:text-stone-500 w-12 text-left">{b.date}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* שורה: השקעות | פנסיה וחיסכון | הלוואות | החודש שלי */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mt-6">
        <Panel>
          <HubSectionHeader title="השקעות" />
          <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{formatILS(mockInvestments.totalValue)}</div>
          <div className={`text-xs font-medium mt-1 ${mockInvestments.changePercent >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
            {mockInvestments.changePercent >= 0 ? '+' : ''}
            {mockInvestments.changePercent}% החודש
          </div>
          <div className="mt-3">
            <Sparkline data={mockInvestments.trend} width={160} height={36} />
          </div>
        </Panel>

        <Panel>
          <HubSectionHeader title="פנסיה וחיסכון" />
          <div className="text-2xl font-bold text-stone-800 dark:text-stone-100">{formatILS(mockPension.total)}</div>
          <ul className="mt-3 space-y-1.5">
            {mockPension.breakdown.map((b) => (
              <li key={b.name} className="flex items-center justify-between text-xs">
                <span className="text-stone-500 dark:text-stone-400">{b.name}</span>
                <span className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(b.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <HubSectionHeader title="הלוואות" />
          {mockLoans.map((loan) => (
            <div key={loan.name} className="mb-2 last:mb-0">
              <div className="text-sm text-stone-800 dark:text-stone-100 font-medium">{loan.name}</div>
              <div className="text-xl font-bold text-stone-800 dark:text-stone-100 mt-1">{formatILS(loan.balance)}</div>
              <div className="flex items-center justify-between text-xs text-stone-400 dark:text-stone-500 mt-1.5">
                <span>תשלום חודשי {formatILS(loan.monthlyPayment)}</span>
                <span>הבא: {loan.nextPaymentDate}</span>
              </div>
            </div>
          ))}
        </Panel>

        <Panel>
          <HubSectionHeader title="החודש שלי" />
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">הכנסות</span>
              <span className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(s.incomeThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">− הוצאות</span>
              <span className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(s.expensesThisMonth)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-stone-400">− התחייבויות קרובות</span>
              <span className="text-stone-700 dark:text-stone-200 font-medium">{formatILS(s.upcomingCommitments)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-stone-800">
              <span className="text-stone-800 dark:text-stone-100 font-semibold">= פנוי החודש</span>
              <span className="text-stone-800 dark:text-stone-100 font-bold">{formatILS(s.availableThisMonth)}</span>
            </div>
          </div>
        </Panel>
      </div>

      {/* גרפים נוספים */}
      <div className="grid sm:grid-cols-2 gap-6 mt-6">
        <Panel>
          <HubSectionHeader title="הוצאות לפי חודשים" />
          <BarChart data={barData} />
        </Panel>

        <Panel>
          <HubSectionHeader title="כסף פנוי לאורך החודש" />
          <div className="pt-2">
            <Sparkline data={availableTrendValues} width={400} height={80} />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
            {mockAvailableMoneyTrend.map((p) => (
              <span key={p.label}>{p.label}</span>
            ))}
          </div>
        </Panel>
      </div>
    </DomainHubLayout>
  )
}
