import { DomainId, ItemKind, ListType, Priority } from '../data/types'
import { AiDraft, AiItemType } from './types'

const DOMAIN_MAP: Record<string, DomainId> = {
  work: 'work',
  studies: 'studies',
  personal: 'personal',
  home: 'home',
  health: 'health',
  finance: 'finance',
  development: 'personalDevelopment',
}

// itemType -> kind + listType (המשמעות היחודית של shopping_item/content_item נשמרת דרך listType,
// כדי לא להוסיף ל-Item.kind ערכים שדורשים שינוי בכל מסך שמציג/עורך "סוג" פריט).
const ITEM_TYPE_MAP: Record<AiItemType, { kind: ItemKind; listType?: ListType }> = {
  task: { kind: 'task' },
  event: { kind: 'event' },
  reminder: { kind: 'reminder' },
  waiting: { kind: 'waiting' },
  shopping_item: { kind: 'task', listType: 'shopping' },
  content_item: { kind: 'task', listType: 'content' },
}

const PRIORITY_MAP: Record<AiDraft['priority'], Priority> = { low: 'low', normal: 'medium', high: 'high' }

export interface MappedDraft {
  title: string
  kind: ItemKind
  domain?: DomainId
  destination?: string
  listType?: ListType
  date?: string
  startTime?: string
  endTime?: string
  priority: Priority
  projectId?: string
  brandId?: string
  personName?: string
  notes?: string
  amount?: number
  currency?: string
}

export function mapAiDraft(draft: AiDraft): MappedDraft {
  const typeMapping = ITEM_TYPE_MAP[draft.itemType] ?? { kind: 'task' as ItemKind }
  return {
    title: draft.title,
    kind: typeMapping.kind,
    domain: draft.domain ? DOMAIN_MAP[draft.domain] : undefined,
    destination: draft.destination ?? undefined,
    listType: draft.listType ?? typeMapping.listType,
    date: draft.date ?? undefined,
    startTime: draft.startTime ?? undefined,
    endTime: draft.endTime ?? undefined,
    priority: PRIORITY_MAP[draft.priority] ?? 'medium',
    projectId: draft.projectId ?? undefined,
    brandId: draft.brandId ?? undefined,
    personName: draft.person ?? undefined,
    notes: draft.notes ?? undefined,
    amount: draft.amount ?? undefined,
    currency: draft.currency ?? undefined,
  }
}
