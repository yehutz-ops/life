import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '../components/ui'
import { useStore } from '../data/StoreContext'
import { useNotify } from '../data/NotificationContext'
import { prepareBrandImport, commitBrandImport, PreparedImport, ImportReport } from '../data/brandImport/importBrandPackage'
import { CategoryBucket } from '../data/brandImport/buildPreview'

const ENTITY_LABELS: Record<string, string> = {
  products: 'מוצרים',
  campaigns: 'קמפיינים',
  contentItems: 'פריטי תוכן',
  pendingActivities: 'פעילויות ממתינות',
  mediaAssets: 'קבצי מדיה',
  tasks: 'משימות',
}

function CategoryRow({ label, bucket }: { label: string; bucket: CategoryBucket }) {
  const total = bucket.new.length + bucket.update.length + bucket.unchanged.length + bucket.conflict.length
  if (total === 0) return null
  return (
    <div className="flex items-center justify-between py-1.5 text-sm border-b border-stone-50 dark:border-stone-800 last:border-0">
      <span className="text-stone-700 dark:text-stone-200">{label}</span>
      <span className="text-xs text-stone-500 dark:text-stone-400 flex gap-3">
        {bucket.new.length > 0 && <span className="text-emerald-700 dark:text-emerald-400">{bucket.new.length} חדשים</span>}
        {bucket.update.length > 0 && <span className="text-amber-700 dark:text-amber-400">{bucket.update.length} מתעדכנים</span>}
        {bucket.unchanged.length > 0 && <span>{bucket.unchanged.length} ללא שינוי</span>}
        {bucket.conflict.length > 0 && <span className="text-red-700 dark:text-red-400 font-medium">{bucket.conflict.length} קונפליקט (שונו ידנית)</span>}
      </span>
    </div>
  )
}

