import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { TruckIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover from '../components/hub/QuickAddPopover'
import { useNotify } from '../data/NotificationContext'
import { ShipmentStatus } from '../data/shipmentTypes'
import { checkEmailAccount, EmailCheckError } from '../email/checkEmailAccount'

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  preparing: 'בהכנה',
  waiting_for_quotes: 'ממתין להצעות',
  quotes_received: 'התקבלו הצעות',
  waiting_for_pickup: 'ממתין לאיסוף',
  picked_up: 'נאסף',
  in_transit: 'בדרך',
  customs: 'במכס',
  delivered: 'התקבל',
  missing_documents: 'חסרים מסמכים',
  issue: 'בעיה',
}
const STATUS_TONE: Record<ShipmentStatus, PillTone> = {
  preparing: 'neutral',
  waiting_for_quotes: 'warm',
  quotes_received: 'warm',
  waiting_for_pickup: 'warm',
  picked_up: 'calm',
  in_transit: 'calm',
  customs: 'warm',
  delivered: 'calm',
  missing_documents: 'alert',
  issue: 'alert',
}
const NEXT_ACTION: Record<ShipmentStatus, string> = {
  preparing: 'להשלים פרטים ולשלוח בקשת מחיר',
  waiting_for_quotes: 'לעקוב אחרי הצעות מחיר',
  quotes_received: 'לבחור הצעת מחיר',
  waiting_for_pickup: 'לתאם איסוף',
  picked_up: 'לעקוב אחרי המשלוח',
  in_transit: 'לעקוב אחרי המשלוח',
  customs: 'לבדוק סטטוס מכס',
  delivered: '—',
  missing_documents: 'להשלים מסמכים חסרים',
  issue: 'לטפל בבעיה',
}

export default function ShipmentsPage() {
  const store = useStore()
  const { shipments, brands, addForwarder, reloadFromDisk } = store
  const notify = useNotify()
  const [addForwarderOpen, setAddForwarderOpen] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const kpis = useMemo(() => {
    const active = shipments.filter((s) => s.status !== 'delivered').length
    const waitingForQuotes = shipments.filter((s) => s.status === 'waiting_for_quotes').length
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length
    const delivered = shipments.filter((s) => s.status === 'delivered').length
    const alerts = shipments.filter((s) => s.status === 'missing_documents' || s.status === 'issue').length
    return { active, waitingForQuotes, inTransit, delivered, alerts }
  }, [shipments])

  const sortedShipments = useMemo(() => [...shipments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [shipments])

  async function handleAddForwarder(values: Record<string, string>) {
    await addForwarder({ name: values.name?.trim(), email: values.email?.trim() || undefined, phone: values.phone?.trim() || undefined })
    setAddForwarderOpen(false)
  }

  async function checkEmailUpdates() {
    setCheckingEmail(true)
    try {
      const summary = await checkEmailAccount('work', store)
      if (summary.checked === 0) {
        notify('אין מיילים חדשים בתיבת העבודה.', 'info')
      } else {
        notify(`נבדקו ${summary.checked} מיילים חדשים: ${summary.autoFiled} נוספו אוטומטית, ${summary.sentToInbox} נשלחו לתיבת הכניסה למיון.`, 'success')
      }
    } catch (err: any) {
      notify(err instanceof EmailCheckError ? err.message : 'הבדיקה נכשלה. אפשר לנסות שוב מהגדרות.', 'error')
    } finally {
      setCheckingEmail(false)
    }
  }

  async function refreshStatuses() {
    await reloadFromDisk()
    notify('הסטטוסים רועננו', 'success')
  }

  function brandName(brandId?: string) {
    return brandId ? brands.find((b) => b.id === brandId)?.name : undefined
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to="/work"
            className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
            aria-label="חזרה לעבודה"
            title="חזרה לעבודה"
          >
            ←
          </Link>
          <div className="flex items-center gap-2">
            <TruckIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
            <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">מעקב משלוחים</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={checkEmailUpdates}
            disabled={checkingEmail}
            className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-50"
          >
            {checkingEmail ? 'בודק...' : 'בדוק עדכונים במייל'}
          </button>
          <button onClick={refreshStatuses} className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800">
            רענון סטטוסים
          </button>
          <Link to="/work/shipments/new" className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            + בקשת הצעת מחיר חדשה
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'משלוחים פעילים', value: kpis.active },
          { label: 'ממתינים להצעות', value: kpis.waitingForQuotes },
          { label: 'בדרך', value: kpis.inTransit },
          { label: 'התקבלו', value: kpis.delivered },
          { label: 'התראות', value: kpis.alerts },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/60 dark:border-stone-800 p-3.5">
            <div className="text-[11px] text-stone-400 dark:text-stone-500 mb-1">{s.label}</div>
            <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{s.value}</div>
          </div>
        ))}
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">משלוחים</h3>
          <button onClick={() => setAddForwarderOpen(true)} className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300">
            + הוסף חברת שילוח
          </button>
        </div>
        <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
          {sortedShipments.length === 0 && <EmptyLine text="עדיין אין משלוחים במערכת" />}
          {sortedShipments.map((s) => (
            <li key={s.id} className="py-3">
              <Link to={`/work/shipments/${s.id}`} className="block">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100">
                    #{s.id.slice(-6)} · {s.name ?? brandName(s.brandId) ?? s.supplierName ?? 'ספק לא ידוע'}
                  </span>
                  <StatusPill label={STATUS_LABEL[s.status]} tone={STATUS_TONE[s.status]} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                  {s.originCountry && <span>{s.originCountry}</span>}
                  <span>· עודכן {s.updatedAt.slice(0, 10)}</span>
                  <span>· {NEXT_ACTION[s.status]}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <QuickAddPopover
        open={addForwarderOpen}
        title="הוספת חברת שילוח"
        fields={[
          { key: 'name', label: 'שם החברה', type: 'text', required: true },
          { key: 'email', label: 'Email', type: 'text', secondary: true },
          { key: 'phone', label: 'טלפון', type: 'text', secondary: true },
        ]}
        onClose={() => setAddForwarderOpen(false)}
        onSave={handleAddForwarder}
      />
    </div>
  )
}
