import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { useNotify } from '../data/NotificationContext'
import { Card } from '../components/ui'
import { TruckIcon } from '../components/hub/hubIcons'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { todayISO } from '../utils/date'
import { ShippingMode, ShipmentDocCategory, Forwarder } from '../data/shipmentTypes'
import { getAiEnabled } from '../ai/aiSettings'
import { checkAiHealth } from '../ai/aiClient'
import { extractShipmentDetails, ShipmentExtractError, ShipmentExtractResult, ShipmentFieldResult } from '../ai/shipmentExtract'

const SHIPPING_MODE_LABEL: Record<ShippingMode, string> = { air: 'אווירי', sea: 'ימי', other: 'אחר' }
const SHIPPING_MODE_LABEL_EN: Record<ShippingMode, string> = { air: 'Air freight', sea: 'Sea freight', other: 'Other' }

interface RfqDocCategoryDef {
  key: ShipmentDocCategory
  label: string
  labelEn: string
}
const RFQ_DOC_CATEGORIES: RfqDocCategoryDef[] = [
  { key: 'invoice', label: 'Commercial Invoice', labelEn: 'Commercial Invoice' },
  { key: 'packing_list', label: 'Packing List', labelEn: 'Packing List' },
  { key: 'msds_sds', label: 'MSDS / SDS', labelEn: 'MSDS / SDS' },
  { key: 'other', label: 'מסמך נוסף', labelEn: 'Other document' },
]

interface LocalDoc {
  id: string
  category: ShipmentDocCategory
  file: File
}

const SUPPORTED_EXTRACT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif']

const EXTRACT_STRING_KEYS = [
  'name', 'originCountry', 'originCity', 'supplierName', 'pickupAddress', 'contactPerson',
  'contactEmail', 'contactPhone', 'readyDate', 'cartons', 'weight', 'dimensions', 'palletCount', 'goodsType',
] as const
const EXTRACT_BOOL_KEYS = ['onPallet', 'isDangerousGoods'] as const

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