export default function BrandImportPage() {
  const navigate = useNavigate()
  const { reloadFromDisk } = useStore()
  const notify = useNotify()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fileName, setFileName] = useState('')
  const [prepared, setPrepared] = useState<PreparedImport | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [checking, setChecking] = useState(false)
  const [allowOverwrite, setAllowOverwrite] = useState(false)
  const [importing, setImporting] = useState(false)
  const [report, setReport] = useState<ImportReport | null>(null)

  function reset() {
    setFileName('')
    setPrepared(null)
    setErrors([])
    setReport(null)
    setAllowOverwrite(false)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    reset()
    setFileName(file.name)
    setChecking(true)
    try {
      const text = await file.text()
      let raw: unknown
      try {
        raw = JSON.parse(text)
      } catch {
        setErrors(['הקובץ אינו JSON תקין — לא ניתן לקרוא אותו.'])
        return
      }
      const result = await prepareBrandImport(raw)
      if (!result.valid) {
        setErrors(result.errors)
      } else {
        setPrepared(result)
      }
    } catch (err: any) {
      setErrors([`שגיאה בקריאת הקובץ: ${err.message ?? err}`])
    } finally {
      setChecking(false)
    }
  }

  async function handleImport() {
    if (!prepared) return
    setImporting(true)
    try {
      const r = await commitBrandImport(prepared, { allowOverwriteConflicts: allowOverwrite })
      setReport(r)
      await reloadFromDisk()
      notify(`ייבוא ${r.brandName} הושלם`, 'success')
    } catch (err: any) {
      notify(`הייבוא נכשל ולא בוצע שום שינוי: ${err.message ?? err}`, 'error')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link to="/work/brands" className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
          ← כל המותגים
        </Link>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 mt-1">ייבוא חבילת מותג</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">
          קובץ JSON כללי (brand_knowledge_package) — עובד לכל מותג, לא רק FOMOWA. תמיד: בדיקה ← Preview ← אישור ← כתיבה.
        </p>
      </div>

      {!report && (
        <Card>
          <label className="text-xs text-stone-500 dark:text-stone-400 block mb-2">בחר קובץ JSON</label>
          <input ref={fileInputRef} type="file" accept="application/json" onChange={handleFile} className="text-sm" />
          {checking && <p className="text-sm text-stone-500 dark:text-stone-400 mt-3">בודק את הקובץ...</p>}
        </Card>
      )}

      {errors.length > 0 && !report && (
        <Card className="!border-red-200 dark:!border-red-900">
          <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">הקובץ לא עבר בדיקה — לא בוצע שום ייבוא</h2>
          <ul className="text-sm text-red-700 dark:text-red-400 list-disc pr-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Card>
      )}

      {prepared && !report && (
        <>
          <Card>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">Preview — {prepared.preview.brandName}</h2>
            <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">
              {fileName} · {prepared.preview.brandIsNew ? 'מותג חדש במערכת' : 'מותג קיים — זו עדכון'}
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center mb-4">
              {(
                [
                  ['מוצרים', prepared.preview.counts.products],
                  ['קמפיינים', prepared.preview.counts.campaigns],
                  ['פריטי תוכן', prepared.preview.counts.contentItems],
                  ['משימות', prepared.preview.counts.tasks],
                  ['קבצי מדיה', prepared.preview.counts.mediaAssets],
                  ['פעילויות ממתינות', prepared.preview.counts.pendingActivities],
                ] as [string, number][]
              ).map(([label, val]) => (
                <div key={label} className="bg-stone-50 dark:bg-stone-800 rounded-xl py-2.5">
                  <div className="text-lg font-bold text-stone-800 dark:text-stone-100">{val}</div>
                  <div className="text-xs text-stone-400 dark:text-stone-500">{label}</div>
                </div>
              ))}
            </div>

            <div className="border-t border-stone-100 dark:border-stone-800 pt-3">
              {Object.entries(prepared.preview.categories)
                .filter(([key]) => key !== 'brand')
                .map(([key, bucket]) => (
                  <CategoryRow key={key} label={ENTITY_LABELS[key] ?? key} bucket={bucket as CategoryBucket} />
                ))}
            </div>
          </Card>

          {prepared.preview.missingInformation.length > 0 && (
            <Card>
              <h2 className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">מידע שחסר במקור (לא יושלם בניחוש)</h2>
              <ul className="text-sm text-stone-500 dark:text-stone-400 list-disc pr-5 space-y-1">
                {prepared.preview.missingInformation.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </Card>
          )}

          {prepared.preview.validatorWarnings.length > 0 && (
            <Card className="!border-amber-200 dark:!border-amber-900">
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2">אזהרות</h2>
              <ul className="text-sm text-amber-800 dark:text-amber-400 list-disc pr-5 space-y-1">
                {prepared.preview.validatorWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </Card>
          )}

          {prepared.preview.hasConflicts && (
            <Card className="!border-red-200 dark:!border-red-900">
              <h2 className="text-sm font-bold text-red-700 dark:text-red-400 mb-2">נמצאו רשומות ששונו ידנית מאז ייבוא קודם</h2>
              <p className="text-sm text-stone-600 dark:text-stone-300 mb-3">
                כברירת מחדל הן לא יידרסו. אפשר לבחור לדרוס אותן בכל זאת בייבוא הזה:
              </p>
              <label className="flex items-center gap-2 text-sm text-stone-700 dark:text-stone-200">
                <input type="checkbox" checked={allowOverwrite} onChange={(e) => setAllowOverwrite(e.target.checked)} className="accent-red-700" />
                דרוס גם רשומות עם שינויים ידניים
              </label>
            </Card>
          )}

          <Card>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-3">
              לפני הכתיבה יורד אוטומטית קובץ גיבוי של המידע הקיים. הכתיבה עצמה היא פעולה אחת אטומית — אם משהו נכשל, שום דבר לא נכתב.
            </p>
            <div className="flex gap-2">
              <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300">
                ביטול
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900 disabled:opacity-50"
              >
                {importing ? 'מייבא...' : 'אשר ובצע ייבוא'}
              </button>
            </div>
          </Card>
        </>
      )}

      {report && (
        <Card>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">הייבוא הושלם — {report.brandName}</h2>
          <p className="text-xs text-stone-400 dark:text-stone-500 mb-4">{report.backupCreated ? 'קובץ גיבוי הורד לפני הכתיבה.' : ''}</p>
          <div className="grid grid-cols-4 gap-2 text-sm mb-4">
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center">
              <div className="font-bold text-emerald-700 dark:text-emerald-400">{Object.values(report.added).reduce((a, b) => a + b, 0)}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500">נוספו</div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center">
              <div className="font-bold text-amber-700 dark:text-amber-400">{Object.values(report.updated).reduce((a, b) => a + b, 0)}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500">עודכנו</div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center">
              <div className="font-bold text-stone-600 dark:text-stone-300">{Object.values(report.unchanged).reduce((a, b) => a + b, 0)}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500">ללא שינוי</div>
            </div>
            <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 text-center">
              <div className="font-bold text-red-700 dark:text-red-400">{Object.values(report.skippedDueToManualEdit).reduce((a, b) => a + b, 0)}</div>
              <div className="text-xs text-stone-400 dark:text-stone-500">דולגו (קונפליקט)</div>
            </div>
          </div>
          {report.warnings.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-1">אזהרות מהבדיקה המקורית</div>
              <ul className="text-sm text-amber-800 dark:text-amber-400 list-disc pr-5 space-y-1">
                {report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={reset} className="px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-600 dark:text-stone-300">
              ייבוא נוסף
            </button>
            <button onClick={() => navigate(`/work/brands/${report.brandId}`)} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
              לעמוד המותג
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
