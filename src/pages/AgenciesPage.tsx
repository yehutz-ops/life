import { ReactNode, useMemo, useState } from 'react'
import BackLink from '../components/BackLink'
import { useStore } from '../data/StoreContext'
import { useConfirm } from '../data/ConfirmContext'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { UsersIcon } from '../components/hub/hubIcons'
import { Forwarder } from '../data/shipmentTypes'
import { PAYMENT_BASIS_LABEL, PaymentTermsBasis } from '../data/shipmentFinanceTypes'

function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-stone-900 rounded-2xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none ${className}`}>
      {children}
    </div>
  )
}

const AGENCY_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם החברה', type: 'text', required: true },
  { key: 'contactPerson', label: 'איש קשר', type: 'text' },
  { key: 'email', label: 'Email', type: 'text', required: true },
  { key: 'phone', label: 'טלפון', type: 'text' },
  {
    key: 'capabilities',
    label: 'יכולות',
    type: 'multiselect',
    options: [
      { value: 'air', label: 'אווירי' },
      { value: 'sea', label: 'ימי' },
      { value: 'dg', label: 'חומרים מסוכנים' },
    ],
  },
  { key: 'paymentTermsDays', label: 'ימי אשראי', type: 'number', secondary: true },
  {
    key: 'paymentTermsBasis',
    label: 'ספירה מ־',
    type: 'select',
    secondary: true,
    options: (Object.keys(PAYMENT_BASIS_LABEL) as PaymentTermsBasis[]).map((b) => ({ value: b, label: PAYMENT_BASIS_LABEL[b] })),
  },
  { key: 'specialties', label: 'התמחויות', type: 'text', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
  {
    key: 'active',
    label: 'סטטוס',
    type: 'select',
    secondary: true,
    options: [
      { value: 'true', label: 'פעיל' },
      { value: 'false', label: 'לא פעיל' },
    ],
  },
]

// ספריית סוכנויות קלה — לא CRM. הסטטיסטיקות נגזרות מהשליחות וההצעות שכבר קיימות במערכת.
export default function AgenciesPage() {
  const { forwarders, rfqDispatches, shipmentQuotes, addForwarder, updateForwarder, deleteForwarder } = useStore()
  const confirm = useConfirm()
  const [modal, setModal] = useState<{ open: boolean; editingId?: string }>({ open: false })
  const [query, setQuery] = useState('')

  const stats = useMemo(() => {
    const map = new Map<string, { sent: number; replied: number; selected: number; avgResponseDays?: number }>()
    for (const f of forwarders) {
      const sent = rfqDispatches.filter((d) => d.forwarderId === f.id && d.status !== 'not_sent')
      const quotes = shipmentQuotes.filter((q) => q.forwarderId === f.id)
      const selected = quotes.filter((q) => q.status === 'selected').length

      // זמן תגובה ממוצע — רק כאשר יש גם תאריך שליחה וגם תאריך קבלה אמיתיים.
      const deltas: number[] = []
      for (const q of quotes) {
        const dispatch = rfqDispatches.find((d) => d.shipmentId === q.shipmentId && d.forwarderId === f.id)
        const received = q.sourceEmail?.receivedAt
        if (dispatch?.sentAt && received) {
          deltas.push((new Date(received).getTime() - new Date(dispatch.sentAt).getTime()) / 86400000)
        }
      }
      map.set(f.id, {
        sent: sent.length,
        replied: new Set(quotes.map((q) => q.shipmentId)).size,
        selected,
        avgResponseDays: deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : undefined,
      })
    }
    return map
  }, [forwarders, rfqDispatches, shipmentQuotes])

  const filtered = forwarders.filter((f) =>
    !query.trim() ? true : [f.name, f.email, f.contactPerson, f.specialties].filter(Boolean).some((v) => String(v).toLowerCase().includes(query.toLowerCase())),
  )

  const editing = modal.editingId ? forwarders.find((f) => f.id === modal.editingId) : undefined

  async function handleSave(values: Record<string, string>) {
    const caps = (values.capabilities ?? '').split(',').filter(Boolean)
    const data = {
      name: values.name?.trim() ?? '',
      contactPerson: values.contactPerson?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      handlesAir: caps.includes('air'),
      handlesSea: caps.includes('sea'),
      handlesDG: caps.includes('dg'),
      specialties: values.specialties?.trim() || undefined,
      paymentTermsDays: values.paymentTermsDays ? Number(values.paymentTermsDays) : undefined,
      paymentTermsBasis: (values.paymentTermsBasis as PaymentTermsBasis) || undefined,
      notes: values.notes?.trim() || undefined,
      active: values.active !== 'false',
    }
    if (!data.name) return
    if (modal.editingId) await updateForwarder(modal.editingId, data)
    else await addForwarder(data)
    setModal({ open: false })
  }

  async function handleDelete() {
    if (!modal.editingId) return
    const ok = await confirm({ title: 'למחוק את הסוכנות?', message: `"${editing?.name}" תימחק. היסטוריית ההצעות תישאר.`, confirmLabel: 'מחק', danger: true })
    if (ok) {
      await deleteForwarder(modal.editingId)
      setModal({ open: false })
    }
  }

  function capsOf(f: Forwarder): string {
    const c = [f.handlesAir && 'אווירי', f.handlesSea && 'ימי', f.handlesDG && 'DG'].filter(Boolean)
    return c.length ? c.join(' · ') : '—'
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <BackLink to="/work/shipments" label="חזרה ליבוא ומשלוחים" />
          <span className="w-11 h-11 rounded-2xl bg-violet-50 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
            <UsersIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </span>
          <div>
            <div className="text-[11px] text-stone-400 dark:text-stone-500">יבוא ומשלוחים</div>
            <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 leading-tight">סוכנויות ושותפים</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש סוכנות…"
            className="w-44 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-800 px-3 py-2 text-[12px] placeholder:text-stone-400"
          />
          <button onClick={() => setModal({ open: true })} className="px-4 py-2.5 rounded-xl bg-[#3B2A1C] text-white text-sm font-medium hover:bg-[#2A1E14]">
            + סוכנות חדשה
          </button>
        </div>
      </div>

      <Panel className="p-4">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-400 dark:text-stone-500">
            {forwarders.length === 0 ? 'עדיין אין סוכנויות — הוסף את הראשונה' : 'אין סוכנות שתואמת את החיפוש'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] min-w-[760px]">
              <thead>
                <tr className="text-stone-400 dark:text-stone-500 bg-stone-50/70 dark:bg-stone-800/40">
                  <th className="text-right font-medium py-2 px-2 rounded-s-lg">סוכנות</th>
                  <th className="text-right font-medium py-2 px-2">איש קשר</th>
                  <th className="text-right font-medium py-2 px-2">יכולות</th>
                  <th className="text-right font-medium py-2 px-2">תנאי תשלום</th>
                  <th className="text-right font-medium py-2 px-2">נשלחו</th>
                  <th className="text-right font-medium py-2 px-2">ענו</th>
                  <th className="text-right font-medium py-2 px-2">נבחרו</th>
                  <th className="text-right font-medium py-2 px-2">זמן תגובה</th>
                  <th className="text-left font-medium py-2 px-2 rounded-e-lg"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filtered.map((f) => {
                  const st = stats.get(f.id)
                  return (
                    <tr key={f.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors">
                      <td className="py-2.5 px-2">
                        <div className="font-semibold text-stone-800 dark:text-stone-100">{f.name}</div>
                        <div className="text-[10px] text-stone-400 dark:text-stone-500">{f.email ?? '—'}</div>
                        {f.active === false && <span className="text-[10px] text-stone-400">לא פעיל</span>}
                      </td>
                      <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300">{f.contactPerson ?? '—'}</td>
                      <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300 whitespace-nowrap">{capsOf(f)}</td>
                      <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                        {f.paymentTermsDays != null ? `${f.paymentTermsDays} ימים` : '—'}
                        {f.paymentTermsBasis && <div className="text-[10px] text-stone-400">{PAYMENT_BASIS_LABEL[f.paymentTermsBasis]}</div>}
                      </td>
                      <td className="py-2.5 px-2 text-stone-700 dark:text-stone-200">{st?.sent ?? 0}</td>
                      <td className="py-2.5 px-2 text-stone-700 dark:text-stone-200">{st?.replied ?? 0}</td>
                      <td className="py-2.5 px-2 font-semibold text-emerald-600 dark:text-emerald-400">{st?.selected ?? 0}</td>
                      <td className="py-2.5 px-2 text-stone-600 dark:text-stone-300 whitespace-nowrap">
                        {st?.avgResponseDays != null ? `${st.avgResponseDays.toFixed(1)} ימים` : '—'}
                      </td>
                      <td className="py-2.5 px-2 text-left">
                        <button onClick={() => setModal({ open: true, editingId: f.id })} className="text-stone-400 hover:text-amber-800 dark:hover:text-amber-400 text-sm">
                          ✎
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <QuickAddPopover
        open={modal.open}
        title={modal.editingId ? 'עריכת סוכנות' : 'סוכנות חדשה'}
        onClose={() => setModal({ open: false })}
        onSave={handleSave}
        onDelete={modal.editingId ? handleDelete : undefined}
        fields={AGENCY_FIELDS}
        initialValues={
          editing
            ? {
                name: editing.name,
                contactPerson: editing.contactPerson ?? '',
                email: editing.email ?? '',
                phone: editing.phone ?? '',
                capabilities: [editing.handlesAir && 'air', editing.handlesSea && 'sea', editing.handlesDG && 'dg'].filter(Boolean).join(','),
                paymentTermsDays: editing.paymentTermsDays?.toString() ?? '',
                paymentTermsBasis: editing.paymentTermsBasis ?? '',
                specialties: editing.specialties ?? '',
                notes: editing.notes ?? '',
                active: editing.active === false ? 'false' : 'true',
              }
            : undefined
        }
      />
    </div>
  )
}
