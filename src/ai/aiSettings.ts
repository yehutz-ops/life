const KEY = 'lcc-ai-enabled'
const EVENT = 'lcc-ai-enabled-change'
const LEARNING_KEY = 'lcc-ai-learning-enabled'

export function getAiEnabled(): boolean {
  const v = localStorage.getItem(KEY)
  return v === null ? true : v === 'true'
}

export function setAiEnabled(enabled: boolean) {
  localStorage.setItem(KEY, String(enabled))
  window.dispatchEvent(new Event(EVENT))
}

export function onAiEnabledChange(cb: () => void) {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}

// שליטה נפרדת על "למידה מתיקונים" — כשהיא כבויה, תיקוני תחום ידניים לא נשמרים כהעדפות ניתוב חדשות.
export function getAiLearningEnabled(): boolean {
  const v = localStorage.getItem(LEARNING_KEY)
  return v === null ? true : v === 'true'
}

export function setAiLearningEnabled(enabled: boolean) {
  localStorage.setItem(LEARNING_KEY, String(enabled))
}
