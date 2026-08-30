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

  return (
    <div className="space-y-5 pb-24">
      {/* כותרת */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackLink to={`/work/shipments/${shipment.id}`} label="חזרה למשלוח" />
          <span className="w-11 h-11 rounded-2xl bg-[#FBF0E2] dark:bg-amber-950/40 flex items-center justify-center shrink-0">
            <TruckIcon className="w-5 h-5 text-amber-800/80 dark:text-amber-300" />
          </span>
          <div>
            <div className="text-xs text-stone-400 dark:text-stone-500">עבודה · יבוא ומשלוחים</div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">השוואת הצעות מחיר</h1>
          </div>
        </div>
        <button
          onClick={handleCheckEmails}
          disabled={checking}
          className="px-4 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900 disabled:opacity-60"
        >
          {checking ? 'בודק מיילים...' : 'בדוק תשובות במייל'}
        </button>
      </div>

      {lastCheck && lastCheck.errors.length > 0 && (
        <Panel className="p-4 border-rose-200 dark:border-rose-900">
          <div className="text-sm text-rose-600 dark:text-rose-400">{lastCheck.errors.join(' · ')}</div>
        </Panel>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.1fr] gap-4 items-start">
        {/* ===== עמודה ימנית ===== */}
        <div className="space-y-4">
          {/* דואר נכנס / התראות */}
          <Panel className="p-5">
            <PanelHead
              title="דואר נכנס / התראות"
              icon={<span className="w-4 h-4 text-stone-300">✉</span>}
              action={
                inbox.length > 0 ? (
                  <span className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 text-xs font-bold flex items-center justify-center">
                    {inbox.length}
                  </span>
                ) : undefined
              }
            />
            {inbox.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">אין עדכונים לבקשה הזו</div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800 max-h-72 overflow-y-auto">
                {inbox.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-start gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${e.tone === 'new' ? 'bg-blue-500' : 'bg-amber-500'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">{e.title}</div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{e.agencyName}</div>
                      {e.unmatchedId && (
                        <button
                          onClick={() => updateRfqUnmatchedEmail(e.unmatchedId!, { dismissed: true })}
                          className="text-[11px] text-amber-800 dark:text-amber-400 mt-1 hover:opacity-70"
                        >
                          סמן כטופל
                        </button>
                      )}
                    </div>
                    {e.amount && <span className="text-xs font-bold text-stone-700 dark:text-stone-200 shrink-0">{e.amount}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* סטטוס כל הסוכנויות */}
          <Panel className="p-5">
            <PanelHead title="כל הסוכנויות" icon={<ChecklistIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />} />
            {dispatches.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">הבקשה עדיין לא נשלחה לאף סוכנות</div>
            ) : (
              <ul className="divide-y divide-stone-100 dark:divide-stone-800">
                {dispatches.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="text-xs text-stone-700 dark:text-stone-200 truncate" title={d.recipientEmail}>
                      {d.forwarderName}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${DISPATCH_TONE[d.status]}`}>
                      {DISPATCH_STATUS_LABEL[d.status]}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* ציר זמן */}
          <Panel className="p-5">
            <PanelHead title="ציר זמן פעילות" icon={<CalendarIcon className="w-4 h-4 text-stone-300 dark:text-stone-600" />} />
            {timeline.length === 0 ? (
              <div className="py-6 text-center text-sm text-stone-400 dark:text-stone-500">אין עדיין אירועים</div>
            ) : (
              <ol className="space-y-3 max-h-80 overflow-y-auto">
                {timeline.map((e) => (
                  <li key={e.id} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-800 shrink-0 mt-1.5" />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-stone-800 dark:text-stone-100">{STAGE_LABEL[e.stage]}</div>
                      {e.notes && <div className="text-[11px] text-stone-400 dark:text-stone-500 break-words">{e.notes}</div>}
                      <div className="text-[10px] text-stone-300 dark:text-stone-600 mt-0.5">{new Date(e.createdAt).toLocaleString('he-IL')}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* ===== עמודה שמאלית (התוכן הראשי) ===== */}
        <div className="space-y-4">
          {/* סקירת RFQ + ההצעה הטובה */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Panel className="p-5">
              <div className="text-xs text-stone-400 dark:text-stone-500 mb-1">סקירת RFQ</div>
              <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">{shipment.rfqReference ?? 'ללא מזהה'}</div>
              <div className="text-sm text-stone-600 dark:text-stone-300 mb-3">{shipment.name ?? 'ללא שם'}</div>
              <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400 mb-4">
                <span>{shipment.originCountry || 'מוצא לא ידוע'}</span>
                <span className="text-stone-300">←</span>
                <span>{shipment.destination || 'ישראל'}</span>
                {shipment.shippingMode && <Chip>{TRANSPORT_MODE_LABEL[shipment.shippingMode as TransportMode] ?? shipment.shippingMode}</Chip>}
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <Chip>נשלח ל-{dispatches.length} סוכנויות</Chip>
                <Chip tone="good">{repliedCount} הצעות התקבלו</Chip>
                <Chip tone="warn">{waitingCount} ממתינות</Chip>
              </div>
              {documents.length > 0 && (
                <>
                  <div className="text-xs text-stone-400 dark:text-stone-500 mb-1.5">מסמכים מצורפים</div>
                  <div className="flex flex-wrap gap-1.5">
                    {documents.map((d) => (
                      <span key={d.id} className="px-2 py-1 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400">
                        {d.name}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </Panel>

            {/* ההצעה הטובה כרגע */}
            <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(150deg, #4A3524, #241A12)' }}>
              <div className="text-xs text-white/60 mb-3">ההצעה הטובה כרגע</div>
              {primary?.canRecommend && primary.recommended ? (
                <>
                  <div className="text-lg font-bold mb-1">{primary.recommended.agencyName}</div>
                  <div className="text-3xl font-extrabold mb-4">{money(primary.recommended.totalPrice, primary.recommended.currency)}</div>
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <div className="text-sm font-semibold">
                        {primary.recommended.transitMin != null && primary.recommended.transitMax != null
                          ? `${primary.recommended.transitMin}–${primary.recommended.transitMax}`
                          : (primary.recommended.transitMax ?? '—')}
                      </div>
                      <div className="text-[10px] text-white/50 mt-0.5">ימי מעבר</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{INCLUSION_LABEL[primary.recommended.quote.extraction?.pickupIncluded ?? 'unclear']}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">איסוף כלול</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{INCLUSION_LABEL[primary.recommended.quote.extraction?.dgIncluded ?? 'unclear']}</div>
                      <div className="text-[10px] text-white/50 mt-0.5">DG</div>
                    </div>
                  </div>
                  <p className="text-xs text-white/70 leading-relaxed mb-4">{primary.recommendationReason}</p>
                  <button
                    onClick={() => handleSelectQuote(primary.recommended!.quote)}
                    className="w-full py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-sm font-medium transition-colors"
                  >
                    בחר את ההצעה הזו
                  </button>
                </>
              ) : (
                <div className="py-8 text-center text-sm text-white/60">{primary?.recommendationReason ?? 'עדיין לא התקבלו הצעות'}</div>
              )}
            </div>
          </div>

          {/* השוואת הצעות מחיר — קיבוץ לפי סוג הובלה */}
          {comparisons.map((cmp) => (
            <div key={cmp.mode}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100">
                  השוואת הצעות · {TRANSPORT_MODE_LABEL[cmp.mode]}
                </h2>
                <span className="text-xs text-stone-400 dark:text-stone-500">{cmp.quotes.length} הצעות</span>
              </div>
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                {cmp.quotes.map((m) => {
                  const versions = quoteVersions(shipmentQuotes, shipment.id, m.quote.forwarderId ?? m.quote.forwarderName)
                  const isSelected = m.quote.status === 'selected'
                  return (
                    <Panel key={m.quote.id} className={`p-4 relative ${isSelected ? 'ring-2 ring-amber-800' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-stone-800 dark:text-stone-100 truncate">{m.agencyName}</div>
                          <div className="text-[11px] text-stone-400 dark:text-stone-500">{TRANSPORT_MODE_LABEL[quoteMode(m.quote)]}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {m.quote.id === cmp.recommended?.quote.id && cmp.canRecommend && <Chip tone="good">מומלץ</Chip>}
                          {m.missingFields.length > 0 && <Chip tone="warn">חסר מידע</Chip>}
                          {(m.quote.version ?? 1) > 1 && <Chip>v{m.quote.version}</Chip>}
                        </div>
                      </div>

                      <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mb-1">{money(m.totalPrice, m.currency)}</div>
                      {m.diffFromCheapestPct != null && m.diffFromCheapestPct > 0 && (
                        <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">+{m.diffFromCheapestPct.toFixed(0)}% מהזולה</div>
                      )}
                      {m.pricePerKg != null && (
                        <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-2">{m.pricePerKg.toFixed(2)} {m.currency}/ק"ג</div>
                      )}

                      <dl className="text-[11px] space-y-1 border-t border-stone-100 dark:border-stone-800 pt-2 mb-2">
                        <div className="flex justify-between">
                          <dt className="text-stone-400">זמן מעבר</dt>
                          <dd className="text-stone-700 dark:text-stone-200">
                            {m.transitMin != null && m.transitMax != null ? `${m.transitMin}–${m.transitMax} ימים` : m.transitMax != null ? `${m.transitMax} ימים` : '—'}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-stone-400">איסוף</dt>
                          <dd className="text-stone-700 dark:text-stone-200">{INCLUSION_LABEL[m.quote.extraction?.pickupIncluded ?? 'unclear']}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-stone-400">DG</dt>
                          <dd className="text-stone-700 dark:text-stone-200">{INCLUSION_LABEL[m.quote.extraction?.dgIncluded ?? 'unclear']}</dd>
                        </div>
                        {m.quote.extraction?.validityDate && (
                          <div className="flex justify-between">
                            <dt className="text-stone-400">תוקף</dt>
                            <dd className="text-stone-700 dark:text-stone-200">{m.quote.extraction.validityDate}</dd>
                          </div>
                        )}
                      </dl>

                      {m.missingFields.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 mb-1.5">נדרשת השלמה: {m.missingFields.join(', ')}</div>
                          <button
                            onClick={() => openFollowUp(m.quote)}
                            className="text-[11px] font-medium text-amber-800 dark:text-amber-400 hover:opacity-70"
                          >
                            בקש השלמה →
                          </button>
                        </div>
                      )}

                      {m.quote.sourceEmail && (
                        <div className="text-[10px] text-stone-300 dark:text-stone-600 mb-2 truncate" title={m.quote.sourceEmail.subject}>
                          מתוך מייל: {m.quote.sourceEmail.subject}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectQuote(m.quote)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium ${isSelected ? 'bg-amber-800 text-white' : 'border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800'}`}
                        >
                          {isSelected ? 'נבחרה' : 'בחר'}
                        </button>
                        {versions.length > 1 && (
                          <button
                            onClick={() => setOpenVersionsFor(openVersionsFor === m.quote.id ? null : m.quote.id)}
                            className="px-2.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-500"
                            title="היסטוריית גרסאות"
                          >
                            ⋯
                          </button>
                        )}
                      </div>

                      {openVersionsFor === m.quote.id && (
                        <ul className="mt-2 border-t border-stone-100 dark:border-stone-800 pt-2 space-y-1">
                          {versions.map((v) => (
                            <li key={v.id} className="flex justify-between text-[11px]">
                              <span className="text-stone-500">v{v.version ?? 1} · {v.dateReceived ?? '—'}</span>
                              <span className="text-stone-700 dark:text-stone-200">{money(v.extraction?.totalPrice ?? v.price, v.extraction?.currency ?? v.currency)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Panel>
                  )
                })}
              </div>
            </div>
          ))}

          {quotes.length === 0 && (
            <Panel className="p-10 text-center">
              <div className="text-sm text-stone-400 dark:text-stone-500 mb-2">עדיין לא התקבלו הצעות מחיר</div>
              <div className="text-xs text-stone-400 dark:text-stone-500">
                לחיצה על "בדוק תשובות במייל" תקרא מיילים חדשים, תזהה תשובות לבקשה הזו ותחלץ מהן את ההצעות.
              </div>
            </Panel>
          )}

          {/* גרפים */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Panel className="p-5">
              <PanelHead title="מחיר מול זמן מעבר" />
              <ScatterChart
                points={scatterPoints}
                xLabel="ימי מעבר"
                formatX={(v) => v.toFixed(0)}
                formatY={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0))}
              />
            </Panel>
            <Panel className="p-5">
              <PanelHead title={barMode ? `השוואת מחירים · ${TRANSPORT_MODE_LABEL[barMode]}` : 'השוואת מחירים'} />
              {barData.length > 0 ? (
                <BarChart data={barData} height={160} color={ACCENT} valueSuffix="" />
              ) : (
                <div className="h-[160px] flex items-center justify-center text-xs text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
                  אין עדיין הצעות עם מחיר
                </div>
              )}
            </Panel>
            <Panel className="p-5">
              <PanelHead title="פילוח הצעות" />
              {donutData.length > 0 ? (
                <DonutChart data={donutData} size={120} strokeWidth={16} />
              ) : (
                <div className="h-[120px] flex items-center justify-center text-xs text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
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
                {savingDraft ? 'שומר...' : 'שמור טיוטה ב-Gmail'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
