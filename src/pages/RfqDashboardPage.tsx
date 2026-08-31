import { ReactNode, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { useNotify } from '../data/NotificationContext'
import { useConfirm } from '../data/ConfirmContext'
import BarChart from '../components/finance/BarChart'
import DonutChart from '../components/finance/DonutChart'
import ScatterChart, { ScatterPoint } from '../components/finance/ScatterChart'
import { CalendarIcon, TruckIcon, ChecklistIcon } from '../components/hub/hubIcons'
import { compareByMode, currentQuotes, quoteVersions, quoteMode } from '../rfq/quoteComparison'
import { buildRfqInbox } from '../rfq/rfqInbox'
import { processRfqEmails, RfqProcessSummary } from '../rfq/processRfqEmails'
import { buildFollowUpDraft, missingFieldKeys, saveFollowUpDraft, FollowUpError } from '../rfq/followUp'
import { TRANSPORT_MODE_LABEL, INCLUSION_LABEL, DISPATCH_STATUS_LABEL, DispatchStatus, TransportMode } from '../data/rfqTypes'
import { ShipmentQuote, ShipmentTimelineStage } from '../data/shipmentTypes'
import { todayISO } from '../utils/date'

const ACCENT = '#92400E'

const AGENCY_COLORS = ['#92400E', '#3557D6', '#12897A', '#6B4FA0', '#D9622B', '#5B7A3E']

const STAGE_LABEL: Record<ShipmentTimelineStage, string> = {
  rfq_created: 'בקשת הצעת מחיר נוצרה',
  rfq_pdf_generated: 'מסמך ה-RFQ נוצר',
  rfq_sent: 'הבקשה נשלחה לסוכנויות',
  quote_received: 'התקבלה הצעת מחיר',
  quote_revised: 'התקבלה הצעה מעודכנת',
  followup_requested: 'נשלחה בקשת השלמה',
  quote_selected: 'הצעת מחיר נבחרה',
  pickup_booked: 'איסוף תואם',
  collected: 'נאסף',
  tracking_update: 'עדכון מעקב',
  customs: 'מכס',
  delivered: 'התקבל',
}

// תוויות מקוצרות לטבלה הצרה ברצועה הימנית. התוויות המלאות (DISPATCH_STATUS_LABEL) נשארות כפי שהן.
const DISPATCH_SHORT: Record<DispatchStatus, string> = {
  not_sent: 'טרם נשלח',
  sent: 'נשלח',
  waiting: 'ממתינה',
  replied: 'התקבלה',
  incomplete: 'חסר מידע',
  revised: 'עודכנה',
  selected: 'נבחרה',
  rejected: 'נדחתה',
  failed: 'נכשל',
}

const DISPATCH_TONE: Record<DispatchStatus, string> = {
  not_sent: 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400',
  sent: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  waiting: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  replied: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  incomplete: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  revised: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
  selected: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200',
  rejected: 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500',
  failed: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
}

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

function PanelHead({ icon, title, action }: { icon?: ReactNode; title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <div className="flex items-center gap-2 min-w-0">
        {icon}
        <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap">{title}</h2>
      </div>
      {action}
    </div>
  )
}

function Chip({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'accent' }) {
  const tones = {
    neutral: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
    good: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    warn: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    accent: 'bg-amber-800 text-white',
  }
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

function money(value?: number, currency?: string): string {
  if (value == null) return '—'
  return `${currency ?? ''} ${value.toLocaleString('he-IL')}`.trim()
}

export default function RfqDashboardPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const store = useStore()
  const notify = useNotify()
  const confirm = useConfirm()
  const {
    shipments,
    shipmentQuotes,
    shipmentDocuments,
    shipmentTimelineEvents,
    rfqDispatches,
    rfqUnmatchedEmails,
    updateShipmentQuote,
    updateShipment,
    updateRfqDispatch,
    updateRfqUnmatchedEmail,
    addShipmentTimelineEvent,
  } = store

  const [checking, setChecking] = useState(false)
  const [lastCheck, setLastCheck] = useState<RfqProcessSummary | null>(null)
  const [openVersionsFor, setOpenVersionsFor] = useState<string | null>(null)
  const [followUp, setFollowUp] = useState<{ quote: ShipmentQuote; subject: string; body: string } | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)

  const shipment = shipments.find((s) => s.id === shipmentId)

  const quotes = useMemo(() => (shipment ? currentQuotes(shipmentQuotes, shipment.id) : []), [shipmentQuotes, shipment])
  const dispatches = useMemo(() => rfqDispatches.filter((d) => d.shipmentId === shipmentId), [rfqDispatches, shipmentId])
  const documents = useMemo(() => shipmentDocuments.filter((d) => d.shipmentId === shipmentId), [shipmentDocuments, shipmentId])
  const timeline = useMemo(
    () => shipmentTimelineEvents.filter((e) => e.shipmentId === shipmentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [shipmentTimelineEvents, shipmentId],
  )
  const comparisons = useMemo(() => compareByMode(quotes), [quotes])
  const inbox = useMemo(
    () => (shipment ? buildRfqInbox(shipment.id, shipmentQuotes, rfqDispatches, rfqUnmatchedEmails) : []),
    [shipment, shipmentQuotes, rfqDispatches, rfqUnmatchedEmails],
  )

  // צבע יציב לכל סוכנות, משותף לכל הגרפים — כדי שאותה סוכנות תיראה אותו דבר בכל תצוגה.
  const agencyColor = useMemo(() => {
    const map = new Map<string, string>()
    quotes.forEach((q, i) => map.set(q.id, AGENCY_COLORS[i % AGENCY_COLORS.length]))
    return map
  }, [quotes])

  if (!shipment) {
    return (
      <div className="space-y-4 pb-24">
        <BackLink to="/work/shipments" label="חזרה למשלוחים" />
        <Panel className="p-10 text-center text-sm text-stone-400">בקשת הצעת המחיר לא נמצאה</Panel>
      </div>
    )
  }

  const repliedCount = dispatches.filter((d) => ['replied', 'revised', 'selected'].includes(d.status)).length
  const incompleteCount = dispatches.filter((d) => d.status === 'incomplete').length
  const waitingCount = dispatches.filter((d) => ['sent', 'waiting'].includes(d.status)).length
  const primary = comparisons[0]

  async function handleCheckEmails() {
    setChecking(true)
    try {
      const summary = await processRfqEmails(store)
      setLastCheck(summary)
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

  async function handleSelectQuote(q: ShipmentQuote) {
    const ok = await confirm({
      title: 'לבחור את ההצעה הזו?',
      message: `${q.forwarderName} — ${money(q.extraction?.totalPrice ?? q.price, q.extraction?.currency ?? q.currency)}. שאר ההצעות יסומנו כנדחו.`,
      confirmLabel: 'בחר',
    })
    if (!ok) return

    await Promise.all(
      quotes.map((other) => updateShipmentQuote(other.id, { status: other.id === q.id ? 'selected' : 'rejected' })),
    )
    await Promise.all(
      dispatches.map((d) =>
        updateRfqDispatch(d.id, { status: d.forwarderId && d.forwarderId === q.forwarderId ? 'selected' : d.status === 'replied' ? 'rejected' : d.status }),
      ),
    )
    await updateShipment(shipment!.id, { selectedForwarderId: q.forwarderId, status: 'waiting_for_pickup' })
    await addShipmentTimelineEvent({
      shipmentId: shipment!.id,
      stage: 'quote_selected',
      date: todayISO(),
      notes: `${q.forwarderName} — ${money(q.extraction?.totalPrice ?? q.price, q.extraction?.currency ?? q.currency)}`,
    })
    notify(`נבחרה ההצעה של ${q.forwarderName}`, 'success')
  }

  function openFollowUp(q: ShipmentQuote) {
    const draft = buildFollowUpDraft(shipment!, q, missingFieldKeys(q))
    setFollowUp({ quote: q, ...draft })
  }

  async function handleSaveDraft() {
    if (!followUp) return
    const to = followUp.quote.sourceEmail?.fromAddress ?? dispatches.find((d) => d.forwarderId === followUp.quote.forwarderId)?.recipientEmail
    if (!to) {
      notify('אין כתובת מייל לסוכנות הזו', 'error')
      return
    }
    setSavingDraft(true)
    try {
      await saveFollowUpDraft(to, followUp.subject, followUp.body, followUp.quote.sourceEmail?.messageId)
      await addShipmentTimelineEvent({
        shipmentId: shipment!.id,
        stage: 'followup_requested',
        date: todayISO(),
        notes: `טיוטת בקשת השלמה נשמרה עבור ${followUp.quote.forwarderName}`,
      })
      notify('הטיוטה נשמרה ב-Gmail. היא לא נשלחה — אפשר לבדוק ולשלוח משם.', 'success')
      setFollowUp(null)
    } catch (err) {
      notify(err instanceof FollowUpError ? err.message : 'שמירת הטיוטה נכשלה', 'error')
    } finally {
      setSavingDraft(false)
    }
  }

  const scatterPoints: ScatterPoint[] = quotes
    .filter((q) => (q.extraction?.totalPrice ?? q.price) != null && (q.extraction?.transitTimeMax ?? q.transitTimeDays) != null)
    .map((q) => ({
      id: q.id,
      x: q.extraction?.transitTimeMax ?? q.transitTimeDays!,
      y: q.extraction?.totalPrice ?? q.price!,
      label: q.forwarderName,
      color: agencyColor.get(q.id) ?? ACCENT,
      meta: `${money(q.extraction?.totalPrice ?? q.price, q.extraction?.currency ?? q.currency)} · ${TRANSPORT_MODE_LABEL[quoteMode(q)]}`,
    }))

  // השוואת מחירים מוצגת רק בתוך אותו סוג הובלה — עמודה של הצעה ימית לצד אווירית היא השוואה מטעה.
  const barMode = primary?.mode
  const barData = (primary?.quotes ?? [])
    .filter((m) => m.totalPrice != null)
    .map((m) => ({ label: m.agencyName, value: m.totalPrice! }))

  const donutData = [
    { name: 'הצעות התקבלו', amount: repliedCount, color: '#5B7A3E' },
    { name: 'ממתינות', amount: waitingCount, color: '#E0A34E' },
    { name: 'חסר מידע', amount: incompleteCount, color: '#C2410C' },
    { name: 'לא נשלחו / נכשלו', amount: dispatches.filter((d) => ['not_sent', 'failed'].includes(d.status)).length, color: '#A8A29E' },
  ].filter((d) => d.amount > 0)

  // שורת "דורש טיפול" — נגזרת מהנתונים, לא רשימה קבועה.
  const needsClarification = quotes.filter((q) => missingFieldKeys(q).length > 0)
  const waitingAgencies = dispatches.filter((d) => ['sent', 'waiting'].includes(d.status))
  const hasSelection = quotes.some((q) => q.status === 'selected')
  const actions = [
    needsClarification.length > 0
      ? { label: 'דחוף', title: 'הצעות חסרות מידע', value: needsClarification.map((q) => q.forwarderName).join(', '), icon: 'doc' as const }
      : null,
    waitingAgencies.length > 0
      ? { label: 'מעקב', title: 'סוכנויות שטרם ענו', value: waitingAgencies.map((d) => d.forwarderName).join(', '), icon: 'phone' as const }
      : null,
    !hasSelection && primary?.canRecommend
      ? { label: 'להחלטה', title: 'בחירת הצעה זוכה', value: primary.recommended?.agencyName ?? '', icon: 'check' as const }
      : hasSelection
        ? { label: 'הושלם', title: 'הצעה נבחרה', value: quotes.find((q) => q.status === 'selected')?.forwarderName ?? '', icon: 'check' as const }
        : null,
  ].filter(Boolean) as { label: string; title: string; value: string; icon: 'doc' | 'phone' | 'check' }[]

  const modeGroups = comparisons

  return (
    <div className="space-y-4 pb-24">
      {/* ===== כותרת ===== */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackLink to={`/work/shipments/${shipment.id}`} label="חזרה למשלוח" />
          <div className="text-right">
            <div className="text-[11px] text-stone-400 dark:text-stone-500">עבודה</div>
            <h1 className="text-[26px] font-extrabold text-stone-900 dark:text-stone-100 leading-tight">יבוא ומשלוחים</h1>
          </div>
          <span className="w-11 h-11 rounded-2xl bg-[#FBF0E2] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5 text-amber-800/80 dark:text-amber-300" />
          </span>
        </div>
        <button
          onClick={handleCheckEmails}
          disabled={checking}
          className="px-5 py-2.5 rounded-xl bg-[#3B2A1C] text-white text-sm font-medium hover:bg-[#2A1E14] disabled:opacity-60 shadow-sm"
        >
          {checking ? 'בודק מיילים…' : '+ בדוק תשובות במייל'}
        </button>
      </div>

      {lastCheck && lastCheck.errors.length > 0 && (
        <Panel className="p-4 border-rose-200 dark:border-rose-900">
          <div className="text-sm text-rose-600 dark:text-rose-400">{lastCheck.errors.join(' · ')}</div>
        </Panel>
      )}

      {/* ===== שורת "דורש טיפול" ===== */}
      {actions.length > 0 && (
        <Panel className="px-5 py-3.5">
          <div className="flex items-stretch gap-5 flex-wrap">
            <div className="shrink-0 pe-5 border-e border-stone-100 dark:border-stone-800">
              <div className="text-[15px] font-bold text-stone-800 dark:text-stone-100">היום בעבודה</div>
              <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">{shipment.rfqReference ?? shipment.name}</div>
            </div>
            {actions.map((a, i) => (
              <div key={a.title} className={`flex items-center gap-3 min-w-0 flex-1 ${i < actions.length - 1 ? 'pe-5 border-e border-stone-100 dark:border-stone-800' : ''}`}>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${a.label === 'דחוף' ? 'text-rose-500' : a.label === 'הושלם' ? 'text-emerald-600' : 'text-amber-600'}`}>{a.label}</span>
                    <span className="text-[13px] font-semibold text-stone-700 dark:text-stone-200 truncate">{a.title}</span>
                  </div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate mt-0.5">{a.value}</div>
                </div>
                <span className="w-7 h-7 shrink-0 rounded-lg bg-stone-50 dark:bg-stone-800 flex items-center justify-center text-stone-400 text-xs">
                  {a.icon === 'doc' ? '📄' : a.icon === 'phone' ? '☎' : '✓'}
                </span>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* ===== גוף העמוד: רצועה ימנית צרה + אזור ראשי רחב ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,3.9fr)] gap-4 items-start">
        {/* --- רצועה ימנית --- */}
        <div className="space-y-4">
          {/* דואר נכנס / התראות */}
          <Panel className="p-4">
            <PanelHead
              title="דוא״ל נכנס / התראות"
              icon={<span className="text-stone-300 text-sm">✉</span>}
              action={
                inbox.length > 0 ? (
                  <span className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-[11px] font-bold flex items-center justify-center">
                    {inbox.length}
                  </span>
                ) : undefined
              }
            />
            {inbox.length === 0 ? (
              <div className="py-5 text-center text-xs text-stone-400 dark:text-stone-500">אין עדכונים לבקשה הזו</div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800 max-h-[168px] overflow-y-auto -mx-1">
                {inbox.map((e) => (
                  <li key={e.id} className="px-1 py-2 flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${e.tone === 'new' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-semibold text-stone-800 dark:text-stone-100 leading-tight truncate">{e.title}</div>
                      <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate">{e.agencyName}</div>
                      {e.amount && <div className="text-[11px] font-bold text-stone-700 dark:text-stone-200 mt-0.5">{e.amount}</div>}
                      {e.unmatchedId && (
                        <button
                          onClick={() => updateRfqUnmatchedEmail(e.unmatchedId!, { dismissed: true })}
                          className="text-[10px] text-amber-800 dark:text-amber-400 mt-0.5 hover:opacity-70"
                        >
                          סמן כטופל
                        </button>
                      )}
                    </div>
                    {e.at && <span className="text-[10px] text-stone-300 dark:text-stone-600 shrink-0">{new Date(e.at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* סטטוס כל הסוכנויות — טבלה */}
          <Panel className="p-4">
            <PanelHead title="כל הסוכנויות" icon={<ChecklistIcon className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />} />
            {dispatches.length === 0 ? (
              <div className="py-5 text-center text-xs text-stone-400 dark:text-stone-500">טרם נשלח לאף סוכנות</div>
            ) : (
              <table className="w-full text-[11px] table-fixed">
                <thead>
                  <tr className="text-stone-300 dark:text-stone-600">
                    <th className="text-right font-medium pb-1.5 w-[86px]">סוכנות</th>
                    <th className="font-medium pb-1.5 w-7">נשלח</th>
                    <th className="font-medium pb-1.5 w-7">נענה</th>
                    <th className="text-left font-medium pb-1.5 w-[56px]">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50 dark:divide-stone-800/60">
                  {dispatches.map((d) => {
                    const replied = ['replied', 'incomplete', 'revised', 'selected'].includes(d.status)
                    const sent = d.status !== 'not_sent' && d.status !== 'failed'
                    return (
                      <tr key={d.id}>
                        <td className="py-1.5 pe-1 text-stone-700 dark:text-stone-200 truncate" title={`${d.forwarderName} · ${d.recipientEmail}`}>
                          {d.forwarderName}
                        </td>
                        <td className="py-1.5 text-center">{sent ? <span className="text-emerald-500">✓</span> : <span className="text-stone-300">–</span>}</td>
                        <td className="py-1.5 text-center">{replied ? <span className="text-emerald-500">✓</span> : <span className="text-stone-300">–</span>}</td>
                        <td className="py-1.5 text-left">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap ${DISPATCH_TONE[d.status]}`}
                            title={DISPATCH_STATUS_LABEL[d.status]}
                          >
                            {DISPATCH_SHORT[d.status]}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </Panel>

          {/* ציר זמן */}
          <Panel className="p-4">
            <PanelHead title="פעילות בתיק" icon={<CalendarIcon className="w-3.5 h-3.5 text-stone-300 dark:text-stone-600" />} />
            {timeline.length === 0 ? (
              <div className="py-5 text-center text-xs text-stone-400 dark:text-stone-500">אין עדיין אירועים</div>
            ) : (
              <ol className="space-y-2 max-h-[158px] overflow-y-auto pe-1">
                {timeline.map((e) => {
                  const pending = e.stage === 'followup_requested'
                  return (
                    <li key={e.id} className="flex items-start gap-2">
                      <span
                        className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px] mt-0.5 ${
                          pending ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                        }`}
                      >
                        {pending ? '⏳' : '✓'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-medium text-stone-700 dark:text-stone-200 leading-tight">{STAGE_LABEL[e.stage]}</div>
                        {e.notes && <div className="text-[10px] text-stone-400 dark:text-stone-500 break-words leading-tight mt-0.5">{e.notes}</div>}
                        <div className="text-[9px] text-stone-300 dark:text-stone-600 mt-0.5">
                          {new Date(e.createdAt).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Panel>
        </div>

        {/* --- אזור ראשי --- */}
        <div className="space-y-4">
          {/* ההצעה הטובה + סקירת RFQ */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.11fr)_minmax(0,1fr)] gap-4">
            {/* ההצעה הטובה כרגע */}
            <div className="rounded-2xl relative overflow-hidden shadow-sm" style={{ background: 'linear-gradient(145deg, #4A3524 0%, #2A1E14 100%)' }}>
              <div className="absolute top-0 start-5 w-9 h-11 bg-[#C9A227] rounded-b-md flex items-start justify-center pt-1.5 text-white text-xs">★</div>
              <div className="p-4 text-white">
                <div className="text-[11px] text-white/55 mb-2.5">ההצעה הטובה כרגע</div>
                {primary?.canRecommend && primary.recommended ? (
                  <>
                    <div className="flex items-baseline justify-between gap-3 mb-3">
                      <div className="text-lg font-bold">{primary.recommended.agencyName}</div>
                      <div className="text-[11px] text-white/50">{TRANSPORT_MODE_LABEL[quoteMode(primary.recommended.quote)]}</div>
                    </div>
                    <div className="flex items-end justify-between gap-4 mb-3.5">
                      <div>
                        <div className="text-[30px] font-extrabold leading-none">{money(primary.recommended.totalPrice, primary.recommended.currency)}</div>
                        <div className="text-[10px] text-white/45 mt-1.5">כולל כל העלויות שצוינו</div>
                      </div>
                      <div className="flex gap-5 text-center">
                        <div>
                          <div className="text-[13px] font-semibold">
                            {primary.recommended.transitMin != null && primary.recommended.transitMax != null
                              ? `${primary.recommended.transitMin}–${primary.recommended.transitMax}`
                              : (primary.recommended.transitMax ?? '—')}{' '}
                            ימים
                          </div>
                          <div className="text-[10px] text-white/45 mt-0.5">זמן מעבר</div>
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold">{INCLUSION_LABEL[primary.recommended.quote.extraction?.pickupIncluded ?? 'unclear']}</div>
                          <div className="text-[10px] text-white/45 mt-0.5">איסוף כלול</div>
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold">{INCLUSION_LABEL[primary.recommended.quote.extraction?.dgIncluded ?? 'unclear']}</div>
                          <div className="text-[10px] text-white/45 mt-0.5">DG</div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl bg-white/[0.07] px-3.5 py-2 mb-2.5">
                      <p className="text-[11px] text-white/70 leading-relaxed">
                        <span className="font-semibold text-white/90">המלצת המערכת: </span>
                        {primary.recommendationReason}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSelectQuote(primary.recommended!.quote)}
                      className="w-full py-2 rounded-xl bg-white/[0.12] hover:bg-white/20 text-[13px] font-medium transition-colors"
                    >
                      בחר את ההצעה הזו ←
                    </button>
                  </>
                ) : (
                  <div className="py-8 text-center text-[13px] text-white/55">{primary?.recommendationReason ?? 'עדיין לא התקבלו הצעות'}</div>
                )}
              </div>
            </div>

            {/* סקירת RFQ */}
            <Panel className="overflow-hidden">
              <div className="flex h-full">
                <div
                  className="w-[110px] shrink-0 flex items-center justify-center"
                  style={{ background: 'linear-gradient(160deg, #FBF0E2 0%, #F2E3CE 100%)' }}
                >
                  <span className="text-4xl opacity-60" aria-hidden="true">
                    {shipment.shippingMode === 'sea' ? '🚢' : '✈️'}
                  </span>
                </div>
                <div className="flex-1 min-w-0 p-3.5">
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">סקירת RFQ</div>
                  <div className="text-[21px] font-extrabold text-stone-900 dark:text-stone-100 leading-none mb-1.5">{shipment.rfqReference ?? 'ללא מזהה'}</div>
                  <div className="flex items-center gap-2 text-[13px] text-stone-600 dark:text-stone-300 mb-2.5">
                    <span>{shipment.originCountry || 'מוצא'}</span>
                    <span className="text-stone-300">→</span>
                    <span>{shipment.destination || 'Israel'}</span>
                    {shipment.shippingMode && (
                      <span className="text-[11px] text-stone-400">{TRANSPORT_MODE_LABEL[shipment.shippingMode as TransportMode] ?? shipment.shippingMode}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    <Chip>נשלח ל-{dispatches.length} סוכנויות</Chip>
                    <Chip tone="good">{repliedCount} הצעות התקבלו</Chip>
                    <Chip tone="warn">{waitingCount} ממתינות</Chip>
                  </div>
                  {documents.length > 0 && (
                    <>
                      <div className="text-[10px] text-stone-400 dark:text-stone-500 mb-1">מסמכים מצורפים:</div>
                      <div className="flex flex-wrap gap-1">
                        {documents.map((d) => (
                          <span
                            key={d.id}
                            className="px-2 py-0.5 rounded-md border border-stone-200 dark:border-stone-700 text-[10px] text-stone-500 dark:text-stone-400 truncate max-w-[110px]"
                            title={d.name}
                          >
                            {d.name.replace(/\.[^.]+$/, '')}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          </div>

          {/* השוואת הצעות מחיר — שורה אחת, מקובצת לפי סוג הובלה */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[17px] font-bold text-stone-800 dark:text-stone-100">השוואת הצעות מחיר</h2>
              <span className="text-[11px] text-stone-400 dark:text-stone-500">
                {quotes.length} הצעות · {modeGroups.map((g) => TRANSPORT_MODE_LABEL[g.mode]).join(' / ')}
              </span>
            </div>

            {quotes.length === 0 ? (
              <Panel className="p-10 text-center">
                <div className="text-sm text-stone-400 dark:text-stone-500 mb-1">עדיין לא התקבלו הצעות מחיר</div>
                <div className="text-xs text-stone-400 dark:text-stone-500">
                  "בדוק תשובות במייל" יקרא מיילים חדשים, יזהה תשובות לבקשה הזו ויחלץ מהן את ההצעות.
                </div>
              </Panel>
            ) : (
              <div className="flex items-stretch gap-3 flex-wrap">
                {modeGroups.map((cmp, gi) => (
                  <div key={cmp.mode} className="flex items-stretch gap-3 min-w-0" style={{ flexGrow: cmp.quotes.length, flexBasis: 0 }}>
                    {gi > 0 && <div className="w-px bg-stone-200 dark:bg-stone-800 self-stretch shrink-0" />}
                    {cmp.quotes.map((m) => {
                      const versions = quoteVersions(shipmentQuotes, shipment.id, m.quote.forwarderId ?? m.quote.forwarderName)
                      const isSelected = m.quote.status === 'selected'
                      const isRecommended = m.quote.id === cmp.recommended?.quote.id && cmp.canRecommend
                      return (
                        <Panel
                          key={m.quote.id}
                          className={`p-3 flex-1 min-w-0 flex flex-col transition-all hover:shadow-md ${
                            isSelected ? 'ring-2 ring-amber-800' : isRecommended ? 'ring-1 ring-emerald-300 dark:ring-emerald-800' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
                            <span className="text-[13px] font-bold text-stone-800 dark:text-stone-100 truncate" title={m.agencyName}>
                              {m.agencyName}
                            </span>
                            <span className="shrink-0 px-1.5 py-px rounded-md bg-stone-100 dark:bg-stone-800 text-[10px] text-stone-500 dark:text-stone-400">
                              {TRANSPORT_MODE_LABEL[quoteMode(m.quote)]}
                            </span>
                          </div>

                          <div className="flex items-end justify-between gap-1.5 mb-2">
                            <div className="min-w-0">
                              <div className="text-[20px] font-extrabold text-stone-900 dark:text-stone-100 leading-none whitespace-nowrap">
                                {money(m.totalPrice, m.currency)}
                              </div>
                              <div className="text-[10px] text-stone-400 dark:text-stone-500 truncate mt-1 h-[13px]">
                                {m.diffFromCheapestPct != null && m.diffFromCheapestPct > 0 ? `+${m.diffFromCheapestPct.toFixed(0)}% ` : ''}
                                {m.pricePerKg != null ? `${m.pricePerKg.toFixed(2)}/ק״ג` : ''}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {isRecommended && <Chip tone="good">מומלץ</Chip>}
                              {m.missingFields.length > 0 && <Chip tone="warn">הבהרה</Chip>}
                              {(m.quote.version ?? 1) > 1 && <Chip>v{m.quote.version}</Chip>}
                            </div>
                          </div>

                          <dl className="text-[11px] space-y-0.5 border-t border-stone-100 dark:border-stone-800 pt-1.5 mb-1.5">
                            <div className="flex justify-between gap-2">
                              <dt className="text-stone-400 dark:text-stone-500">זמן מעבר</dt>
                              <dd className="text-stone-700 dark:text-stone-200 font-medium">
                                {m.transitMin != null && m.transitMax != null ? `${m.transitMin}–${m.transitMax} ימים` : m.transitMax != null ? `${m.transitMax} ימים` : '—'}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-stone-400 dark:text-stone-500">איסוף כלול</dt>
                              <dd className={m.quote.extraction?.pickupIncluded === 'included' ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-stone-700 dark:text-stone-200'}>
                                {INCLUSION_LABEL[m.quote.extraction?.pickupIncluded ?? 'unclear']}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-stone-400 dark:text-stone-500">DG</dt>
                              <dd className={m.quote.extraction?.dgIncluded === 'unclear' ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-stone-700 dark:text-stone-200'}>
                                {INCLUSION_LABEL[m.quote.extraction?.dgIncluded ?? 'unclear']}
                              </dd>
                            </div>
                            <div className="flex justify-between gap-2">
                              <dt className="text-stone-400 dark:text-stone-500">תוקף הצעה</dt>
                              <dd className="text-stone-700 dark:text-stone-200">{m.quote.extraction?.validityDate ?? '—'}</dd>
                            </div>
                          </dl>

                          {m.missingFields.length > 0 && (
                            <button
                              onClick={() => openFollowUp(m.quote)}
                              className="text-[10px] text-amber-700 dark:text-amber-400 text-right mb-1.5 hover:opacity-70 leading-tight overflow-hidden"
                              style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                            >
                              ⚠ חסר: {m.missingFields.join(', ')} — בקש השלמה
                            </button>
                          )}

                          <div className="flex gap-1.5 mt-auto pt-1">
                            <button
                              onClick={() => handleSelectQuote(m.quote)}
                              className={`flex-1 py-1.5 rounded-xl text-[12px] font-medium transition-colors ${
                                isSelected
                                  ? 'bg-[#3B2A1C] text-white'
                                  : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'
                              }`}
                            >
                              {isSelected ? 'נבחר' : 'בחר'}
                            </button>
                            {versions.length > 1 && (
                              <button
                                onClick={() => setOpenVersionsFor(openVersionsFor === m.quote.id ? null : m.quote.id)}
                                className="px-2 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-[12px] text-stone-400"
                                title="היסטוריית גרסאות"
                              >
                                ⋯
                              </button>
                            )}
                          </div>

                          {openVersionsFor === m.quote.id && (
                            <ul className="mt-2 border-t border-stone-100 dark:border-stone-800 pt-2 space-y-1">
                              {versions.map((v) => (
                                <li key={v.id} className="flex justify-between text-[10px]">
                                  <span className="text-stone-400">v{v.version ?? 1} · {v.dateReceived ?? '—'}</span>
                                  <span className="text-stone-700 dark:text-stone-200">{money(v.extraction?.totalPrice ?? v.price, v.extraction?.currency ?? v.currency)}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Panel>
                      )
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* גרפים */}
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1.05fr)_minmax(0,1fr)] gap-4">
            <Panel className="p-4">
              <PanelHead title={`מחיר מול זמן מעבר${barMode ? ` (${TRANSPORT_MODE_LABEL[barMode]})` : ''}`} />
              <ScatterChart
                points={scatterPoints}
                height={190}
                xLabel="זמן מעבר (ימים)"
                formatX={(v) => v.toFixed(0)}
                formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0))}
              />
            </Panel>
            <Panel className="p-4">
              <PanelHead title={barMode ? `השוואת מחירים · ${TRANSPORT_MODE_LABEL[barMode]}` : 'השוואת מחירים'} />
              {barData.length > 0 ? (
                <div className="pt-2">
                  <BarChart data={barData} height={162} color={ACCENT} valueSuffix="" />
                </div>
              ) : (
                <div className="h-[190px] flex items-center justify-center text-xs text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  אין עדיין הצעות עם מחיר
                </div>
              )}
            </Panel>
            <Panel className="p-4">
              <PanelHead title="פילוח הצעות מחיר" />
              {donutData.length > 0 ? (
                <div className="flex items-center justify-center h-[190px]">
                  <DonutChart data={donutData} size={140} strokeWidth={18} valueSuffix="" centerLabel="סוכנויות" />
                </div>
              ) : (
                <div className="h-[190px] flex items-center justify-center text-xs text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  אין עדיין נתונים
                </div>
              )}
            </Panel>
          </div>
        </div>
      </div>

      {followUp && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setFollowUp(null)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">בקשת השלמה — {followUp.quote.forwarderName}</h3>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
              הטיוטה תישמר בתיקיית הטיוטות ב-Gmail באותו שרשור. <strong>היא לא תישלח</strong> — הבדיקה והשליחה נשארות אצלך.
            </p>

            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">נושא</label>
            <input
              value={followUp.subject}
              onChange={(e) => setFollowUp({ ...followUp, subject: e.target.value })}
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm mb-3"
            />

            <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">תוכן</label>
            <textarea
              value={followUp.body}
              onChange={(e) => setFollowUp({ ...followUp, body: e.target.value })}
              dir="ltr"
              className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-3 text-sm mb-4 h-56 resize-none font-mono text-[12px]"
            />

            <div className="flex gap-3">
              <button onClick={() => setFollowUp(null)} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300">
                ביטול
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={savingDraft}
                className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900 disabled:opacity-60"
              >
                {savingDraft ? 'שומר…' : 'שמור טיוטה ב-Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
