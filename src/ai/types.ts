export type AiIntent = 'create_draft' | 'search' | 'clarification'

export type AiItemType = 'task' | 'event' | 'reminder' | 'waiting' | 'shopping_item' | 'content_item'
export type AiListType = 'shopping' | 'errands' | 'meetings' | 'studies_admin' | 'content' | 'brands' | 'general' | 'maintenance' | 'bills'

export interface AiDraft {
  title: string
  itemType: AiItemType
  domain: 'work' | 'studies' | 'personal' | 'home' | 'health' | 'finance' | 'development' | null
  destination: string | null
  listType: AiListType | null
  date: string | null
  startTime: string | null
  endTime: string | null
  priority: 'low' | 'normal' | 'high'
  person: string | null
  projectId: string | null
  brandId: string | null
  productId: string | null
  campaignId: string | null
  needsCalendar: boolean
  needsApproval: boolean
  notes: string | null
  amount: number | null
  currency: string | null
}

export interface AiResponse {
  intent: AiIntent
  answer: string
  matchedItemIds: string[]
  matchedProjectIds: string[]
  draft: AiDraft | null
  confidence: number
  clarificationQuestion: string | null
}
