import { ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { ReceiptIcon } from '../components/hub/hubIcons'
import { INVOICE_KIND_LABEL, INVOICE_STATUS_LABEL, InvoiceKind, InvoiceStatus } from '../data/shipmentFinanceTypes'
import { computeDueDate, estimatedVat } from '../rfq/shipmentFinance'
import { todayISO } from '../utils/date'

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

const STATUS_TONE: Record<InvoiceStatus, string> = {
  expected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300',
  received: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300',
  approved: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
}

function shekel(n: number) {
  return `₪${Math.round(n).toLocaleString('he-IL')}`
}

export default function ShipmentFinancePage() {
  const { shipments, forwarders, shipmentInvoices, shipmentPayments, addShipmentInvoice, updateShipmentInvoice, deleteShipmentInvoice, addShipmentPayment, updateShipment } =
    useStore()
  const confirm = useConfirm()
  const today = todayISO()

  const [invoiceModal, setInvoiceModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [payModal, setPayModal] = useState<{ open: boolean; invoiceId?: string }>({ open: false })
  const [vatModal, setVatModal] = useState<{ open: boolean; shipmentId?: string }>({ open: false })

  const shipmentOptions = shipments.map((s) => ({ value: s.id, label: s.rfqReference ? `${s.rfqReference} · ${s.name ?? ''}` : (s.name ?? s.id.slice(-6)) }))

  const rows = useMemo(() => {
    return shipmentInvoices
      .map((inv) => {
        const shipment = shipments.find((s) => s.id === inv.shipmentId)
        const forwarder = forwarders.find((f) => f.id === inv.forwarderId)
        const due = shipment ? computeDueDate(shipment, inv, forwarder) : undefined
        const paid = shipmentPayments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0)
        return { inv, shipment, due, paid }
      })
      .sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  }, [shipmentInvoices, shipments, forwarders, shipmentPayments])

  const totals = useMemo(() => {
    const invoiced = shipmentInvoices.filter((i) => i.status !== 'expected').reduce((s, i) => s + (i.amount ?? 0), 0)
    const paid = shipmentPayments.reduce((s, p) => s + p.amount, 0)
    const vatEst = shipments.filter((s) => !s.vatPaidAt).reduce((sum, s) => sum + (s.vatActual ?? estimatedVat(s) ?? 0), 0)
    return { invoiced, paid, outstanding: Math.max(0, invoiced - paid), vatEst, missing: shipmentInvoices.filter((i) => i.status === 'expected').length }
  }, [shipmentInvoices, shipmentPayments, shipments])

  const INVOICE_FIELDS: QuickAddField[] = [
    { key: 'shipmentId', label: 'משלוח', type: 'select', required: true, options: shipmentOptions },
    { key: 'issuerName', label: 'מנפיק החשבונית', type: 'text', required: true },
    {
      key: 'kind',
      label: 'סוג',
      type: 'select',
      required: true,
      options: (Object.keys(INVOICE_KIND_LABEL) as InvoiceKind[]).map((k) => ({ value: k, label: INVOICE_KIND_LABEL[k] })),
    },
    {
      key: 'status',
      label: 'מצב',
      type: 'select',
      required: true,
      options: (Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((k) => ({ value: k, label: INVOICE_STATUS_LABEL[k] })),
    },
    { key: 'amount', label: 'סכום', type: 'number' },
    { key: 'currency', label: 'מטבע', type: 'text' },
    { key: 'invoiceNumber', label: 'מספר חשבונית', type: 'text', secondary: true },
    { key: 'forwarderId', label: 'סוכנות', type: 'select', secondary: true, options: forwarders.map((f) => ({ value: f.id, label: f.name })) },
    { key: 'invoiceDate', label: 'תאריך חשבונית', type: 'date', secondary: true },
    { key: 'dueDate', label: 'מועד תשלום (דריסה)', type: 'date', secondary: true },
    { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
  ]

  const editingInvoice = invoiceModal.editingId ? shipmentInvoices.find((i) => i.id === invoiceModal.editingId) : undefined

  async function handleSaveInvoice(v: Record<string, string>) {
    if (!v.shipmentId || !v.issuerName?.trim()) return
    const data = {
      shipmentId: v.shipmentId,
      issuerName: v.issuerName.trim(),
      kind: (v.kind as InvoiceKind) || 'freight',
      status: (v.status as InvoiceStatus) || 'expected',
      amount: v.amount ? Number(v.amount) : undefined,
      currency: v.currency?.trim() || '₪',
      invoiceNumber: v.invoiceNumber?.trim() || undefined,
      forwarderId: v.forwarderId || undefined,
      invoiceDate: v.invoiceDate || undefined,
      dueDate: v.dueDate || undefined,
      notes: v.notes?.trim() || undefined,
    }
    if (invoiceModal.editingId) await updateShipmentInvoice(invoiceModal.editingId, data)
    else await addShipmentInvoice(data)
    setInvoiceModal({ open: false })
  }

  async function handleDeleteInvoice() {
    if (!invoiceModal.editingId) return
    const ok = await confirm({ title: 'למחוק את החשבונית?', message: 'הפעולה בלתי הפיכה.', confirmLabel: 'מחק', danger: true })
    if (ok) {
      await deleteShipmentInvoice(invoiceModal.editingId)
      setInvoiceModal({ open: false })
    }
  }

  async function handleSavePayment(v: Record<string, string>) {
    const inv = shipmentInvoices.find((i) => i.id === payModal.invoiceId)
    if (!inv || !v.amount) return
    await addShipmentPayment({
      shipmentId: inv.shipmentId,
      invoiceId: inv.id,
      amount: Number(v.amount),
      currency: inv.currency,
      paidAt: v.paidAt || today,
      method: v.method?.trim() || undefined,
      reference: v.reference?.trim() || undefined,
    })
    const alreadyPaid = shipmentPayments.filter((p) => p.invoiceId === inv.id).reduce((s, p) => s + p.amount, 0)
    if (inv.amount != null && alreadyPaid + Number(v.amount) >= inv.amount) await updateShipmentInvoice(inv.id, { status: 'paid' })
    setPayModal({ open: false })
  }

  async function handleSaveVat(v: Record<string, string>) {
    if (!vatModal.shipmentId) return
    await updateShipment(vatModal.shipmentId, {
      vatEstimate: v.vatEstimate ? Number(v.vatEstimate) : undefined,
      vatActual: v.vatActual ? Number(v.vatActual) : undefined,
      vatPaidAt: v.vatPaidAt || undefined,
    })
    setVatModal({ open: false })
  }

  const vatShipment = vatModal.shipmentId ? shipments.find((s) => s.id === vatModal.shipmentId) : undefined

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackLink to="/work/shipments" label="חזרה ליבוא ומשלוחים" />
          <span className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 flex items-center justify-center shrink-0">
            <ReceiptIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </span>
          <div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500">יבוא ומשלוחים</div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">חשבוניות ותשלומים</h1>
          </div>
        </div>
        <button onClick={() => setInvoiceModal({ open: true })} className="px-4 py-2.5 rounded-xl bg-[#3B2A1C] text-white text-sm font-medium hover:bg-[#2A1E14]">
          + חשבונית חדשה
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'סך חויב', value: shekel(totals.invoiced), tone: 'text-stone-800 dark:text-stone-100' },
          { label: 'שולם', value: shekel(totals.paid), tone: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'נותר לתשלום', value: shekel(totals.outstanding), tone: 'text-amber-600 dark:text-amber-400' },
          { label: 'חשבוניות חסרות', value: String(totals.missing), tone: totals.missing > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-800 dark:text-stone-100' },
          { label: 'מע״מ צפוי (אומדן)', value: shekel(totals.vatEst), tone: 'text-violet-600 dark:text-violet-400' },
        ].map((k) => (
          <Panel key={k.label} className="p-4">
            <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{k.label}</div>
            <div className={`text-[20px] font-extrabold mt-1 truncate ${k.tone}`}>{k.value}</div>
          </Panel>
        ))}
      </div>

      <Panel className="p-4">
        <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-3">כל החשבוניות</h2>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">עדיין אין חשבוניות רשומות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[820px]">
              <thead>
                <tr className="text-stone-400 dark:text-stone-500 bg-stone-50/70 dark:bg-stone-800/40">
                  <th className="text-right font-medium py-2 px-2 rounded-s-lg">משלוח</th>
                  <th className="text-right font-medium py-2 px-2">מנפיק</th>
                  <th className="text-right font-medium py-2 px-2">סוג</th>
                  <th className="text-right font-medium py-2 px-2">מספר</th>
                  <th className="text-right font-medium py-2 px-2">סכום</th>
                  <th className="text-right font-medium py-2 px-2">שולם</th>
                  <th className="text-right font-medium py-2 px-2">מועד תשלום</th>
                  <th className="text-right font-medium py-2 px-2">מצב</th>
                  <th className="text-left font-medium py-2 px-2 rounded-e-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {rows.map(({ inv, shipment, due, paid }) => (
                  <tr key={inv.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-2.5 px-2">
                      <Link to={`/work/shipments/${inv.shipmentId}`} className="font-semibold text-stone-800 dark:text-stone-100 hover:text-amber-800 dark:hover:text-amber-400">
                        {shipment?.rfqReference ?? shipment?.name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{inv.issuerName}</td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{INVOICE_KIND_LABEL[inv.kind]}</td>
                    <td className="py-2.5 px-2 text-stone-500 dark:text-stone-400">{inv.invoiceNumber ?? '—'}</td>
                    <td className="py-2.5 px-2 font-semibold text-stone-800 dark:text-stone-100 whitespace-nowrap">
                      {inv.amount != null ? `${inv.currency ?? '₪'}${inv.amount.toLocaleString('he-IL')}` : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{paid > 0 ? shekel(paid) : '—'}</td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <span className={due && due < today && inv.status !== 'paid' ? 'text-rose-600 dark:text-rose-400 font-medium' : 'text-stone-600 dark:text-stone-300'}>
                        {due ?? '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${STATUS_TONE[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status]}</span>
                    </td>
                    <td className="py-2.5 px-2 text-left whitespace-nowrap">
                      {inv.status !== 'paid' && inv.status !== 'expected' && (
                        <button onClick={() => setPayModal({ open: true, invoiceId: inv.id })} className="text-[10px] text-emerald-700 dark:text-emerald-400 hover:opacity-70 me-2">
                          רשום תשלום
                        </button>
                      )}
                      <button onClick={() => setInvoiceModal({ open: true, editingId: inv.id })} className="text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 text-sm">
                        ✎
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel className="p-4">
        <h2 className="text-[15px] font-bold text-stone-800 dark:text-stone-100 mb-1">מע״מ לפי משלוח</h2>
        <p className="text-[11px] text-stone-400 dark:text-stone-500 mb-3">אומדן וסכום בפועל נשמרים בנפרד — אומדן לעולם לא מוצג כסכום רשמי.</p>
        {shipments.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 dark:text-stone-500">אין משלוחים</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[560px]">
              <thead>
                <tr className="text-stone-400 dark:text-stone-500 bg-stone-50/70 dark:bg-stone-800/40">
                  <th className="text-right font-medium py-2 px-2 rounded-s-lg">משלוח</th>
                  <th className="text-right font-medium py-2 px-2">ערך מוצהר</th>
                  <th className="text-right font-medium py-2 px-2">מע״מ אומדן</th>
                  <th className="text-right font-medium py-2 px-2">מע״מ בפועל</th>
                  <th className="text-right font-medium py-2 px-2">שולם</th>
                  <th className="text-left font-medium py-2 px-2 rounded-e-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {shipments.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                    <td className="py-2.5 px-2 font-semibold text-stone-800 dark:text-stone-100">{s.rfqReference ?? s.name ?? '—'}</td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{s.shipmentValue != null ? shekel(s.shipmentValue) : '—'}</td>
                    <td className="py-2.5 px-2 text-violet-600 dark:text-violet-400">{estimatedVat(s) != null ? shekel(estimatedVat(s)!) : '—'}</td>
                    <td className="py-2.5 px-2 text-stone-800 dark:text-stone-100 font-medium">{s.vatActual != null ? shekel(s.vatActual) : '—'}</td>
                    <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{s.vatPaidAt ?? '—'}</td>
                    <td className="py-2.5 px-2 text-left">
                      <button onClick={() => setVatModal({ open: true, shipmentId: s.id })} className="text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 text-sm">
                        ✎
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <QuickAddPopover
        open={invoiceModal.open}
        title={invoiceModal.editingId ? 'עריכת חשבונית' : 'חשבונית חדשה'}
        onClose={() => setInvoiceModal({ open: false })}
        onSave={handleSaveInvoice}
        onDelete={invoiceModal.editingId ? handleDeleteInvoice : undefined}
        fields={INVOICE_FIELDS}
        initialValues={
          editingInvoice
            ? {
                shipmentId: editingInvoice.shipmentId,
                issuerName: editingInvoice.issuerName,
                kind: editingInvoice.kind,
                status: editingInvoice.status,
                amount: editingInvoice.amount?.toString() ?? '',
                currency: editingInvoice.currency ?? '',
                invoiceNumber: editingInvoice.invoiceNumber ?? '',
                forwarderId: editingInvoice.forwarderId ?? '',
                invoiceDate: editingInvoice.invoiceDate ?? '',
                dueDate: editingInvoice.dueDate ?? '',
                notes: editingInvoice.notes ?? '',
              }
            : undefined
        }
      />

      <QuickAddPopover
        open={payModal.open}
        title="רישום תשלום"
        onClose={() => setPayModal({ open: false })}
        onSave={handleSavePayment}
        fields={[
          { key: 'amount', label: 'סכום ששולם', type: 'number', required: true },
          { key: 'paidAt', label: 'תאריך תשלום', type: 'date' },
          { key: 'method', label: 'אמצעי תשלום', type: 'text', secondary: true },
          { key: 'reference', label: 'אסמכתא', type: 'text', secondary: true },
        ]}
      />

      <QuickAddPopover
        open={vatModal.open}
        title={`מע״מ — ${vatShipment?.rfqReference ?? vatShipment?.name ?? ''}`}
        onClose={() => setVatModal({ open: false })}
        onSave={handleSaveVat}
        fields={[
          { key: 'vatEstimate', label: 'מע״מ אומדן', type: 'number' },
          { key: 'vatActual', label: 'מע״מ בפועל (רשמי)', type: 'number' },
          { key: 'vatPaidAt', label: 'תאריך תשלום מע״מ', type: 'date' },
        ]}
        initialValues={
          vatShipment
            ? {
                vatEstimate: vatShipment.vatEstimate?.toString() ?? '',
                vatActual: vatShipment.vatActual?.toString() ?? '',
                vatPaidAt: vatShipment.vatPaidAt ?? '',
              }
            : undefined
        }
      />
    </div>
  )
}
