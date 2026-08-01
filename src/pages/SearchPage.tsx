import { useState } from 'react'
import { useStore } from '../data/StoreContext'
import { Card } from '../components/ui'
import ItemRow from '../components/ItemRow'

export default function SearchPage() {
  const { items } = useStore()
  const [query, setQuery] = useState('')

  const results = query.trim() ? items.filter((it) => it.title.includes(query.trim())) : []

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">חיפוש</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          בשלב זה זהו חיפוש בסיסי לפי כותרת בלבד. חיפוש מלא (כולל הערות, אנשים ומסמכים) יגיע בהמשך.
        </p>
      </div>

      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="חפש לפי מילה מהכותרת..."
        className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-xl p-3 text-sm"
      />

      {query.trim() && (
        <Card className="!p-0 overflow-hidden">
          <ul className="divide-y divide-gray-50 dark:divide-gray-800 px-4">
            {results.map((it) => (
              <ItemRow key={it.id} item={it} />
            ))}
            {results.length === 0 && <li className="text-sm text-gray-400 dark:text-gray-500 py-4">לא נמצאו תוצאות</li>}
          </ul>
        </Card>
      )}
    </div>
  )
}
