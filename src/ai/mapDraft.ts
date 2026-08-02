import { DomainId, ItemKind, Priority } from '../data/types'
import { AiDraft } from './types'

const DOMAIN_MAP: Record<string, DomainId> = {
  work: 'work',
  studies: 'studies',
  personal: 'personal',
  home: 'home',
  health: 'health',
  finance: 'finance',
  development: 'personalDevelopment',
}

const PRIORITY_MAP: Record<AiDraft['priority'], Priority> = { low: 'low', normal: 'medium', high: 'high' }

export interface MappedDraft {
  title: string
  kind: ItemKind
  domain?: DomainId
  date?: string
  startTime?: string
  priority: Priority
  projectId?: string
  personName?: string
  notes?: string
}

export function mapAiDraft(draft: AiDraft): MappedDraft {
  return {
    title: draft.title,
    kind: draft.type,
    domain: draft.domain ? DOMAIN_MAP[draft.domain] : undefined,
    date: draft.date ?? undefined,
    startTime: draft.startTime ?? undefined,
    priority: PRIORITY_MAP[draft.priority] ?? 'medium',
    projectId: draft.projectId ?? undefined,
    personName: draft.relatedPerson ?? undefined,
    notes: draft.notes ?? undefined,
  }
}
