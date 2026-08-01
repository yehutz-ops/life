export type DomainId = 'work' | 'studies' | 'personal' | 'home' | 'health' | 'finance' | 'personalDevelopment'

export type ItemKind = 'task' | 'event' | 'reminder' | 'waiting'
export type WaitingType = 'my_followup' | 'other_pending' | 'my_approval'
export type Priority = 'high' | 'medium' | 'low'
export type ItemStatus = 'open' | 'done'
export type ProjectStatus = 'in_progress' | 'stuck' | 'done'
export type Theme = 'light' | 'dark' | 'system'

export interface Item {
  id: string
  kind: ItemKind
  title: string
  domain?: DomainId // undefined = still in the inbox, not yet sorted
  date?: string
  time?: string
  priority?: Priority
  status: ItemStatus
  projectId?: string
  notes?: string
  personName?: string
  waitingType?: WaitingType
  location?: string
}

export interface Project {
  id: string
  name: string
  domain: DomainId
  status: ProjectStatus
  nextStep: string
  dueDate?: string
  progress: number
}
