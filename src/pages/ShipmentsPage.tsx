import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { TruckIcon } from '../components/hub/hubIcons'
import { Card, EmptyLine } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useNotify } from '../data/NotificationContext'
import { ShipmentStatus } from '../data/shipmentTypes'

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

const NEW_SHIPMENT_FIELDS_PRIMARY: QuickAddField[] = [
  { key: 'goodsType', label: 'סוג הסחורה', type: 'text', placeholder: 'לדוגמה: בשמים' },
  { key: 'requestedPickupDate', label: 'תאריך איסוף מבוקש', type: 'date' },
]

export default function ShipmentsPage() {
  const { shipments, brands, forwarders, addShipment, addShipmentDocument, addForwarder, reloadFromDisk } = useStore()
  const notify = useNotify()
  const [addOpen, setAddOpen] = useState(false)
  const [addForwarderOpen, setAddForwarderOpen] = useState(false)

  const NEW_SHIPMENT_FIELDS: QuickAddField[] = useMemo(
    () => [
      { key: 'brandId', label: 'מותג', type: 'select', options: brands.map((b) => ({ value: b.id, label: b.name })) },
      { key: 'supplierName', label: 'ספק (אם אין מותג ברשימה)', type: 'text' },
      ...NEW_SHIPMENT_FIELDS_PRIMARY,
      { key: 'originCountry', label: 'מדינת מוצא', type: 'text', secondary: true },
      { key: 'pickupAddress', label: 'כתובת איסוף', type: 'text', secondary: true },
      { key: 'contactPerson', label: 'איש קשר', type: 'text', secondary: true },
      { key: 'contactEmail', label: 'Email איש קשר', type: 'text', secondary: true },
      { key: 'cartons', label: 'מספר קרטונים', type: 'number', secondary: true },
      { key: 'weight', label: 'משקל (ק"ג)', type: 'number', secondary: true },
      { key: 'dimensions', label: 'מידות', type: 'text', secondary: true },
      { key: 'shipmentValue', label: 'שווי המשלוח', type: 'number', secondary: true },
      { key: 'currency', label: 'מטבע', type: 'text', placeholder: 'USD / ILS', secondary: true },
      { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
      { key: 'packingListUrl', label: 'קישור ל-Packing List', type: 'text', secondary: true },
      { key: 'invoiceUrl', label: 'קישור ל-Invoice', type: 'text', secondary: true },
      { key: 'forwarderIds', label: 'חברות שילוח לבקשת הצעת מחיר', type: 'multiselect', options: forwarders.map((f) => ({ value: f.id, label: f.name })), secondary: true },
    ],
    [brands, forwarders],
  )

  const kpis = useMemo(() => {
    const active = shipments.filter((s) => s.status !== 'delivered').length
    const waitingForQuotes = shipments.filter((s) => s.status === 'waiting_for_quotes').length
    const inTransit = shipments.filter((s) => s.status === 'in_transit').length
    const delivered = shipments.filter((s) => s.status === 'delivered').length
    const alerts = shipments.filter((s) => s.status === 'missing_documents' || s.status === 'issue').length
    return { active, waitingForQuotes, inTransit, delivered, alerts }
  }, [shipments])

  const sortedShipments = useMemo(() => [...shipments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [shipments])

  async function handleAddShipment(values: Record<string, string>) {
    const shipment = await addShipment({
      brandId: values.brandId || undefined,
      supplierName: values.supplierName?.trim() || undefined,
      originCountry: values.originCountry?.trim() || undefined,
      pickupAddress: values.pickupAddress?.trim() || undefined,
      contactPerson: values.contactPerson?.trim() || undefined,
      contactEmail: values.contactEmail?.trim() || undefined,
      cartons: values.cartons ? Number(values.cartons) : undefined,
      weight: values.weight ? Number(values.weight) : undefined,
      dimensions: values.dimensions?.trim() || undefined,
      goodsType: values.goodsType?.trim() || undefined,
      shipmentValue: values.shipmentValue ? Number(values.shipmentValue) : undefined,
      currency: values.currency?.trim() || undefined,
      requestedPickupDate: values.requestedPickupDate || undefined,
      notes: values.notes?.trim() || undefined,
      requestedForwarderIds: values.forwarderIds ? values.forwarderIds.split(',').filter(Boolean) : undefined,
      status: 'preparing',
    })
    if (values.packingListUrl?.trim()) {
      await addShipmentDocument({ shipmentId: shipment.id, category: 'packing_list', name: 'Packing List', url: values.packingListUrl.trim() })
    }
    if (values.invoiceUrl?.trim()) {
      await addShipmentDocument({ shipmentId: shipment.id, category: 'invoice', name: 'Invoice', url: values.invoiceUrl.trim() })
    }
    setAddOpen(false)
    notify('בקשת הצעת מחיר / משלוח חדש נוצרו בהצלחה', 'success')
  }

  async function handleAddForwarder(values: Record<string, string>) {
    await addForwarder({ name: values.name?.trim(), email: values.email?.trim() || undefined, phone: values.phone?.trim() || undefined })
    setAddForwarderOpen(false)
  }

  function checkEmailUpdates() {
    notify('חיבור לתיבת המייל עדיין לא הוגדר — הפעולה תהיה זמינה כשתחובר Email integration.', 'info')
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
          <button onClick={checkEmailUpdates} className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800">
            בדוק עדכונים במייל
          </button>
          <button onClick={refreshStatuses} className="px-3.5 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs font-medium text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800">
            רענון סטטוסים
          </button>
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            + בקשת הצעת מחיר חדשה
          </button>
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
                    #{s.id.slice(-6)} · {brandName(s.brandId) ?? s.supplierName ?? 'ספק לא ידוע'}
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

      <QuickAddPopover open={addOpen} title="בקשת הצעת מחיר / משלוח חדש" fields={NEW_SHIPMENT_FIELDS} onClose={() => setAddOpen(false)} onSave={handleAddShipment} />
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
