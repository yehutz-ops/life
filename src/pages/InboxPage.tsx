import { useState } from 'react'
import { useStore } from '../data/StoreContext'
import { domainList } from '../data/domains'
import { Card } from '../components/ui'
import { DomainId } from '../data/types'
import { todayISO } from '../utils/date'

export default function InboxPage() {
  const { items, assignDomain, toggleDone } = useStore()
  const inboxItems = items.filter((it) => !it.domain && it.status === 'open')
  const [drafts, setDrafts] = useState<Record<string, { domain: DomainId; date: string }>>({})

  function draftFor(id: string) {
    return drafts[id] ?? { domain: 'work' as DomainId, date: todayISO() }
  }

  function setDraft(id: string, patch: Partial<{ domain: DomainId; date: string }>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...draftFor(id), ...patch } }))
  }

  function handleAssign(id: string) {
    const d = draftFor(id)
    assignDomain(id, d.domain, d.date)
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">📥 תיבת כניסה</h1>
        <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">פריטים שהוספת מהר ועדיין לא שייכת לתחום. שייך כל אחד לתחום ותאריך, או סמן כלא רלוונטי.</p>
      </div>

      <div className="space-y-4">
        {inboxItems.map((it) => {
          const d = draftFor(it.id)
          return (
            <Card key={it.id}>
              <div className="text-sm font-medium text-stone-800 dark:text-stone-100 mb-3">{it.title}</div>
              <div className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2">
                <select
                  value={d.domain}
                  onChange={(e) => setDraft(it.id, { domain: e.target.value as DomainId })}
                  className="border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
                >
                  {domainList.map((dm) => (
                    <option key={dm.id} value={dm.id}>
                      {dm.icon} {dm.name}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={d.date}
                  onChange={(e) => setDraft(it.id, { date: e.target.value })}
                  className="border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-2 text-sm"
                />
                <button onClick={() => handleAssign(it.id)} className="px-4 py-2 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
                  שייך
                </button>
                <button
                  onClick={() => toggleDone(it.id)}
                  className="px-4 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-sm text-stone-500 dark:text-stone-400"
                >
                  לא רלוונטי
                </button>
              </div>
            </Card>
          )
        })}
        {inboxItems.length === 0 && (
          <Card>
            <p className="text-sm text-stone-400 dark:text-stone-500">תיבת הכניסה ריקה — כל הכבוד 🎉</p>
          </Card>
        )}
      </div>
    </div>
  )
}
