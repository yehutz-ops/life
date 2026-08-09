export type DomainId = 'work' | 'studies' | 'personal' | 'home' | 'health' | 'finance' | 'personalDevelopment'

export type ItemKind = 'task' | 'event' | 'reminder' | 'waiting'
export type WaitingType = 'my_followup' | 'other_pending' | 'my_approval'
export type Priority = 'low' | 'medium' | 'high'
export type ItemStatus = 'open' | 'in_progress' | 'done' | 'cancelled' | 'waiting'
export type ProjectStatus = 'in_progress' | 'done'
export type Theme = 'light' | 'dark' | 'system'
export type InboxSource = 'typed' | 'spoken'
export type InboxStatus = 'pending' | 'sorted' | 'deleted'
export type ListType =
  | 'shopping'
  | 'errands'
  | 'meetings'
  | 'studies_admin'
  | 'content'
  | 'brands'
  | 'general'
  | 'maintenance'
  | 'bills'
  | 'library'
  | 'quotes'
  | 'articles'
  | 'ideas'

export interface Item {
  id: string
  title: string
  kind: ItemKind
  domain: DomainId
  destination?: string
  listType?: ListType
  projectId?: string
  brandId?: string
  contentItemId?: string
  date?: string
  startTime?: string
  endTime?: string
  priority: Priority
  status: ItemStatus
  waitingType?: WaitingType
  personName?: string
  notes?: string
  amount?: number
  currency?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Project {
  id: string
  name: string
  domain: DomainId
  description?: string
  status: ProjectStatus
  progress: number
  nextStep: string
  dueDate?: string
  isStuck: boolean
  stuckReason?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InboxEntry {
  id: string
  text: string
  source: InboxSource
  createdAt: string
  status: InboxStatus
  sortedItemId?: string
}
