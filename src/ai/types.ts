export type AiIntent = 'create_draft' | 'search' | 'clarification'

export interface AiDraft {
  title: string
  type: 'task' | 'event' | 'reminder' | 'waiting'
  domain: 'work' | 'studies' | 'personal' | 'home' | 'health' | 'finance' | 'development' | null
  date: string | null
  startTime: string | null
  priority: 'low' | 'normal' | 'high'
  projectId: string | null
  brandId: string | null
  relatedPerson: string | null
  notes: string | null
}

export interface AiResponse {
  intent: AiIntent
  answer: string
  matchedItemIds: string[]
  matchedProjectIds: string[]
  draft: AiDraft | null
  confidence: 'low' | 'medium' | 'high'
  clarificationQuestion: string | null
}
