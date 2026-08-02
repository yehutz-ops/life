import { Link } from 'react-router-dom'
import { useStore } from '../data/StoreContext'
import { Card, EmptyLine } from '../components/ui'

export default function BrandsPage() {
  const { brands, brandProducts, brandContentItems } = useStore()

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">מותגים</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">כל המותגים שמנוהלים בתחום העבודה — שיתופי פעולה, תוכן וקמפיינים</p>
        </div>
        <Link to="/work/brands/import" className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
          ייבוא חבילת מותג
        </Link>
      </div>

      {brands.length === 0 ? (
        <Card>
          <EmptyLine text="עדיין אין מותגים במערכת. ייבוא חבילת מותג מקובץ JSON יוסיף כאן את המותג הראשון." />
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
    </div>
  )
}
