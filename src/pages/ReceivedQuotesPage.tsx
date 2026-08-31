import { ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { useNotify } from '../data/NotificationContext'
import { ChecklistIcon } from '../components/hub/hubIcons'
import { currentQuotes, missingRequiredFields, quoteMode } from '../rfq/quoteComparison'
import { processRfqEmails } from '../rfq/processRfqEmails'
import { TRANSPORT_MODE_LABEL, MATCH_METHOD_LABEL } from '../data/rfqTypes'

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

// תיבת הנכנס של ההצעות: כל ההצעות שהתקבלו מכל ה-RFQ במקום אחד, ולצידן המיילים
// שלא ניתן היה לשייך בוודאות ומחכים להכרעה ידנית.
export default function ReceivedQuotesPage() {
  const store = useStore()
  const { shipments, shipmentQuotes, rfqUnmatchedEmails, updateRfqUnmatchedEmail } = store
  const notify = useNotify()
  const [checking, setChecking] = useState(false)
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'revised'>('all')

  const rows = useMemo(() => {
    const out = shipments.flatMap((s) =>
      currentQuotes(shipmentQuotes, s.id).map((q) => ({ shipment: s, quote: q, missing: missingRequiredFields(q) })),
    )
    return out
      .filter((r) => (filter === 'incomplete' ? r.missing.length > 0 : filter === 'revised' ? (r.quote.version ?? 1) > 1 : true))
      .sort((a, b) => (b.quote.sourceEmail?.receivedAt ?? b.quote.createdAt).localeCompare(a.quote.sourceEmail?.receivedAt ?? a.quote.createdAt))
  }, [shipments, shipmentQuotes, filter])

  const pendingMatch = rfqUnmatchedEmails.filter((u) => !u.dismissed)

  async function handleCheck() {
    setChecking(true)
    try {
      const summary = await processRfqEmails(store)
      notify(
        [
          `נבדקו ${summary.checked} מיילים`,
          summary.quotesCreated > 0 ? `${summary.quotesCreated} הצעות נקלטו` : null,
          summary.needsMatch > 0 ? `${summary.needsMatch} דורשים התאמה` : null,
        ]
          .filter(Boolean)
          .join(' · ') || 'אין מיילים חדשים',
        summary.errors.length ? 'error' : 'success',
      )
    } catch {
      notify('בדיקת המיילים נכשלה', 'error')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackLink to="/work/shipments" label="חזרה ליבוא ומשלוחים" />
          <span className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
            <ChecklistIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </span>
          <div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500">יבוא ומשלוחים</div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">הצעות שהתקבלו</h1>
          </div>
        </div>
        <button
          onClick={handleCheck}
          disabled={checking}
          className="px-4 py-2.5 rounded-xl bg-[#3B2A1C] text-white text-sm font-medium hover:bg-[#2A1E14] disabled:opacity-60"
        >
          {checking ? 'בודק מיילים…' : 'בדוק תשובות במייל'}
        </button>
      </div>

      {pendingMatch.length > 0 && (
        <Panel className="p-4 border-amber-200 dark:border-amber-900">
          <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-1">נדרשת התאמה ({pendingMatch.length})</h2>
          <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">
            מיילים שנקלטו אך לא ניתן היה לשייך אותם לבקשה בוודאות. המערכת לא מנחשת — ההכרעה שלך.
          </p>
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {pendingMatch.map((u) => (
              <li key={u.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[12px] font-semibold text-stone-800 dark:text-stone-100 truncate">{u.sourceEmail.subject}</div>
                  <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{u.sourceEmail.from}</div>
                  <div className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 line-clamp-2">{u.preview}</div>
                  {u.suggestedReason && <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{u.suggestedReason}</div>}
                </div>
                <button
                  onClick={() => updateRfqUnmatchedEmail(u.id, { dismissed: true })}
                  className="shrink-0 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  סמן כטופל
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel className="p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100">כל ההצעות ({rows.length})</h2>
          <div className="flex gap-1.5">
            {([
              ['all', 'הכל'],
              ['incomplete', 'חסר מידע'],
              ['revised', 'מעודכנות'],
            ] as const).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors ${
                  filter === k ? 'bg-[#3B2A1C] text-white' : 'border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">עדיין לא התקבלו הצעות מחיר</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[680px]">
              <thead>
                <tr className="text-stone-400 dark:text-stone-500 bg-stone-50/70 dark:bg-stone-800/40">
                  <th className="text-right font-medium py-2 px-2 rounded-s-lg">סוכנות</th>
                  <th className="text-right font-medium py-2 px-2">משלוח / RFQ</th>
                  <th className="text-right font-medium py-2 px-2">סוג</th>
                  <th className="text-right font-medium py-2 px-2">מחיר</th>
                  <th className="text-right font-medium py-2 px-2">זמן מעבר</th>
                  <th className="text-right font-medium py-2 px-2">מצב</th>
                  <th className="text-right font-medium py-2 px-2 rounded-e-lg">זוהה לפי</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {rows.map(({ shipment, quote, missing }) => (
                  <tr key={quote.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-2">
                      <span className="font-semibold text-stone-800 dark:text-stone-100">{quote.forwarderName}</span>
                      {(quote.version ?? 1) > 1 && <span className="ms-1.5 text-[10px] text-violet-600 dark:text-violet-400">v{quote.version}</span>}
                    </td>
                    <td className="py-2.5 px-2">
                      <Link to={`/work/shipments/${shipment.id}/rfq`} className="text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-400">
                        {shipment.rfqReference ?? shipment.name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{TRANSPORT_MODE_LABEL[quoteMode(quote)]}</td>
                    <td className="py-2.5 px-2 font-semibold text-stone-800 dark:text-stone-100 whitespace-nowrap">
                      {(quote.extraction?.totalPrice ?? quote.price) != null
                        ? `${quote.extraction?.currency ?? quote.currency ?? ''} ${(quote.extraction?.totalPrice ?? quote.price)!.toLocaleString('he-IL')}`
                        : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                      {quote.extraction?.transitTimeMax != null ? `${quote.extraction.transitTimeMax} ימים` : '—'}
                    </td>
                    <td className="py-2.5 px-2">
                      {missing.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                          חסרים {missing.length} פרטים
                        </span>
                      ) : quote.status === 'selected' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">נבחרה</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">מלאה</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-[10px] text-stone-400 dark:text-stone-500">
                      {quote.matchMethod ? MATCH_METHOD_LABEL[quote.matchMethod] : 'הוזן ידנית'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
