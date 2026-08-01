import { useEffect, useState } from 'react'
import { useQuickAdd } from '../data/QuickAddContext'
import { useStore } from '../data/StoreContext'
import { useSpeechToText } from '../hooks/useSpeechToText'

export default function QuickAddModal() {
  const { isOpen, close } = useQuickAdd()
  const { addInboxItem } = useStore()
  const [text, setText] = useState('')

  const { isListening, error, toggle, stop } = useSpeechToText((transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
  })

  useEffect(() => {
    if (!isOpen) stop()
  }, [isOpen])

  if (!isOpen) return null

  function handleSubmit() {
    if (!text.trim()) return
    addInboxItem(text.trim())
    setText('')
    close()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="bg-white dark:bg-stone-900 rounded-3xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1 text-stone-900 dark:text-stone-100">מה צריך לזכור?</h3>
        <p className="text-sm text-stone-400 dark:text-stone-500 mb-4">
          הפריט יישמר בתיבת הכניסה. אפשר לשייך אותו לתחום ולתאריך אחר כך.
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='למשל: "מחר לקנות מטאטא"'
          className="w-full border border-stone-200 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 rounded-xl p-3 text-sm mb-2 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-amber-200"
        />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggle}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
              isListening ? 'bg-amber-800 text-white animate-pulse' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
            }`}
            title="הקלטה קולית"
          >
            🎤
          </button>
          {isListening && <span className="text-xs text-amber-800 dark:text-amber-400">מקליט... דבר עכשיו</span>}
          {error && <span className="text-xs text-stone-500 dark:text-stone-400">{error}</span>}
        </div>

        <div className="flex gap-3">
          <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 text-sm font-medium text-stone-600 dark:text-stone-300">
            ביטול
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-amber-800 text-white text-sm font-medium hover:bg-amber-900">
            הוספה לתיבת הכניסה
          </button>
        </div>
      </div>
    </div>
  )
}
