// ממיר Item קיים ל-CalendarEvent לתצוגה בלבד — לא יוצר/שומר שום דבר. onOpen תמיד פותח את הפריט
// האמיתי (openEdit), כך שאין "עותק יומן" נפרד לעריכה.
import { Item } from '../../data/types'
import { kindLabel } from '../ui'
import { CalendarEvent } from './types'

export function itemsToCalendarEvents(items: Item[], openEdit: (id: string) => void): CalendarEvent[] {
  return items
    .filter((it) => !!it.date)
    .map((it) => ({
      id: it.id,
      title: it.title,
      date: it.date as string,
      time: it.startTime,
      endTime: it.endTime,
      domain: it.domain,
      kindLabel: kindLabel[it.kind],
      done: it.status === 'done',
      pending: it.reviewStatus === 'pending',
      source: it.eventSource,
      onOpen: () => openEdit(it.id),
    }))
}
