import { ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackButton from '../components/BackButton'
import { useStore } from '../data/StoreContext'
import { useNotify } from '../data/NotificationContext'
import DonutChart from '../components/finance/DonutChart'
import GroupedBarChart from '../components/finance/GroupedBarChart'
import { TruckIcon, BoxIcon, ChecklistIcon, ReceiptIcon, UsersIcon, CalendarIcon, WalletIcon, TagIcon } from '../components/hub/hubIcons'
import { ShipmentStatus, Shipment } from '../data/shipmentTypes'
import { INVOICE_STATUS_LABEL } from '../data/shipmentFinanceTypes'
import { computeShipmentsKpis, shipmentFinance, invoiceStateForShipment, estimatedVat } from '../rfq/shipmentFinance'
import { computeAttention, paymentsByMonth } from '../rfq/shipmentAttention'
import { processRfqEmails } from '../rfq/processRfqEmails'
import { currentQuotes } from '../rfq/quoteComparison'
import { todayISO } from '../utils/date'

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  preparing: 'בהכנה',
  waiting_for_quotes: 'ממתין להצעה',
  quotes_received: 'התקבלו הצעות',
  waiting_for_pickup: 'ממתין לאיסוף',
  picked_up: 'נאסף',
  in_transit: 'בדרך',
  customs: 'במכס',
  delivered: 'שוחרר',
  missing_documents: 'חסרים מסמכים',
  issue: 'בעיה',
}

const STATUS_TONE: Record<ShipmentStatus, string> = {
  preparing: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
  waiting_for_quotes: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  quotes_received: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  waiting_for_pickup: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  picked_up: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  in_transit: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  customs: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  missing_documents: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  issue: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
}

const INVOICE_TONE = {
  good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  alert: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  neutral: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
} as const

const SEVERITY_DOT = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-blue-500' } as const

const MODE_LABEL: Record<string, string> = { air: 'אווירי', sea: 'ימי', other: 'אחר' }

type SortKey = 'eta' | 'name' | 'status'

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

// גודל הערך נקבע לפי אורכו, כדי שמספר ארוך יקטן במקום להיחתך בשלוש נקודות.
function kpiValueSize(v: string): string {
  if (v.length <= 3) return 'text-[26px]'
  if (v.length <= 5) return 'text-[23px]'
  if (v.length <= 7) return 'text-[19px]'
  return 'text-[16px]'
}

