import { useState } from 'react'
import { useParams, Navigate } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine, FilterChip } from '../components/ui'
import StatusPill, { PillTone } from '../components/hub/StatusPill'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { useConfirm } from '../data/ConfirmContext'
import { ShipmentStatus, QuoteStatus, ShipmentDocCategory, ShipmentTimelineStage, ShipmentQuote } from '../data/shipmentTypes'

type GroupKey = 'overview' | 'quotes' | 'timeline' | 'documents'
const GROUPS: { key: GroupKey; label: string }[] = [
  { key: 'overview', label: 'סקירה' },
  { key: 'quotes', label: 'הצעות מחיר' },
  { key: 'timeline', label: 'ציר זמן' },
  { key: 'documents', label: 'מסמכים' },
]

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
const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = { pending: 'ממתין', recommended: 'מומלץ', selected: 'נבחר', rejected: 'נדחה' }
const QUOTE_STATUS_TONE: Record<QuoteStatus, PillTone> = { pending: 'neutral', recommended: 'warm', selected: 'calm', rejected: 'alert' }
const DOC_CATEGORY_LABEL: Record<ShipmentDocCategory, string> = {
  invoice: 'Invoice',
  packing_list: 'Packing List',
  msds_sds: 'MSDS / SDS',
  awb: 'AWB',
  dangerous_goods: 'Dangerous Goods',
  customs: 'Customs',
  other: 'אחר',
}
const TIMELINE_STAGE_LABEL: Record<ShipmentTimelineStage, string> = {
  rfq_sent: 'בקשת הצעת מחיר נשלחה',
  quote_received: 'התקבלה הצעת מחיר',
  quote_selected: 'הצעת מחיר נבחרה',
  pickup_booked: 'איסוף תואם',
  collected: 'נאסף',
  tracking_update: 'עדכון מעקב',
  customs: 'מכס',
  delivered: 'התקבל',
}