// תגית מקור/חוסר/סתירה מתחת לשדה — הליבה של מסך ה-Review: לעולם לא ממציא ערך, ותמיד אפשר לערוך ידנית.
function FieldHint({ meta, onPick }: { meta?: ShipmentFieldResult; onPick: (value: string, source: string) => void }) {
  if (!meta) return null
  if (meta.status === 'extracted' && meta.source) {
    return <div className="text-[11px] text-violet-700 dark:text-violet-400 mt-1">✨ מקור: {meta.source}</div>
  }
  if (meta.status === 'missing') {
    return <div className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">חסר — לא נמצא במקורות שצורפו</div>
  }
  if (meta.status === 'conflict' && meta.conflicts.length > 0) {
    return (
      <div className="mt-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-2">
        <div className="text-[11px] text-amber-800 dark:text-amber-400 mb-1.5">⚠ נמצאה סתירה בין מקורות — לבחור ערך:</div>
        <div className="flex flex-wrap gap-1.5">
          {meta.conflicts.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(c.value, c.source)}
              className="text-[11px] px-2 py-1 rounded-full bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950"
            >
              {c.value} · {c.source}
            </button>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface FormState {
  name: string
  originCountry: string
  originCity: string
  shippingMode: ShippingMode
  readyDate: string
  cartons: string
  weight: string
  dimensions: string
  onPallet: boolean
  palletCount: string
  goodsType: string
  isDangerousGoods: boolean
  supplierName: string
  pickupAddress: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  notes: string
}

const EMPTY_FORM: FormState = {
  name: '',
  originCountry: '',
  originCity: '',
  shippingMode: 'air',
  readyDate: '',
  cartons: '',
  weight: '',
  dimensions: '',
  onPallet: false,
  palletCount: '',
  goodsType: '',
  isDangerousGoods: false,
  supplierName: '',
  pickupAddress: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  notes: '',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function buildSubject(form: FormState): string {
  return `Request for Shipping Quotation – ${form.name.trim() || 'New Shipment'}`
}

function buildBody(form: FormState, docs: LocalDoc[]): string {
  const lines = [
    'Dear Sir/Madam,',
    '',
    'We would like to request a shipping quotation for the following cargo:',
    '',
    `Origin: ${[form.originCity, form.originCountry].filter(Boolean).join(', ') || '-'}`,
    `Shipping mode: ${SHIPPING_MODE_LABEL_EN[form.shippingMode]}`,
    `Ready date: ${form.readyDate || '-'}`,
    '',
    'Pickup details:',
    `Company: ${form.supplierName || '-'}`,
    `Address: ${form.pickupAddress || '-'}`,
    `Contact: ${form.contactPerson || '-'}${form.contactEmail ? ` (${form.contactEmail})` : ''}${form.contactPhone ? `, ${form.contactPhone}` : ''}`,
    '',
    'Cargo:',
    `Boxes: ${form.cartons || '-'}`,
    `Weight: ${form.weight ? `${form.weight} kg` : '-'}`,
    `Dimensions / Volume: ${form.dimensions || '-'}`,
    `Pallets: ${form.onPallet ? form.palletCount || 'Yes' : 'No'}`,
    `Goods type: ${form.goodsType || '-'}`,
    `Dangerous Goods (DG): ${form.isDangerousGoods ? 'Yes' : 'No'}`,
    '',
    `Attached documents: ${docs.length > 0 ? docs.map((d) => RFQ_DOC_CATEGORIES.find((c) => c.key === d.category)?.labelEn ?? d.category).join(', ') : 'none'}`,
    '',
    'Please send your quotation at your earliest convenience.',
    '',
    'Best regards,',
  ]
  return lines.join('\n')
}

const AGENCY_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם החברה', type: 'text', required: true },
  { key: 'contactPerson', label: 'איש קשר', type: 'text' },
  { key: 'email', label: 'Email', type: 'text', required: true },
  { key: 'phone', label: 'טלפון', type: 'text', secondary: true },
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

export default function NewShipmentRequestPage() {
  const { forwarders, addForwarder, updateForwarder, addShipment, addShipmentDocument, addShipmentTimelineEvent } = useStore()
  const notify = useNotify()
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [docs, setDocs] = useState<LocalDoc[]>([])
  const fileInputRefs = useRef<Record<ShipmentDocCategory, HTMLInputElement | null>>({} as Record<ShipmentDocCategory, HTMLInputElement | null>)

  const intakeInputRef = useRef<HTMLInputElement>(null)
  const [pastedText, setPastedText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [fieldMeta, setFieldMeta] = useState<Partial<Record<keyof FormState, ShipmentFieldResult>>>({})
  const [aiEnabled] = useState(getAiEnabled())
  const [aiHealthy, setAiHealthy] = useState<boolean | null>(null)

  useEffect(() => {
    checkAiHealth().then(setAiHealthy)
  }, [])

  const [selectionMode, setSelectionMode] = useState<'all-active' | 'manual'>('all-active')
  const [manualSelectedIds, setManualSelectedIds] = useState<string[]>([])
  const [agencyModal, setAgencyModal] = useState<{ open: boolean; editingId?: string }>({ open: false })

  const [subject, setSubject] = useState(buildSubject(EMPTY_FORM))
  const [body, setBody] = useState(buildBody(EMPTY_FORM, []))
  const [subjectEdited, setSubjectEdited] = useState(false)
  const [bodyEdited, setBodyEdited] = useState(false)

  useEffect(() => {
    if (!subjectEdited) setSubject(buildSubject(form))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.name, subjectEdited])

  useEffect(() => {
    if (!bodyEdited) setBody(buildBody(form, docs))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, docs, bodyEdited])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
    // עריכה ידנית מבטלת את תגית "חולץ אוטומטית" של השדה — הערך הופך לערך שהמשתמש קבע.
    setFieldMeta((m) => {
      if (!(key in m)) return m
      const next = { ...m }
      delete next[key]
      return next
    })
  }

  function applyFieldValue<K extends keyof FormState>(key: K, value: string, source: string) {
    setForm((f) => ({ ...f, [key]: (key === 'onPallet' || key === 'isDangerousGoods' ? value === 'true' : value) as FormState[K] }))
    setFieldMeta((m) => ({ ...m, [key]: { value, status: 'extracted', source, conflicts: [] } }))
  }

  const activeForwarders = forwarders.filter((f) => f.active !== false)
  const selectedForwarders = selectionMode === 'all-active' ? activeForwarders : forwarders.filter((f) => manualSelectedIds.includes(f.id))

  function toggleManual(id: string) {
    setManualSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleFilePicked(category: ShipmentDocCategory, files: FileList | null) {
    if (!files || files.length === 0) return
    const newDocs: LocalDoc[] = Array.from(files).map((file) => ({ id: `${Date.now()}-${Math.random()}`, category, file }))
    setDocs((prev) => [...prev, ...newDocs])
  }

  function removeDoc(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
  }

  function handleIntakeFilesPicked(files: FileList | null) {
    if (!files || files.length === 0) return
    const newDocs: LocalDoc[] = Array.from(files).map((file) => ({ id: `${Date.now()}-${Math.random()}`, category: 'other', file }))
    setDocs((prev) => [...prev, ...newDocs])
  }

  function applyExtractionResult(result: ShipmentExtractResult) {
    const meta: Partial<Record<keyof FormState, ShipmentFieldResult>> = {}
    setForm((f) => {
      const next = { ...f }
      for (const key of EXTRACT_STRING_KEYS) {
        const fr = result[key]
        if (!fr) continue
        meta[key] = fr
        if (fr.status === 'extracted' && fr.value) next[key] = fr.value
      }
      for (const key of EXTRACT_BOOL_KEYS) {
        const fr = result[key]
        if (!fr) continue
        meta[key] = fr
        if (fr.status === 'extracted' && fr.value != null) next[key] = fr.value === 'true'
      }
      return next
    })
    setFieldMeta(meta)
    setDocs((prev) =>
      prev.map((d) => {
        const guess = result.documentGuesses.find((g) => g.fileName === d.file.name)
        return guess ? { ...d, category: guess.category } : d
      }),
    )
  }

  async function handleExtract() {
    if (docs.length === 0 && !pastedText.trim()) {
      notify('נא לצרף קובץ אחד לפחות או להדביק טקסט', 'error')
      return
    }
    setExtracting(true)
    setExtractError('')
    try {
      const supportedDocs = docs.filter((d) => SUPPORTED_EXTRACT_TYPES.includes(d.file.type))
      const encodedFiles = await Promise.all(
        supportedDocs.map(async (d) => ({ fileName: d.file.name, mediaType: d.file.type, base64: await fileToBase64(d.file) })),
      )
      const result = await extractShipmentDetails(encodedFiles, pastedText.trim())
      applyExtractionResult(result)
      notify('הנתונים חולצו — אפשר לבדוק ולתקן למטה לפני השליחה', 'success')
    } catch (e: any) {
      setExtractError(e instanceof ShipmentExtractError ? e.message : 'משהו השתבש בזמן החילוץ. אפשר לנסות שוב, או למלא ידנית.')
    } finally {
      setExtracting(false)
    }
  }

  function agencyInitialValues(f?: Forwarder): Record<string, string> {
    if (!f) return { active: 'true' }
    return { name: f.name, contactPerson: f.contactPerson ?? '', email: f.email ?? '', phone: f.phone ?? '', active: f.active === false ? 'false' : 'true' }
  }

  async function handleSaveAgency(values: Record<string, string>) {
    const data = {
      name: values.name?.trim(),
      contactPerson: values.contactPerson?.trim() || undefined,
      email: values.email?.trim() || undefined,
      phone: values.phone?.trim() || undefined,
      active: values.active !== 'false',
    }
    if (agencyModal.editingId) await updateForwarder(agencyModal.editingId, data)
    else await addForwarder(data)
    setAgencyModal({ open: false })
  }

  async function handleToggleActive(f: Forwarder) {
    await updateForwarder(f.id, { active: f.active === false })
  }

  async function handleReady() {
    if (!form.name.trim()) {
      notify('נא להזין שם/כותרת למשלוח', 'error')
      return
    }
    if (selectedForwarders.length === 0) {
      notify('נא לבחור לפחות סוכנות אחת לקבלת הבקשה', 'error')
      return
    }

    const shipment = await addShipment({
      name: form.name.trim(),
      originCountry: form.originCountry.trim() || undefined,
      originCity: form.originCity.trim() || undefined,
      shippingMode: form.shippingMode,
      requestedPickupDate: form.readyDate || undefined,
      cartons: form.cartons ? Number(form.cartons) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      dimensions: form.dimensions.trim() || undefined,
      onPallet: form.onPallet,
      palletCount: form.onPallet && form.palletCount ? Number(form.palletCount) : undefined,
      goodsType: form.goodsType.trim() || undefined,
      isDangerousGoods: form.isDangerousGoods,
      supplierName: form.supplierName.trim() || undefined,
      pickupAddress: form.pickupAddress.trim() || undefined,
      contactPerson: form.contactPerson.trim() || undefined,
      contactEmail: form.contactEmail.trim() || undefined,
      contactPhone: form.contactPhone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      requestedForwarderIds: selectedForwarders.map((f) => f.id),
      status: 'waiting_for_quotes',
    })

    await Promise.all(
      docs.map((d) =>
        addShipmentDocument({
          shipmentId: shipment.id,
          category: d.category,
          name: d.file.name,
          fileName: d.file.name,
          fileType: d.file.type,
          fileSize: d.file.size,
          fileData: d.file,
        }),
      ),
    )

    await addShipmentTimelineEvent({
      shipmentId: shipment.id,
      stage: 'rfq_sent',
      date: todayISO(),
      notes: `בקשת הצעת מחיר הוכנה עבור: ${selectedForwarders.map((f) => f.name).join(', ')}`,
    })

    notify('הבקשה נשמרה ומוכנה לשליחה. חיבור תיבת המייל של המערכת יאפשר שליחה אוטומטית בעתיד.', 'success')
    navigate(`/work/shipments/${shipment.id}`)
  }

  const inputClass = 'w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2.5 text-sm placeholder:text-stone-400'
  const labelClass = 'text-xs text-stone-500 dark:text-stone-400 block mb-1'

  return (
    <div className="space-y-6 pb-24 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          to="/work/shipments"
          className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
          aria-label="חזרה למשלוחים"
          title="חזרה למשלוחים"
        >
          ←
        </Link>
        <div className="flex items-center gap-2">
          <TruckIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">בקשת הצעת מחיר חדשה</h1>
        </div>
      </div>

      {/* העלה את פרטי המשלוח — AI Intake */}
      <Card className="!border-violet-200 dark:!border-violet-900 !bg-violet-50/40 dark:!bg-violet-950/10">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">✨</span>
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">העלה את פרטי המשלוח</h2>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 mb-4">
          צרף/י PDF, Invoice, Packing List, MSDS/SDS, תמונה או צילום מסך, ו/או הדביק/י טקסט — Claude יקרא הכול ביחד וימלא אוטומטית את השדות למטה, שיהפכו למסך בדיקה ואישור. אפשר גם להמשיך במילוי ידני רגיל.
        </p>

        {!aiEnabled && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">חיבור Claude AI כבוי בהגדרות המערכת — אפשר למלא את הטופס ידנית למטה.</p>
        )}
        {aiEnabled && aiHealthy === false && (
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">חיבור Claude AI עדיין לא הוגדר במערכת — אפשר למלא את הטופס ידנית למטה.</p>
        )}

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            type="button"
            onClick={() => intakeInputRef.current?.click()}
            className="px-4 py-2.5 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-800 text-sm text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30"
          >
            📎 צרף קבצים
          </button>
          <input
            ref={intakeInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => {
              handleIntakeFilesPicked(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {docs.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {docs.map((d) => (
              <span
                key={d.id}
                className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300"
              >
                {d.file.name}
                <button onClick={() => removeDoc(d.id)} className="text-stone-300 hover:text-red-500" aria-label="הסר">
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="mb-3">
          <label className={labelClass}>או הדביק/י טקסט (מייל, הודעה, טבלה)</label>
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={4}
            dir="auto"
            placeholder="לדוגמה: תוכן מייל מהספק עם פרטי המשלוח..."
            className={`${inputClass} resize-none`}
          />
        </div>

        <button
          type="button"
          onClick={handleExtract}
          disabled={extracting || !aiEnabled || aiHealthy === false}
          className="px-5 py-2.5 rounded-xl bg-violet-700 text-white text-sm font-medium hover:bg-violet-800 disabled:opacity-50"
        >
          {extracting ? 'קורא ומחלץ נתונים...' : '✨ חלץ נתונים אוטומטית'}
        </button>

        {extractError && <p className="text-xs text-red-600 dark:text-red-400 mt-2">{extractError}</p>}
      </Card>

      {/* 1. פרטי המשלוח */}
      <Card>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">פרטי המשלוח</h2>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>שם / כותרת למשלוח</label>
            <input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="לדוגמה: משלוח בשמים — ספטמבר" dir="auto" className={inputClass} />
            <FieldHint meta={fieldMeta.name} onPick={(v, s) => applyFieldValue('name', v, s)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>מדינת מוצא</label>
              <input value={form.originCountry} onChange={(e) => set('originCountry', e.target.value)} dir="auto" className={inputClass} />
              <FieldHint meta={fieldMeta.originCountry} onPick={(v, s) => applyFieldValue('originCountry', v, s)} />
            </div>
            <div>
              <label className={labelClass}>עיר / מקום איסוף</label>
              <input value={form.originCity} onChange={(e) => set('originCity', e.target.value)} dir="auto" className={inputClass} />
              <FieldHint meta={fieldMeta.originCity} onPick={(v, s) => applyFieldValue('originCity', v, s)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>סוג שילוח</label>
              <select value={form.shippingMode} onChange={(e) => set('shippingMode', e.target.value as ShippingMode)} className={inputClass}>
                <option value="air">אווירי</option>
                <option value="sea">ימי</option>
                <option value="other">אחר</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>תאריך מוכנות לאיסוף</label>
              <input type="date" value={form.readyDate} onChange={(e) => set('readyDate', e.target.value)} className={inputClass} />
              <FieldHint meta={fieldMeta.readyDate} onPick={(v, s) => applyFieldValue('readyDate', v, s)} />
            </div>
          </div>
        </div>
      </Card>

      {/* 2. פרטי המטען */}
      <Card>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">פרטי המטען</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>מספר ארגזים</label>
              <input type="number" value={form.cartons} onChange={(e) => set('cartons', e.target.value)} className={inputClass} />
              <FieldHint meta={fieldMeta.cartons} onPick={(v, s) => applyFieldValue('cartons', v, s)} />
            </div>
            <div>
              <label className={labelClass}>משקל כולל (ק"ג)</label>
              <input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} className={inputClass} />
              <FieldHint meta={fieldMeta.weight} onPick={(v, s) => applyFieldValue('weight', v, s)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>מידות / נפח (אם ידועים)</label>
            <input value={form.dimensions} onChange={(e) => set('dimensions', e.target.value)} dir="auto" className={inputClass} />
            <FieldHint meta={fieldMeta.dimensions} onPick={(v, s) => applyFieldValue('dimensions', v, s)} />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                <input type="checkbox" checked={form.onPallet} onChange={(e) => set('onPallet', e.target.checked)} className="accent-amber-800 w-4 h-4" />
                המשלוח על פלטה
              </label>
              {form.onPallet && (
                <input
                  type="number"
                  value={form.palletCount}
                  onChange={(e) => set('palletCount', e.target.value)}
                  placeholder="מספר פלטות"
                  className="w-32 border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
                />
              )}
            </div>
            <FieldHint meta={fieldMeta.onPallet} onPick={(v, s) => applyFieldValue('onPallet', v, s)} />
            {form.onPallet && <FieldHint meta={fieldMeta.palletCount} onPick={(v, s) => applyFieldValue('palletCount', v, s)} />}
          </div>
          <div>
            <label className={labelClass}>סוג הסחורה</label>
            <input value={form.goodsType} onChange={(e) => set('goodsType', e.target.value)} placeholder="לדוגמה: בשמים" dir="auto" className={inputClass} />
            <FieldHint meta={fieldMeta.goodsType} onPick={(v, s) => applyFieldValue('goodsType', v, s)} />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
              <input type="checkbox" checked={form.isDangerousGoods} onChange={(e) => set('isDangerousGoods', e.target.checked)} className="accent-amber-800 w-4 h-4" />
              Dangerous Goods / DG
            </label>
            <FieldHint meta={fieldMeta.isDangerousGoods} onPick={(v, s) => applyFieldValue('isDangerousGoods', v, s)} />
          </div>
        </div>
      </Card>

      {/* 3. פרטי האיסוף / הספק */}
      <Card>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">פרטי האיסוף / הספק</h2>
        <div className="space-y-3">
          <div>
            <label className={labelClass}>שם החברה / הספק</label>
            <input value={form.supplierName} onChange={(e) => set('supplierName', e.target.value)} dir="auto" className={inputClass} />
            <FieldHint meta={fieldMeta.supplierName} onPick={(v, s) => applyFieldValue('supplierName', v, s)} />
          </div>
          <div>
            <label className={labelClass}>כתובת מלאה לאיסוף</label>
            <input value={form.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} dir="auto" className={inputClass} />
            <FieldHint meta={fieldMeta.pickupAddress} onPick={(v, s) => applyFieldValue('pickupAddress', v, s)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>איש קשר</label>
              <input value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} dir="auto" className={inputClass} />
              <FieldHint meta={fieldMeta.contactPerson} onPick={(v, s) => applyFieldValue('contactPerson', v, s)} />
            </div>
            <div>
              <label className={labelClass}>אימייל</label>
              <input value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} dir="ltr" className={inputClass} />
              <FieldHint meta={fieldMeta.contactEmail} onPick={(v, s) => applyFieldValue('contactEmail', v, s)} />
            </div>
            <div>
              <label className={labelClass}>טלפון</label>
              <input value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} dir="ltr" className={inputClass} />
              <FieldHint meta={fieldMeta.contactPhone} onPick={(v, s) => applyFieldValue('contactPhone', v, s)} />
            </div>
          </div>
        </div>
      </Card>

      {/* 4. מסמכים */}
      <Card>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-4">מסמכים</h2>
        <div className="space-y-4">
          {RFQ_DOC_CATEGORIES.map((cat) => {
            const catDocs = docs.filter((d) => d.category === cat.key)
            return (
              <div key={cat.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-stone-600 dark:text-stone-300">{cat.label}</span>
                  <button
                    onClick={() => fileInputRefs.current[cat.key]?.click()}
                    className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline"
                  >
                    + הוסף קובץ
                  </button>
                  <input
                    ref={(el) => (fileInputRefs.current[cat.key] = el)}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      handleFilePicked(cat.key, e.target.files)
                      e.target.value = ''
                    }}
                  />
                </div>
                {catDocs.length === 0 ? (
                  <div className="text-xs text-stone-300 dark:text-stone-600">לא צורף קובץ</div>
                ) : (
                  <ul className="space-y-1.5">
                    {catDocs.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-2 bg-stone-50 dark:bg-stone-800 rounded-xl px-3 py-2 text-xs">
                        <span className="text-stone-700 dark:text-stone-200 truncate">
                          {d.file.name}
                          {!SUPPORTED_EXTRACT_TYPES.includes(d.file.type) && (
                            <span className="text-stone-400 dark:text-stone-500"> · לא נקרא אוטומטית</span>
                          )}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-stone-400 dark:text-stone-500">{formatFileSize(d.file.size)}</span>
                          <button onClick={() => removeDoc(d.id)} className="text-stone-300 hover:text-red-500" aria-label="הסר">
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* 5. סוכנויות לקבלת הצעת מחיר */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100">סוכנויות לקבלת הצעת מחיר</h2>
          <button onClick={() => setAgencyModal({ open: true })} className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline">
            + הוסף סוכנות
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setSelectionMode('all-active')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectionMode === 'all-active' ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-stone-500 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700'
            }`}
          >
            שלח לכל הסוכנויות הפעילות ({activeForwarders.length})
          </button>
          <button
            onClick={() => setSelectionMode('manual')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectionMode === 'manual' ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-stone-500 border-stone-200 dark:bg-stone-900 dark:text-stone-400 dark:border-stone-700'
            }`}
          >
            בחירה ידנית
          </button>
        </div>

        {forwarders.length === 0 ? (
          <p className="text-xs text-stone-400 dark:text-stone-500">עדיין אין סוכנויות שמורות — הוסף את הראשונה למעלה.</p>
        ) : (
          <ul className="divide-y divide-stone-50 dark:divide-stone-800">
            {forwarders.map((f) => {
              const isActive = f.active !== false
              const checked = selectionMode === 'all-active' ? isActive : manualSelectedIds.includes(f.id)
              return (
                <li key={f.id} className="py-2.5 flex items-center gap-3">
                  {selectionMode === 'manual' ? (
                    <input type="checkbox" checked={checked} onChange={() => toggleManual(f.id)} className="accent-amber-800 w-4 h-4 shrink-0" />
                  ) : (
                    <span className={`w-4 h-4 rounded shrink-0 ${checked ? 'bg-amber-800' : 'bg-stone-100 dark:bg-stone-800'}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-stone-800 dark:text-stone-100 truncate">{f.name}</div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 truncate">
                      {[f.contactPerson, f.email, f.phone].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleActive(f)}
                    className={`text-[11px] font-medium px-2 py-1 rounded-full shrink-0 ${
                      isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400'
                    }`}
                  >
                    {isActive ? 'פעיל' : 'לא פעיל'}
                  </button>
                  <button
                    onClick={() => setAgencyModal({ open: true, editingId: f.id })}
                    className="text-xs font-medium text-amber-800 dark:text-amber-400 hover:underline shrink-0"
                  >
                    ערוך
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* 6. Preview לפני שליחה */}
      <Card>
        <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-1">תצוגה מקדימה של המייל</h2>
        <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">כל סוכנות תקבל מייל נפרד עם אותו תוכן — לא CC משותף.</p>

        <div className="space-y-3">
          <div>
            <label className={labelClass}>Subject</label>
            <input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value)
                setSubjectEdited(true)
              }}
              dir="ltr"
              className={`${inputClass} text-left`}
            />
          </div>
          <div>
            <label className={labelClass}>Body</label>
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value)
                setBodyEdited(true)
              }}
              dir="ltr"
              rows={14}
              className={`${inputClass} text-left resize-none font-mono text-xs leading-relaxed`}
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
          <div className="text-xs text-stone-500 dark:text-stone-400 mb-2">ייכתב מייל נפרד לכל אחת מהסוכנויות הבאות:</div>
          {selectedForwarders.length === 0 ? (
            <p className="text-xs text-stone-300 dark:text-stone-600">לא נבחרו סוכנויות</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {selectedForwarders.map((f) => (
                <span key={f.id} className="text-[11px] px-2.5 py-1 rounded-full bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-300">
                  {f.name} {f.email ? `· ${f.email}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 7. שליחה */}
      <div className="flex items-center gap-3">
        <button onClick={handleReady} className="px-5 py-3 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          ✓ הבקשה מוכנה לשליחה
        </button>
        <Link to="/work/shipments" className="px-5 py-3 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
          ביטול
        </Link>
      </div>
      <p className="text-xs text-stone-400 dark:text-stone-500">
        השליחה בפועל תתאפשר לאחר חיבור תיבת המייל של המערכת. כרגע הבקשה תישמר ותופיע כמוכנה במעקב המשלוחים.
      </p>

      <QuickAddPopover
        open={agencyModal.open}
        title={agencyModal.editingId ? 'עריכת סוכנות' : 'הוספת סוכנות'}
        fields={AGENCY_FIELDS}
        initialValues={agencyInitialValues(forwarders.find((f) => f.id === agencyModal.editingId))}
        onClose={() => setAgencyModal({ open: false })}
        onSave={handleSaveAgency}
      />
    </div>
  )
}
