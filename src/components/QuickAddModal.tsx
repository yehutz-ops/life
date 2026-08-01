import { useEffect, useRef, useState } from 'react'
import { useQuickAdd } from '../data/QuickAddContext'
import { useStore } from '../data/StoreContext'

declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

export default function QuickAddModal() {
  const { isOpen, close } = useQuickAdd()
  const { addInboxItem } = useStore()
  const [text, setText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [micError, setMicError] = useState('')
  const recognitionRef = useRef<any>(null)

  const SpeechRecognitionCtor = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null

  useEffect(() => {
    if (!isOpen) {
      recognitionRef.current?.stop()
      setIsListening(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  function toggleMic() {
    if (!SpeechRecognitionCtor) {
      setMicError('הדפדפן הזה לא תומך בהמרת דיבור לטקסט. אפשר להקליד ידנית.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    setMicError('')
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'he-IL'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.onerror = () => {
      setMicError('לא הצלחתי לגשת למיקרופון. ודא שנתת הרשאה לדפדפן.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  function handleSubmit() {
    if (!text.trim()) return
    addInboxItem(text.trim())
    setText('')
    close()
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={close}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">מה צריך לזכור?</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
          הפריט יישמר בתיבת הכניסה. אפשר לשייך אותו לתחום ולתאריך אחר כך.
        </p>

        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='למשל: "מחר לקנות מטאטא"'
          className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 rounded-xl p-3 text-sm mb-2 resize-none h-24 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}
            title="הקלטה קולית"
          >
            🎤
          </button>
          {isListening && <span className="text-xs text-red-500">מקליט... דבר עכשיו</span>}
          {micError && <span className="text-xs text-amber-600 dark:text-amber-400">{micError}</span>}
        </div>

        <div className="flex gap-3">
          <button onClick={close} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
            ביטול
          </button>
          <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            הוספה לתיבת הכניסה
          </button>
        </div>
      </div>
    </div>
  )
}