const SHIPMENT_FIELDS: QuickAddField[] = [
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    required: true,
    options: (Object.keys(STATUS_LABEL) as ShipmentStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  },
  { key: 'trackingNumber', label: 'מספר מעקב', type: 'text' },
  { key: 'originCountry', label: 'מדינת מוצא', type: 'text', secondary: true },
  { key: 'destination', label: 'יעד', type: 'text', secondary: true },
  { key: 'pickupAddress', label: 'כתובת איסוף', type: 'text', secondary: true },
  { key: 'contactPerson', label: 'איש קשר', type: 'text', secondary: true },
  { key: 'contactEmail', label: 'Email איש קשר', type: 'text', secondary: true },
  { key: 'cartons', label: 'קרטונים', type: 'number', secondary: true },
  { key: 'weight', label: 'משקל (ק"ג)', type: 'number', secondary: true },
  { key: 'dimensions', label: 'מידות', type: 'text', secondary: true },
  { key: 'goodsType', label: 'סוג הסחורה', type: 'text', secondary: true },
  { key: 'shipmentValue', label: 'שווי המשלוח', type: 'number', secondary: true },
  { key: 'currency', label: 'מטבע', type: 'text', secondary: true },
  { key: 'requestedPickupDate', label: 'תאריך איסוף מבוקש', type: 'date', secondary: true },
  { key: 'departureDate', label: 'תאריך יציאה', type: 'date', secondary: true },
  { key: 'eta', label: 'ETA', type: 'date', secondary: true },
  { key: 'selectedForwarderId', label: 'חברת שילוח נבחרת', type: 'text', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const QUOTE_FIELDS: QuickAddField[] = [
  { key: 'forwarderName', label: 'חברת שילוח', type: 'text', required: true },
  { key: 'price', label: 'מחיר', type: 'number' },
  {
    key: 'status',
    label: 'סטטוס',
    type: 'select',
    options: [
      { value: 'pending', label: 'ממתין' },
      { value: 'recommended', label: 'מומלץ' },
      { value: 'selected', label: 'נבחר' },
      { value: 'rejected', label: 'נדחה' },
    ],
  },
  { key: 'currency', label: 'מטבע', type: 'text', secondary: true },
  { key: 'transitTimeDays', label: 'זמן מעבר (ימים)', type: 'number', secondary: true },
  { key: 'dateReceived', label: 'תאריך קבלה', type: 'date', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const DOCUMENT_FIELDS: QuickAddField[] = [
  {
    key: 'category',
    label: 'קטגוריה',
    type: 'select',
    required: true,
    options: (Object.keys(DOC_CATEGORY_LABEL) as ShipmentDocCategory[]).map((c) => ({ value: c, label: DOC_CATEGORY_LABEL[c] })),
  },
  { key: 'name', label: 'שם המסמך', type: 'text', required: true },
  { key: 'url', label: 'קישור', type: 'text', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

const TIMELINE_FIELDS: QuickAddField[] = [
  {
    key: 'stage',
    label: 'שלב',
    type: 'select',
    required: true,
    options: (Object.keys(TIMELINE_STAGE_LABEL) as ShipmentTimelineStage[]).map((s) => ({ value: s, label: TIMELINE_STAGE_LABEL[s] })),
  },
  { key: 'date', label: 'תאריך', type: 'date', required: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

export default function ShipmentDetailPage() {
  const { shipmentId } = useParams<{ shipmentId: string }>()
  const confirm = useConfirm()
  const {
    shipments,
    shipmentQuotes,
    shipmentDocuments,
    shipmentTimelineEvents,
    brands,
    updateShipment,
    deleteShipment,
    addShipmentQuote,
    updateShipmentQuote,
    deleteShipmentQuote,
    addShipmentDocument,
    deleteShipmentDocument,
    addShipmentTimelineEvent,
  } = useStore()

  const [group, setGroup] = useState<GroupKey>('overview')
  const [editOpen, setEditOpen] = useState(false)
  const [quoteModal, setQuoteModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [docOpen, setDocOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)

  const shipment = shipments.find((s) => s.id === shipmentId)
  if (!shipment) return <Navigate to="/work/shipments" replace />

  const quotes = [...shipmentQuotes.filter((q) => q.shipmentId === shipment.id)].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
  const documents = shipmentDocuments.filter((d) => d.shipmentId === shipment.id)
  const timeline = [...shipmentTimelineEvents.filter((e) => e.shipmentId === shipment.id)].sort((a, b) => a.date.localeCompare(b.date))
  const brand = shipment.brandId ? brands.find((b) => b.id === shipment.brandId) : undefined

  async function handleSaveShipment(values: Record<string, string>) {
    await updateShipment(shipment!.id, {
      status: (values.status as ShipmentStatus) || 'preparing',
      trackingNumber: values.trackingNumber?.trim() || undefined,
      originCountry: values.originCountry?.trim() || undefined,
      destination: values.destination?.trim() || undefined,
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
      departureDate: values.departureDate || undefined,
      eta: values.eta || undefined,
      selectedForwarderId: values.selectedForwarderId?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    })
    setEditOpen(false)
  }

  async function handleDeleteShipment() {
    const ok = await confirm({ title: 'מחיקת משלוח', message: 'למחוק את המשלוח הזה? הפעולה בלתי הפיכה.', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteShipment(shipment!.id)
  }

  function quoteInitialValues(q?: ShipmentQuote): Record<string, string> {
    if (!q) return {}
    return {
      forwarderName: q.forwarderName,
      price: q.price !== undefined ? String(q.price) : '',
      status: q.status,
      currency: q.currency ?? '',
      transitTimeDays: q.transitTimeDays !== undefined ? String(q.transitTimeDays) : '',
      dateReceived: q.dateReceived ?? '',
      notes: q.notes ?? '',
    }
  }

  async function handleSaveQuote(values: Record<string, string>) {
    const data = {
      shipmentId: shipment!.id,
      forwarderName: values.forwarderName?.trim(),
      price: values.price ? Number(values.price) : undefined,
      status: (values.status as QuoteStatus) || 'pending',
      currency: values.currency?.trim() || undefined,
      transitTimeDays: values.transitTimeDays ? Number(values.transitTimeDays) : undefined,
      dateReceived: values.dateReceived || undefined,
      notes: values.notes?.trim() || undefined,
    }
    if (quoteModal.editingId) await updateShipmentQuote(quoteModal.editingId, data)
    else await addShipmentQuote(data)
    setQuoteModal({ open: false })
  }

  async function handleDeleteQuote() {
    if (!quoteModal.editingId) return
    const ok = await confirm({ title: 'מחיקת הצעת מחיר', message: 'למחוק את הצעת המחיר הזו?', confirmLabel: 'מחק', danger: true })
    if (!ok) return
    await deleteShipmentQuote(quoteModal.editingId)
    setQuoteModal({ open: false })
  }

  async function handleSelectQuote(q: ShipmentQuote) {
    await updateShipmentQuote(q.id, { status: 'selected' })
    await updateShipment(shipment!.id, { status: 'waiting_for_pickup' })
  }

  async function handleAddDocument(values: Record<string, string>) {
    await addShipmentDocument({
      shipmentId: shipment!.id,
      category: (values.category as ShipmentDocCategory) || 'other',
      name: values.name?.trim(),
      url: values.url?.trim() || undefined,
      notes: values.notes?.trim() || undefined,
    })
    setDocOpen(false)
  }

  async function handleAddTimelineEvent(values: Record<string, string>) {
    await addShipmentTimelineEvent({
      shipmentId: shipment!.id,
      stage: (values.stage as ShipmentTimelineStage) || 'tracking_update',
      date: values.date,
      notes: values.notes?.trim() || undefined,
    })
    setTimelineOpen(false)
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <BackLink to="/work/shipments" label="כל המשלוחים" />
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-xl font-extrabold text-stone-900 dark:text-stone-100">
              #{shipment.id.slice(-6)} · {brand?.name ?? shipment.supplierName ?? 'ספק לא ידוע'}
            </h1>
            <StatusPill label={STATUS_LABEL[shipment.status]} tone={STATUS_TONE[shipment.status]} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => (
          <FilterChip key={g.key} active={group === g.key} onClick={() => setGroup(g.key)}>
            {g.label}
          </FilterChip>
        ))}
      </div>

      {group === 'overview' && (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">פרטי משלוח</h2>
              <button onClick={() => setEditOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
                ערוך
              </button>
            </div>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                ['ספק', brand?.name ?? shipment.supplierName ?? '—'],
                ['מוצא', shipment.originCountry ?? '—'],
                ['יעד', shipment.destination ?? '—'],
                ['קרטונים', shipment.cartons?.toString() ?? '—'],
                ['משקל', shipment.weight ? `${shipment.weight} ק"ג` : '—'],
                ['מידות', shipment.dimensions ?? '—'],
                ['שווי', shipment.shipmentValue !== undefined ? `${shipment.shipmentValue} ${shipment.currency ?? ''}` : '—'],
                ['תאריך יציאה', shipment.departureDate ?? '—'],
                ['ETA', shipment.eta ?? '—'],
                ['חברת שילוח נבחרת', shipment.selectedForwarderId ?? '—'],
                ['מספר מעקב', shipment.trackingNumber ?? '—'],
                ['סטטוס', STATUS_LABEL[shipment.status]],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-stone-400 dark:text-stone-500">{label}</dt>
                  <dd className="text-stone-700 dark:text-stone-200">{value}</dd>
                </div>
              ))}
            </dl>
            {shipment.notes && (
              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
                <dt className="text-xs text-stone-400 dark:text-stone-500 mb-1">הערות</dt>
                <dd className="text-sm text-stone-700 dark:text-stone-200">{shipment.notes}</dd>
              </div>
            )}
          </Card>
          <button onClick={handleDeleteShipment} className="text-xs text-stone-400 hover:text-red-600 dark:hover:text-red-400">
            מחק משלוח
          </button>
        </div>
      )}

      {group === 'quotes' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">הצעות מחיר</h3>
            <button onClick={() => setQuoteModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף הצעת מחיר
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {quotes.length === 0 && <EmptyLine text="עדיין לא התקבלו הצעות מחיר" />}
            {quotes.map((q) => (
              <li key={q.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-stone-800 dark:text-stone-100 cursor-pointer" onClick={() => setQuoteModal({ open: true, editingId: q.id })}>
                    {q.forwarderName}
                  </span>
                  <StatusPill label={QUOTE_STATUS_LABEL[q.status]} tone={QUOTE_STATUS_TONE[q.status]} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-stone-400 dark:text-stone-500">
                  {q.price !== undefined && <span>{q.price} {q.currency}</span>}
                  {q.transitTimeDays !== undefined && <span>· {q.transitTimeDays} ימי מעבר</span>}
                  {q.dateReceived && <span>· התקבלה {q.dateReceived}</span>}
                  {q.status !== 'selected' && (
                    <button onClick={() => handleSelectQuote(q)} className="text-amber-800 dark:text-amber-400 hover:underline">
                      · בחר הצעה זו
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'timeline' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">ציר זמן</h3>
            <button onClick={() => setTimelineOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף אירוע
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {timeline.length === 0 && <EmptyLine text="עדיין אין אירועים בציר הזמן" />}
            {timeline.map((e) => (
              <li key={e.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                <span className="text-stone-800 dark:text-stone-100">{TIMELINE_STAGE_LABEL[e.stage]}</span>
                <span className="text-stone-400 dark:text-stone-500">{e.date}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {group === 'documents' && (
        <Card className="!p-0 overflow-hidden">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">מסמכי משלוח</h3>
            <button onClick={() => setDocOpen(true)} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
              + הוסף מסמך
            </button>
          </div>
          <ul className="divide-y divide-stone-50 dark:divide-stone-800 px-5">
            {documents.length === 0 && <EmptyLine text="עדיין אין מסמכים" />}
            {documents.map((d) => (
              <li key={d.id} className="py-2.5 flex items-center justify-between gap-2 text-sm">
                <div>
                  <span className="text-stone-800 dark:text-stone-100">{d.name}</span>
                  <span className="text-stone-400 dark:text-stone-500"> — {DOC_CATEGORY_LABEL[d.category]}</span>
                </div>
                <div className="flex items-center gap-2">
                  {d.url && (
                    <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-amber-800 dark:text-amber-400 hover:underline">
                      פתח
                    </a>
                  )}
                  <button onClick={() => deleteShipmentDocument(d.id)} className="text-stone-300 hover:text-red-500" aria-label="מחק">
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <QuickAddPopover
        open={editOpen}
        title="עריכת משלוח"
        fields={SHIPMENT_FIELDS}
        initialValues={{
          status: shipment.status,
          trackingNumber: shipment.trackingNumber ?? '',
          originCountry: shipment.originCountry ?? '',
          destination: shipment.destination ?? '',
          pickupAddress: shipment.pickupAddress ?? '',
          contactPerson: shipment.contactPerson ?? '',
          contactEmail: shipment.contactEmail ?? '',
          cartons: shipment.cartons !== undefined ? String(shipment.cartons) : '',
          weight: shipment.weight !== undefined ? String(shipment.weight) : '',
          dimensions: shipment.dimensions ?? '',
          goodsType: shipment.goodsType ?? '',
          shipmentValue: shipment.shipmentValue !== undefined ? String(shipment.shipmentValue) : '',
          currency: shipment.currency ?? '',
          requestedPickupDate: shipment.requestedPickupDate ?? '',
          departureDate: shipment.departureDate ?? '',
          eta: shipment.eta ?? '',
          selectedForwarderId: shipment.selectedForwarderId ?? '',
          notes: shipment.notes ?? '',
        }}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveShipment}
      />

      <QuickAddPopover
        open={quoteModal.open}
        title={quoteModal.editingId ? 'עריכת הצעת מחיר' : 'הוספת הצעת מחיר'}
        fields={QUOTE_FIELDS}
        initialValues={quoteInitialValues(quotes.find((q) => q.id === quoteModal.editingId))}
        onClose={() => setQuoteModal({ open: false })}
        onSave={handleSaveQuote}
        onDelete={quoteModal.editingId ? handleDeleteQuote : undefined}
      />

      <QuickAddPopover open={docOpen} title="הוספת מסמך" fields={DOCUMENT_FIELDS} onClose={() => setDocOpen(false)} onSave={handleAddDocument} />

      <QuickAddPopover open={timelineOpen} title="הוספת אירוע לציר הזמן" fields={TIMELINE_FIELDS} onClose={() => setTimelineOpen(false)} onSave={handleAddTimelineEvent} />
    </div>
  )
}