function shekel(n: number): string {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

function relativeDays(iso?: string, today = todayISO()): string {
  if (!iso) return ''
  const diff = Math.round((new Date(iso + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
  if (diff === 0) return 'היום'
  if (diff === 1) return 'מחר'
  if (diff > 0) return `עוד ${diff} ימים`
  return `לפני ${Math.abs(diff)} ימים`
}

export default function ShipmentsPage() {
  const store = useStore()
  const { shipments, brands, forwarders, shipmentQuotes, shipmentInvoices, shipmentPayments, rfqDispatches, rfqUnmatchedEmails } = store
  const notify = useNotify()
  const today = todayISO()

  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | ShipmentStatus>('active')
  const [sortKey, setSortKey] = useState<SortKey>('eta')
  const [checking, setChecking] = useState(false)
  const [visible, setVisible] = useState(12)

  const kpis = useMemo(
    () => computeShipmentsKpis(shipments, shipmentQuotes, shipmentInvoices, shipmentPayments, forwarders, today),
    [shipments, shipmentQuotes, shipmentInvoices, shipmentPayments, forwarders, today],
  )

  // "הצעות שהתקבלו" בכרטיס הפעולות המהירות פותח את לוח השוואת ה-RFQ הקיים (לפי משלוח),
  // ולא בונה מסך חדש — צריך משלוח יעד. בוחרים את המשלוח עם הכי הרבה הצעות פעילות
  // להשוואה (הכי רלוונטי כרגע); בלי הצעות בכלל, חוזרים למסך רשימת ההצעות הכללי.
  const rfqComparisonTarget = useMemo(() => {
    let best: { id: string; count: number } | null = null
    for (const s of shipments) {
      const count = currentQuotes(shipmentQuotes, s.id).length
      if (count > 0 && (!best || count > best.count)) best = { id: s.id, count }
    }
    return best?.id ?? null
  }, [shipments, shipmentQuotes])

  const attention = useMemo(
    () => computeAttention(shipments, shipmentQuotes, rfqDispatches, rfqUnmatchedEmails, shipmentInvoices, shipmentPayments, forwarders, today, 4),
    [shipments, shipmentQuotes, rfqDispatches, rfqUnmatchedEmails, shipmentInvoices, shipmentPayments, forwarders, today],
  )

  // סינון/מיון מתבצעים על המערך המלא ורק אז נחתכים לתצוגה — כך הטבלה מחזיקה מאות משלוחים
  // בלי לרנדר מאות שורות בבת אחת.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = shipments.filter((s) => {
      if (statusFilter === 'active' && s.status === 'delivered') return false
      if (statusFilter !== 'all' && statusFilter !== 'active' && s.status !== statusFilter) return false
      if (!q) return true
      const brand = s.brandId ? brands.find((b) => b.id === s.brandId)?.name : undefined
      return [s.name, s.rfqReference, s.supplierName, brand, s.originCountry, s.trackingNumber]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    })
    return rows.sort((a, b) => {
      if (sortKey === 'name') return (a.name ?? '').localeCompare(b.name ?? '')
      if (sortKey === 'status') return a.status.localeCompare(b.status)
      return (a.eta ?? '9999').localeCompare(b.eta ?? '9999')
    })
  }, [shipments, brands, query, statusFilter, sortKey])

  const modeDonut = useMemo(() => {
    const counts = { air: 0, sea: 0, other: 0 }
    shipments.forEach((s) => {
      const m = (s.shippingMode ?? 'other') as keyof typeof counts
      counts[m in counts ? m : 'other']++
    })
    return [
      { name: 'אווירי', amount: counts.air, color: '#3557D6' },
      { name: 'ימי', amount: counts.sea, color: '#12897A' },
      { name: 'אחר', amount: counts.other, color: '#A8A29E' },
    ].filter((d) => d.amount > 0)
  }, [shipments])

  const monthly = useMemo(() => paymentsByMonth(shipmentInvoices, shipmentPayments, 6, today), [shipmentInvoices, shipmentPayments, today])

  const monthKey = today.slice(0, 7)
  const billedThisMonth = shipmentInvoices.filter((i) => i.invoiceDate?.startsWith(monthKey)).reduce((s, i) => s + (i.amount ?? 0), 0)
  const paidThisMonth = shipmentPayments.filter((p) => p.paidAt.startsWith(monthKey)).reduce((s, p) => s + p.amount, 0)
  const outstandingThisMonth = Math.max(0, billedThisMonth - paidThisMonth)

  // חשבוניות פתוחות עם מועד תשלום, מהקרוב לרחוק.
  const upcomingInvoices = useMemo(() => {
    return shipmentInvoices
      .filter((i) => i.status !== 'paid')
      .map((i) => {
        const s = shipments.find((sh) => sh.id === i.shipmentId)
        const due = s ? shipmentFinance(s, [i], [], forwarders).nextDueDate : undefined
        return { invoice: i, shipment: s, due }
      })
      .filter((x) => x.shipment)
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
      .slice(0, 4)
  }, [shipmentInvoices, shipments, forwarders])

  async function handleCheckEmails() {
    setChecking(true)
    try {
      const summary = await processRfqEmails(store)
      const parts = [
        `נבדקו ${summary.checked} מיילים`,
        summary.quotesCreated > 0 ? `${summary.quotesCreated} הצעות נקלטו` : null,
        summary.needsMatch > 0 ? `${summary.needsMatch} דורשים התאמה` : null,
      ].filter(Boolean)
      notify(parts.join(' · ') || 'אין מיילים חדשים', summary.errors.length ? 'error' : 'success')
    } catch {
      notify('בדיקת המיילים נכשלה', 'error')
    } finally {
      setChecking(false)
    }
  }

  const kpiCards: { label: string; value: string; sub?: string; icon: ReactNode; bg: string }[] = [
    {
      label: 'משלוחים פעילים',
      value: String(kpis.active),
      sub: `${shipments.length} סה״כ במערכת`,
      icon: <TruckIcon className="w-5 h-5 text-blue-500" />,
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      label: 'ממתינים להצעות',
      value: String(kpis.awaitingQuotes),
      sub: `${kpis.quotesReceived} הצעות התקבלו`,
      icon: <ChecklistIcon className="w-5 h-5 text-emerald-500" />,
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      label: 'תשלומים קרובים',
      value: shekel(kpis.upcomingPaymentsAmount),
      sub: `${kpis.upcomingPaymentsCount} חשבוניות בשבוע הקרוב`,
      icon: <CalendarIcon className="w-5 h-5 text-rose-500" />,
      bg: 'bg-rose-50 dark:bg-rose-950/30',
    },
    {
      label: 'חשבוניות חסרות',
      value: String(kpis.missingInvoices),
      sub: kpis.missingInvoices > 0 ? 'דורש מעקב מול הסוכנות' : 'הכל התקבל',
      icon: <ReceiptIcon className="w-5 h-5 text-amber-600" />,
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      label: 'מע״מ צפוי',
      value: shekel(kpis.vatDue),
      sub: 'אומדן — לא סכום רשמי',
      icon: <WalletIcon className="w-5 h-5 text-violet-500" />,
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
    {
      label: 'מגיעים השבוע',
      value: String(kpis.arrivingThisWeek),
      sub: 'לפי ETA מעודכן',
      icon: <BoxIcon className="w-5 h-5 text-cyan-600" />,
      bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    },
  ]

  const quickActions = [
    { to: '/work/shipments/new', title: 'בקשת הצעת מחיר חדשה', sub: 'צור RFQ חדש לספקים וסוכנויות', bg: 'bg-amber-500', icon: <TagIcon className="w-4 h-4 text-white" /> },
    {
      to: rfqComparisonTarget ? `/work/shipments/${rfqComparisonTarget}/rfq` : '/work/shipments/quotes',
      title: 'הצעות שהתקבלו',
      sub: 'צפה והשווה טיפול בהצעות',
      bg: 'bg-emerald-600',
      icon: <ChecklistIcon className="w-4 h-4 text-white" />,
    },
    { to: '/work/shipments/agencies', title: 'סוכנויות ושותפים', sub: 'ניהול קשרי סוכנויות וספקים', bg: 'bg-violet-600', icon: <UsersIcon className="w-4 h-4 text-white" /> },
    { to: '/work/shipments/finance', title: 'מסמכים וחשבוניות', sub: 'צפה בכל המסמכים והחשבוניות', bg: 'bg-cyan-600', icon: <ReceiptIcon className="w-4 h-4 text-white" /> },
  ]

  return (
    <div className="space-y-5 pb-24">
      {/* ===== כותרת ===== */}
      <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-stone-200/70 dark:border-stone-800">
        <div className="flex items-center gap-3">
          <BackButton to="/work" label="עבודה" />
          <div>
            <h1 className="text-[30px] font-extrabold text-stone-900 dark:text-stone-100 leading-tight">יבוא ומשלוחים</h1>
            <p className="text-[13px] text-stone-400 dark:text-stone-500 mt-0.5">סקירה מהירה של המשלוחים, התשלומים והמסמכים</p>
          </div>
          <span className="w-12 h-12 rounded-2xl bg-[#FBF0E2] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <BoxIcon className="w-6 h-6 text-amber-800/80 dark:text-amber-300" />
          </span>
        </div>
        <button
          onClick={handleCheckEmails}
          disabled={checking}
          className="px-4 py-2.5 rounded-xl bg-[#3B2A1C] text-white text-sm font-medium hover:bg-[#2A1E14] disabled:opacity-60"
        >
          {checking ? 'בודק מיילים…' : 'בדוק תשובות במייל'}
        </button>
      </div>

      {/* ===== KPI ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpiCards.map((k) => (
          <Panel key={k.label} className="p-3.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[12px] text-stone-500 dark:text-stone-400 truncate">{k.label}</div>
                <div className={`font-extrabold text-stone-900 dark:text-stone-100 leading-tight mt-1 whitespace-nowrap ${kpiValueSize(k.value)}`}>
                  {k.value}
                </div>
              </div>
              <span className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${k.bg}`}>{k.icon}</span>
            </div>
            {k.sub && <div className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-2 truncate">{k.sub}</div>}
          </Panel>
        ))}
      </div>

      {/* ===== טבלת משלוחים + פאנלים ימניים ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.54fr)] gap-4 items-start">
        {/* --- עמודה ימנית --- */}
        <div className="space-y-4">
          <Panel className="p-4">
            <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-2.5">פעולות מהירות</h2>
            <div className="space-y-1.5">
              {quickActions.map((a) => (
                <Link
                  key={a.to}
                  to={a.to}
                  className="flex items-center gap-2.5 rounded-xl border border-stone-200/80 dark:border-stone-800 px-3 py-1.5 hover:bg-stone-50 dark:hover:bg-stone-800/60 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm transition-all duration-150 group"
                >
                  <span className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${a.bg}`}>{a.icon}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] font-semibold text-stone-800 dark:text-stone-100 truncate leading-tight">{a.title}</span>
                    <span className="block text-[10.5px] text-stone-400 dark:text-stone-500 truncate leading-tight">{a.sub}</span>
                  </span>
                  <span className="text-stone-300 dark:text-stone-600 shrink-0 group-hover:text-stone-500 transition-colors">←</span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100">התראות ועדכונים</h2>
              <span className="text-stone-300 dark:text-stone-600 text-sm">🔔</span>
            </div>
            {attention.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400 dark:text-stone-500">אין כרגע דבר שדורש טיפול</div>
            ) : (
              <ul className="space-y-1.5">
                {attention.map((a) => (
                  <li key={a.id}>
                    <Link to={a.to} className="flex items-center gap-2 group" title={`${a.title} — ${a.detail}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${SEVERITY_DOT[a.severity]}`} />
                      <span className="flex-1 min-w-0 text-[12px] text-stone-700 dark:text-stone-200 leading-tight truncate group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                        {a.title}
                      </span>
                      <span className="text-[10.5px] text-stone-400 dark:text-stone-500 truncate shrink-0 max-w-[42%]">{a.detail.split(' · ')[0]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/work/shipments/quotes" className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-400 mt-2.5 hover:opacity-70">
              <span>←</span> כל ההתראות
            </Link>
          </Panel>
        </div>

        {/* --- טבלת משלוחים --- */}
        <Panel className="p-4">
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100">משלוחים פעילים</h2>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="חיפוש משלוח, ספק, RFQ…"
                className="w-44 rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800 px-2.5 py-1.5 text-[11px] placeholder:text-stone-400"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                className="rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800 px-2 py-1.5 text-[11px] text-stone-600 dark:text-stone-300"
              >
                <option value="active">פעילים</option>
                <option value="all">הכל</option>
                {(Object.keys(STATUS_LABEL) as ShipmentStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-lg border border-stone-200 dark:border-stone-700 dark:bg-stone-800 px-2 py-1.5 text-[11px] text-stone-600 dark:text-stone-300"
              >
                <option value="eta">לפי ETA</option>
                <option value="name">לפי שם</option>
                <option value="status">לפי סטטוס</option>
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
              {shipments.length === 0 ? 'עדיין אין משלוחים — התחל מבקשת הצעת מחיר חדשה' : 'אין משלוחים שתואמים את הסינון'}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-[12px] min-w-[720px]">
                <thead>
                  <tr className="text-[11px] text-stone-500 dark:text-stone-400 bg-stone-50/70 dark:bg-stone-800/40">
                    <th className="text-right font-medium py-1 px-2 rounded-s-lg">שם משלוח</th>
                    <th className="text-right font-medium py-1 px-2">ספק / מותג</th>
                    <th className="text-right font-medium py-1 px-2">סוג שילוח</th>
                    <th className="text-right font-medium py-1 px-2">סטטוס</th>
                    <th className="text-right font-medium py-1 px-2">תאריך הגעה / ETA</th>
                    <th className="text-right font-medium py-1 px-2">מועד תשלום</th>
                    <th className="text-right font-medium py-1 px-2 rounded-e-lg">מצב חשבונית</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filtered.slice(0, visible).map((s: Shipment) => {
                    const brand = s.brandId ? brands.find((b) => b.id === s.brandId)?.name : undefined
                    const fin = shipmentFinance(s, shipmentInvoices, shipmentPayments, forwarders)
                    const inv = invoiceStateForShipment(s, shipmentInvoices)
                    return (
                      <tr key={s.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                        <td className="py-2 px-2">
                          <Link to={`/work/shipments/${s.id}`} className="font-semibold text-stone-800 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400">
                            {s.name ?? `#${s.id.slice(-6)}`}
                          </Link>
                          {s.rfqReference && <div className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">{s.rfqReference}</div>}
                        </td>
                        <td className="py-2 px-2 text-stone-600 dark:text-stone-300">{brand ?? s.supplierName ?? '—'}</td>
                        <td className="py-2 px-2 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                          {s.shippingMode === 'sea' ? '🚢' : s.shippingMode === 'air' ? '✈️' : '📦'} {MODE_LABEL[s.shippingMode ?? 'other']}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${STATUS_TONE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className="text-stone-700 dark:text-stone-200">{s.eta ?? '—'}</div>
                          {s.eta && <div className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">{relativeDays(s.eta, today)}</div>}
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <div className={fin.nextDueDate && fin.nextDueDate < today ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-stone-700 dark:text-stone-200'}>
                            {fin.nextDueDate ?? '—'}
                          </div>
                          {fin.nextDueDate && <div className="text-[10.5px] text-stone-400 dark:text-stone-500 mt-0.5">{relativeDays(fin.nextDueDate, today)}</div>}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-medium whitespace-nowrap ${INVOICE_TONE[inv.tone]}`}>{inv.label}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {filtered.length > visible && (
                <button
                  onClick={() => setVisible((v) => v + 20)}
                  className="w-full mt-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-[12px] text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  הצג עוד ({filtered.length - visible} נוספים)
                </button>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* ===== שורה תחתונה: חשבוניות · סיכום · ניתוח ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.77fr)_minmax(0,1fr)_minmax(0,2.74fr)] gap-4 items-start">
        {/* חשבוניות ותאריכי תשלום */}
        <Panel className="p-4">
          <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-3">חשבוניות ותאריכי תשלום קרובים</h2>
          {upcomingInvoices.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">אין חשבוניות פתוחות</div>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {upcomingInvoices.map(({ invoice, shipment, due }) => (
                <li key={invoice.id} className="py-1.5">
                  <Link to={`/work/shipments/${invoice.shipmentId}`} className="flex items-start justify-between gap-2 group">
                    <div className="min-w-0">
                      <div className="text-[12.5px] font-semibold text-stone-800 dark:text-stone-100 truncate leading-tight group-hover:text-amber-800 dark:group-hover:text-amber-400">
                        {shipment?.name ?? shipment?.rfqReference ?? '—'}
                      </div>
                      <div className="text-[10.5px] truncate leading-tight mt-1">
                        <span className="text-stone-400 dark:text-stone-500">{invoice.issuerName}</span>
                        <span className={invoice.status === 'expected' ? 'text-rose-500' : 'text-stone-400 dark:text-stone-500'}> · {INVOICE_STATUS_LABEL[invoice.status]}</span>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="text-[12.5px] font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap">
                        {invoice.amount != null ? `${invoice.currency ?? '₪'}${invoice.amount.toLocaleString('he-IL')}` : '—'}
                      </div>
                      {due && (
                        <div className="text-[10.5px] leading-tight mt-1">
                          <span className="text-stone-500 dark:text-stone-400">{due}</span>
                          <span className={due < today ? 'text-rose-500' : 'text-amber-600'}> · {relativeDays(due, today)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link to="/work/shipments/finance" className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-400 mt-3 hover:opacity-70">
            <span>←</span> לכל התשלומים
          </Link>
        </Panel>

        {/* סיכום חודשי */}
        <div className="space-y-3">
          {[
            { label: 'סך חיובי החודש', value: billedThisMonth, tone: 'text-stone-800 dark:text-stone-100', icon: '📊' },
            { label: 'שולם', value: paidThisMonth, tone: 'text-emerald-600 dark:text-emerald-400', icon: '✓' },
            { label: 'נותר לתשלום', value: outstandingThisMonth, tone: 'text-amber-600 dark:text-amber-400', icon: '⏳' },
          ].map((m) => (
            <Panel key={m.label} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{m.label}</div>
                  <div className={`text-[19px] font-extrabold mt-0.5 truncate ${m.tone}`}>{shekel(m.value)}</div>
                  {m.label !== 'סך חיובי החודש' && billedThisMonth > 0 && (
                    <div className="text-[9.5px] text-stone-400 dark:text-stone-500 mt-0.5">{Math.round((m.value / billedThisMonth) * 100)}% מהחודש</div>
                  )}
                </div>
                <span className="w-7 h-7 rounded-full bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-[11px] shrink-0">{m.icon}</span>
              </div>
            </Panel>
          ))}
        </div>

        {/* ניתוח */}
        <Panel className="p-4">
          <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-3">ניתוח פיננסי ומשלוחים</h2>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.18fr)_minmax(0,1.45fr)] gap-3">
            <div className="rounded-xl border border-stone-100 dark:border-stone-800 p-3">
              <div className="text-[12px] font-semibold text-stone-700 dark:text-stone-200">התפלגות משלוחים</div>
              <div className="text-[10.5px] text-stone-400 dark:text-stone-500 mb-2.5">לפי סוג שילוח</div>
              {modeDonut.length > 0 ? (
                <DonutChart data={modeDonut} size={82} strokeWidth={13} valueSuffix="" centerLabel="משלוחים" />
              ) : (
                <div className="h-[96px] flex items-center justify-center text-[11px] text-stone-300">אין נתונים</div>
              )}
            </div>
            <div className="rounded-xl border border-stone-100 dark:border-stone-800 p-3">
              <div className="text-[12px] font-semibold text-stone-700 dark:text-stone-200 mb-2.5">חיובים מול תשלומים (₪)</div>
              <GroupedBarChart data={monthly.map((m) => ({ label: m.label, a: m.invoiced, b: m.paid }))} height={140} labelA="חויב" labelB="שולם" />
            </div>
          </div>
        </Panel>
      </div>
    </div>
  )
}
