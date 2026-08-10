import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine } from '../components/ui'
import QuickAddPopover, { QuickAddField } from '../components/hub/QuickAddPopover'
import { TargetIcon, CalendarIcon, BulbIcon, CameraIcon, CompassIcon, WrenchIcon } from '../components/hub/hubIcons'

const CONTENT_TOOLS = [
  { to: '/work/today', label: 'התוכן להיום', icon: TargetIcon },
  { to: '/work/content-calendar', label: 'לוח תוכן', icon: CalendarIcon },
  { to: '/work/ideas', label: 'מאגר רעיונות', icon: BulbIcon },
  { to: '/work/scripts', label: 'תסריטים', icon: CameraIcon },
  { to: '/work/content-analytics', label: 'אנליטיקה', icon: CompassIcon },
  { to: '/work/creative-tools', label: 'כלי יצירה', icon: WrenchIcon },
]

const ADD_BRAND_FIELDS: QuickAddField[] = [
  { key: 'name', label: 'שם המותג', type: 'text', required: true },
  {
    key: 'priority',
    label: 'עדיפות',
    type: 'select',
    options: [
      { value: 'high', label: 'גבוהה' },
      { value: 'medium', label: 'בינונית' },
      { value: 'low', label: 'נמוכה' },
    ],
  },
  { key: 'country_of_origin', label: 'מדינת מקור', type: 'text', secondary: true },
  { key: 'website', label: 'אתר', type: 'text', secondary: true },
  { key: 'description', label: 'תיאור המותג', type: 'textarea', secondary: true },
  { key: 'notes', label: 'הערות', type: 'textarea', secondary: true },
]

export default function BrandsPage() {
  const { brands, brandProducts, brandContentItems, addBrand } = useStore()
  const [addOpen, setAddOpen] = useState(false)

  async function handleAddBrand(values: Record<string, string>) {
    await addBrand({
      name: values.name?.trim(),
      domain: 'work',
      fields: {
        priority: values.priority || undefined,
        country_of_origin: values.country_of_origin?.trim() || undefined,
        website: values.website?.trim() || undefined,
        description: values.description?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      },
    })
    setAddOpen(false)
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">מותגים</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">כל המותגים שמנוהלים בתחום העבודה — שיתופי פעולה, תוכן וקמפיינים</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setAddOpen(true)} className="px-4 py-2 rounded-xl border border-amber-800 text-amber-800 dark:text-amber-400 dark:border-amber-700 text-sm font-medium">
            + הוסף מותג
          </button>
          <Link to="/work/brands/import" className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            ייבוא חבילת מותג
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {CONTENT_TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {tool.label}
            </Link>
          )
        })}
      </div>

      {brands.length === 0 ? (
        <Card>
          <EmptyLine text="עדיין אין מותגים במערכת. אפשר להוסיף מותג ידנית או לייבא חבילת מותג מקובץ JSON." />
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {brands.map((b) => {
            const productCount = brandProducts.filter((p) => p.brandId === b.id).length
            const contentCount = brandContentItems.filter((c) => c.brandId === b.id).length
            return (
              <Link
                key={b.id}
                to={`/work/brands/${b.id}`}
                className="block bg-white dark:bg-stone-900 rounded-3xl border border-stone-200/70 dark:border-stone-800 shadow-sm shadow-stone-200/40 dark:shadow-none p-6 hover:border-amber-300 dark:hover:border-amber-800 transition-colors"
              >
                <div className="text-lg font-bold text-stone-900 dark:text-stone-100">{b.name}</div>
                {typeof b.fields.launch_status === 'string' && (
                  <div className="text-xs text-stone-400 dark:text-stone-500 mt-1">{b.fields.launch_status as string}</div>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-stone-600 dark:text-stone-300">
                  <span>{productCount} מוצרים</span>
                  <span>{contentCount} פריטי תוכן</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <QuickAddPopover open={addOpen} title="הוספת מותג" fields={ADD_BRAND_FIELDS} onClose={() => setAddOpen(false)} onSave={handleAddBrand} />
    </div>
  )
}
