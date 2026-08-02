import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../data/StoreContext'
import { useDetailModal } from '../data/DetailModalContext'
import { useProjectForm } from '../data/ProjectFormContext'
import { useSpeechToText } from '../hooks/useSpeechToText'
import { DomainBadge } from './ui'
import { getDomain } from '../data/domains'
import { askAi, AiClientError } from '../ai/aiClient'
import { AiResponse } from '../ai/types'
import { mapAiDraft } from '../ai/mapDraft'
import { getAiEnabled, onAiEnabledChange } from '../ai/aiSettings'

const HIGH_CONFIDENCE = 0.85
const MEDIUM_CONFIDENCE = 0.65

type AutoSaved = { itemId: string; tier: 'high' | 'medium'; domainLabel: string; domainIcon: string; destination?: string; needsApproval: boolean }

export default function QuickCaptureBar() {
  const { items, projects, addInboxEntry, addItem, deleteItem } = useStore()
  const { openEdit, openCreate } = useDetailModal()
  const { openEdit: openProjectEdit } = useProjectForm()
  const [text, setText] = useState('')
  const [usedMic, setUsedMic] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const [aiActive, setAiActive] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiResult, setAiResult] = useState<AiResponse | null>(null)
  const [autoSaved, setAutoSaved] = useState<AutoSaved | null>(null)
  const [aiEnabled, setAiEnabledState] = useState(getAiEnabled())

  useEffect(() => onAiEnabledChange(() => setAiEnabledState(getAiEnabled())), [])

  const { isListening, isSupported, error, toggle } = useSpeechToText((transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript))
    setUsedMic(true)
  })

  const matches = useMemo(() => {
    const q = text.trim()
    if (!q || aiResult || autoSaved || aiLoading) return []
    return items.filter((it) => it.title.includes(q)).slice(0, 5)
  }, [text, items, aiResult, autoSaved, aiLoading])

  async function runAi() {
    if (!text.trim()) return
    setAiLoading(true)
    setAiError('')
    setAiResult(null)
    setAutoSaved(null)
    try {
      const result = await askAi(text.trim(), items, projects)

      if (result.intent === 'create_draft' && result.draft) {
        const mapped = mapAiDraft(result.draft)
        if (mapped.domain && result.confidence >= MEDIUM_CONFIDENCE) {
          // ביטחון גבוה/בינוני + תחום ברור — מסדרים לבד, אבל תמיד ניתן לערוך או לבטל.
          const item = await addItem({
            title: mapped.title,
            kind: mapped.kind,
            domain: mapped.domain,
            destination: mapped.destination,
            listType: mapped.listType,
            date: mapped.date,
            startTime: mapped.startTime,
            endTime: mapped.endTime,
            priority: mapped.priority,
            status: 'open',
            projectId: mapped.projectId,
            brandId: mapped.brandId,
            personName: mapped.personName,
            notes: mapped.notes,
          })
          const d = getDomain(mapped.domain)
          setAutoSaved({
            itemId: item.id,
            tier: result.confidence >= HIGH_CONFIDENCE ? 'high' : 'medium',
            domainLabel: d.name,
            domainIcon: d.icon,
            destination: mapped.destination,
            needsApproval: result.draft.needsApproval,
          })
          setText('')
          setUsedMic(false)
          setAiActive(false)
          return
        }
      }

      setAiResult(result)
    } catch (e: any) {
      setAiError(e instanceof AiClientError ? e.message : 'משהו השתבש. אפשר לנסות שוב.')
    } finally {
      setAiLoading(false)
    }
  }

  function triggerAi() {
    setAiActive(true)
    runAi()
  }

  async function handleAdd() {
    if (!text.trim()) return
    await addInboxEntry(text.trim(), usedMic ? 'spoken' : 'typed')
    resetAll()
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 2200)
  }

  function resetAll() {
    setText('')
    setUsedMic(false)
    setAiActive(false)
    setAiResult(null)
    setAutoSaved(null)
    setAiError('')
  }

  async function handleUndoAutoSave() {
    if (!autoSaved) return
    await deleteItem(autoSaved.itemId)
    resetAll()
  }

  function handleEditAutoSave() {
    if (!autoSaved) return
    openEdit(autoSaved.itemId)
    resetAll()
  }

  async function handleConfirmDraft() {
    if (!aiResult?.draft) return
    const mapped = mapAiDraft(aiResult.draft)
    if (mapped.domain) {
      await addItem({
        title: mapped.title,
        kind: mapped.kind,
        domain: mapped.domain,
        destination: mapped.destination,
        listType: mapped.listType,
        date: mapped.date,
        startTime: mapped.startTime,
        endTime: mapped.endTime,
        priority: mapped.priority,
        status: 'open',
        projectId: mapped.projectId,
        brandId: mapped.brandId,
        personName: mapped.personName,
        notes: mapped.notes,
      })
    } else {
      // אין תחום ברור — לא ממציאים שיוך, שומרים בתיבת כניסה כדי שדבר לא יאבד.
      await addInboxEntry(mapped.title, usedMic ? 'spoken' : 'typed')
    }
    resetAll()
  }

  function handleEditDraft() {
    if (!aiResult?.draft) return
    openCreate(undefined, mapAiDraft(aiResult.draft))
    resetAll()
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (aiResult || aiError || autoSaved) {
              setAiResult(null)
              setAiError('')
              setAutoSaved(null)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              // Enter שומר פריט חדש רק במצב AI — לעולם לא יוצר פריט חדש בטעות בזמן חיפוש רגיל.
              if (aiActive) runAi()
            }
          }}
          placeholder="כתוב או אמור משהו שצריך לזכור..."
          className="w-full rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 py-4 pr-6 pl-36 text-base shadow-sm shadow-stone-200/50 dark:shadow-none focus:outline-none focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900"
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
          {aiEnabled && (
            <button
              onClick={triggerAi}
              title="חיפוש חכם עם Claude AI"
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-colors ${
                aiActive ? 'bg-violet-700 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
            >
              ✨
            </button>
          )}
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

      {matches.length > 0 && (
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

      {aiLoading && (
        <div className="mt-3 flex items-center gap-2 text-sm text-violet-700 dark:text-violet-400 px-2">
          <span className="animate-pulse">✨ בודק ומסדר את הבקשה...</span>
        </div>
      )}

      {aiError && !aiLoading && (
        <div className="mt-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-3 text-sm text-stone-600 dark:text-stone-300">
          {aiError} החיפוש הרגיל ממשיך לעבוד כרגיל.
        </div>
      )}

      {autoSaved && !aiLoading && (
        <div
          className={`mt-3 rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3 ${
            autoSaved.tier === 'high'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900'
              : 'bg-white dark:bg-stone-900 border-2 border-violet-200 dark:border-violet-800'
          }`}
        >
          <div className="min-w-0 text-sm">
            <div className="text-stone-800 dark:text-stone-100">
              ✓ נוסף ל{autoSaved.domainIcon} {autoSaved.domainLabel}
              {autoSaved.destination ? ` → ${autoSaved.destination}` : ''}
            </div>
            {autoSaved.needsApproval && (
              <div className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">פעולה חיצונית (כמו שליחת מייל או פרסום) עדיין לא בוצעה — רק המשימה נוצרה.</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={handleUndoAutoSave} className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400">
              ביטול
            </button>
            <button onClick={handleEditAutoSave} className="px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300">
              עריכה
            </button>
          </div>
        </div>
      )}

      {aiResult && !aiLoading && (
        <div className="mt-3 bg-white dark:bg-stone-900 border border-violet-100 dark:border-violet-900 rounded-2xl p-4 shadow-sm">
          {aiResult.intent === 'create_draft' && aiResult.draft && (
            <div>
              <div className="text-sm font-bold text-stone-800 dark:text-stone-100 mb-2">הבנתי נכון?</div>
              <div className="text-sm text-stone-700 dark:text-stone-200 mb-1">{aiResult.draft.title}</div>
              <div className="text-xs text-stone-500 dark:text-stone-400 space-y-0.5 mb-3">
                {aiResult.draft.date && <div>תאריך: {aiResult.draft.date}{aiResult.draft.startTime ? ` · ${aiResult.draft.startTime}` : ''}</div>}
                {aiResult.draft.person && <div>אדם: {aiResult.draft.person}</div>}
                <div>רמת ביטחון: {Math.round(aiResult.confidence * 100)}%</div>
                {!aiResult.draft.domain && <div>לא הצלחתי לזהות תחום חיים ברור — אפשר לערוך או לשמור בתיבת הכניסה.</div>}
              </div>
              <div className="flex gap-2">
                <button onClick={resetAll} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-500 dark:text-stone-400">
                  ביטול
                </button>
                <button onClick={handleEditDraft} className="px-3 py-2 rounded-xl border border-stone-200 dark:border-stone-700 text-xs text-stone-600 dark:text-stone-300">
                  עריכה
                </button>
                <button onClick={handleConfirmDraft} className="flex-1 px-3 py-2 rounded-xl bg-violet-700 text-white text-xs font-medium hover:bg-violet-800">
                  אישור ושמירה
                </button>
              </div>
            </div>
          )}

          {aiResult.intent === 'search' && (
            <div>
              <div className="text-sm text-stone-700 dark:text-stone-200 mb-2">{aiResult.answer}</div>
              <div className="space-y-1">
                {aiResult.matchedItemIds.map((id) => {
                  const it = items.find((x) => x.id === id)
                  if (!it) return null
                  return (
                    <button key={id} onClick={() => { openEdit(id); resetAll() }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-right">
                      <span className="text-sm text-stone-700 dark:text-stone-200 truncate">{it.title}</span>
                      <DomainBadge domain={it.domain} />
                    </button>
                  )
                })}
                {aiResult.matchedProjectIds.map((id) => {
                  const p = projects.find((x) => x.id === id)
                  if (!p) return null
                  return (
                    <button key={id} onClick={() => { openProjectEdit(id); resetAll() }} className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-right">
                      <span className="text-sm text-stone-700 dark:text-stone-200 truncate">📁 {p.name}</span>
                      <DomainBadge domain={p.domain} />
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {aiResult.intent === 'clarification' && (
            <div>
              <div className="text-sm text-stone-700 dark:text-stone-200 mb-3">{aiResult.clarificationQuestion}</div>
              <button
                onClick={async () => {
                  await addInboxEntry(text.trim(), usedMic ? 'spoken' : 'typed')
                  resetAll()
                }}
                className="px-3 py-2 rounded-xl bg-amber-800 text-white text-xs font-medium hover:bg-amber-900"
              >
                שמור בתיבת כניסה בלי תאריך
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
