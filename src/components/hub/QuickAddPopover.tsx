import { useEffect, useState } from 'react'

// שדה בטופס Quick Add — כללי במכוון, כדי שאותו רכיב ישרת בעתיד גם אימונים/פרויקטים/תחזוקה/ספרייה וכו',
// לא רק את ארבעת אזורי "ידע ותרבות". כל שימוש עתידי פשוט מזין fields שונים.
export interface QuickAddField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  secondary?: boolean
}

export default function QuickAddPopover({
  open,
  title,
  fields,
  onClose,
  onSave,
}: {
  open: boolean
  title: string
  fields: QuickAddField[]
  onClose: () => void
  onSave: (values: Record<string, string>) => void
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (open) {
      setValues({})
      setExpanded(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const primaryFields = fields.filter((f) => !f.secondary)
  const secondaryFields = fields.filter((f) => f.secondary)

  function set(key: string, value: string) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function handleSave() {
    const missingRequired = primaryFields.some((f) => f.required && !values[f.key]?.trim())
    if (missingRequired) return
    onSave(values)
  }

  function renderField(field: QuickAddField) {
    const value = values[field.key] ?? ''
    const commonClass =
      'w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2.5 text-sm placeholder:text-stone-400'

    if (field.type === 'select') {
      return (
        <select value={value} onChange={(e) => set(field.key, e.target.value)} className={commonClass}>
          <option value="">—</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )
    }
    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => set(field.key, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSave()
            }
          }}
          placeholder={field.placeholder}
          rows={2}
          className={`${commonClass} resize-none`}
        />
      )
    }
    return (
      <input
        type={field.type === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => set(field.key, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleSave()
          }
        }}
        placeholder={field.placeholder}
        className={commonClass}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-bold mb-4 text-stone-900 dark:text-stone-100">{title}</h3>

        <div className="space-y-3">
          {primaryFields.map((field) => (
            <div key={field.key}>
              <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">{field.label}</label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {secondaryFields.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-xs font-medium text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300"
            >
              {expanded ? '− פרטים נוספים' : '+ פרטים נוספים'}
            </button>
            {expanded && (
              <div className="space-y-3 mt-3">
                {secondaryFields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-stone-500 dark:text-stone-400 block mb-1">{field.label}</label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
            ביטול
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            שמור
          </button>
        </div>
      </div>
    </div>
  )
}
