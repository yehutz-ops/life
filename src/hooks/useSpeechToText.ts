import { useRef, useState } from 'react'

declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
  }
}

export function useSpeechToText(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)

  const isSupported = typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  function toggle() {
    if (!isSupported) {
      setError('הדפדפן הזה עדיין לא תומך בהמרת דיבור לטקסט. אפשר להקליד את זה ידנית.')
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      return
    }
    setError('')
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new Ctor()
    recognition.lang = 'he-IL'
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event: any) => {
      onTranscript(event.results[0][0].transcript)
    }
    recognition.onerror = () => {
      setError('לא הצלחתי לגשת למיקרופון. ודא שנתת לדפדפן הרשאה להשתמש בו.')
      setIsListening(false)
    }
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }

  function stop() {
    recognitionRef.current?.stop()
  }

  return { isListening, isSupported, error, toggle, stop }
}
