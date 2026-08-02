const KEY = 'lcc-ai-enabled'
const EVENT = 'lcc-ai-enabled-change'

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
