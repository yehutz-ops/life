import { useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { useSpeechToText } from '../hooks/useSpeechToText'
import { DomainBadge } from './ui'

export default function QuickCaptureBar() {
  const { items, addInboxEntry } = useStore()
  const { openEdit } = useDetailModal()
  const [text, setText] = useState('')
  const [usedMic, setUsedMic] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const { isListening, isSupported, error, toggle } = useSpeechToText((transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    setUsedMic(true)
  })

  const matches = useMemo(() => {
    const q = text.trim()
    if (!q) return []
    return items.filter((it) => it.title.includes(q)).slice(0, 5)
  }, [text, items])

  const isSearching = matches.length > 0

  async function handleAdd() {
    if (!text.trim()) return
    await addInboxEntry(text.trim(), usedMic ? 'spoken' : 'typed')
    setText('')
    setUsedMic(false)
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 2200)
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            // Enter לא שומר פריט חדש בטעות — ההוספה קורית רק דרך כפתור הפלוס.
            if (e.key === 'Enter') e.preventDefault()
          }}
          placeholder="כתוב או אמור משהו שצריך לזכור..."
          className="w-full rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-4 pr-6 pl-28 text-base shadow-sm shadow-stone-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900"
        />
        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          <button
            onClick={toggle}
            title="הקלטה קולית — רק הופכת דיבור לטקסט, לא שומרת"
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
              isListening ? 'bg-amber-800 text-white animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
            }`}
          >
            🎤
          </button>
          <button
            onClick={handleAdd}
            title="הוספה לתיבת הכניסה"
            className="w-10 h-10 rounded-full bg-amber-800 hover:bg-amber-900 text-white flex items-center justify-center text-xl"
          >
            +
          </button>
        </div>
      </div>

      {isListening && <p className="text-xs text-amber-800 dark:text-amber-400 mt-2 px-2">מקליט... דבר עכשיו</p>}
      {!isSupported && error && <p className="text-xs text-stone-400 dark:text-stone-500 mt-2 px-2">{error}</p>}
      {isSupported && error && <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 px-2">{error}</p>}
      {confirmed && <p className="text-xs text-amber-800 dark:text-amber-400 mt-2 px-2">נוסף לתיבת הכניסה ✓</p>}

      {isSearching && (
        <div className="absolute z-30 mt-2 w-full bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl shadow-lg p-2">
          <div className="text-xs text-stone-400 dark:text-stone-500 px-3 py-1">נמצא במערכת — לחיצה פותחת</div>
          {matches.map((it) => (
            <button
              key={it.id}
              onClick={() => {
                openEdit(it.id)
                setText('')
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-right"
            >
              <span className="text-sm text-stone-700 dark:text-stone-200 truncate">{it.title}</span>
              <DomainBadge domain={it.domain} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
