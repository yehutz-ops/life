import { repository } from '../data/db/repository'
import { Shipment, ShipmentQuote, Forwarder, ShipmentTimelineEvent } from '../data/shipmentTypes'
import { RfqDispatch, RfqUnmatchedEmail, QuoteSourceEmail } from '../data/rfqTypes'
import { EmailAccountId } from '../data/types'
import { matchEmailToRfq, AUTO_LINK_THRESHOLD, IncomingEmailHeader } from './matchEmail'
import { extractQuoteFromEmail, QuoteExtractError } from './extractQuote'
import { todayISO } from '../utils/date'

// הצינור המרכזי:
//   מייל נכנס → זיהוי ה-RFQ → חילוץ ההצעה ע"י Claude → שמירת Quote → עדכון הדשבורד
//
// Gmail נשאר מקור המיילים: אנחנו לא מעתיקים מיילים למסד. נשמרת רק הפניה (uid/messageId)
// והמידע שחולץ.

export class RfqProcessError extends Error {}

export interface RfqProcessSummary {
  checked: number
  quotesCreated: number
  revisions: number
  needsMatch: number
  skipped: number
  errors: string[]
}

export interface RfqProcessStore {
  shipments: Shipment[]
  shipmentQuotes: ShipmentQuote[]
  forwarders: Forwarder[]
  rfqDispatches: RfqDispatch[]
  addShipmentQuote: (data: Omit<ShipmentQuote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ShipmentQuote>
  updateShipmentQuote: (id: string, patch: Partial<ShipmentQuote>) => Promise<void>
  updateShipment: (id: string, patch: Partial<Shipment>) => Promise<void>
  addShipmentTimelineEvent: (data: Omit<ShipmentTimelineEvent, 'id' | 'createdAt'>) => Promise<ShipmentTimelineEvent>
  updateRfqDispatch: (id: string, patch: Partial<RfqDispatch>) => Promise<void>
  addRfqUnmatchedEmail: (data: Omit<RfqUnmatchedEmail, 'id' | 'createdAt'>) => Promise<RfqUnmatchedEmail>
}

const ACCOUNTS: EmailAccountId[] = ['work', 'personal']
const EXTRACTABLE = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/gif'])

interface FetchedEmail extends IncomingEmailHeader {
  uid: number
  date: string
}

async function fetchNew(account: EmailAccountId): Promise<{ messages: FetchedEmail[]; syncState: any } | null> {
  const syncState = await repository.getRfqSyncState(account)
  const res = await fetch('/api/email/fetch-new', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, syncState }),
  })
  if (!res.ok) return null
  return res.json()
}

async function fetchFullMessage(account: EmailAccountId, uid: number) {
  const res = await fetch('/api/email/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, uid }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.message as { text: string; subject: string; from: string; attachmentData: { fileName: string; mediaType: string; base64: string }[] } | null
}

// גרסה חדשה לא דורסת קודמת: v1, v2, v3... הקודמות נשמרות ומסומנות isCurrent=false.
async function saveQuoteVersion(
  store: RfqProcessStore,
  shipment: Shipment,
  agencyKey: string,
  data: Omit<ShipmentQuote, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'isCurrent'>,
): Promise<{ quote: ShipmentQuote; isRevision: boolean }> {
  const existing = store.shipmentQuotes.filter((q) => q.shipmentId === shipment.id && (q.forwarderId ?? q.forwarderName) === agencyKey)
  const version = existing.reduce((max, q) => Math.max(max, q.version ?? 1), 0) + 1

  await Promise.all(existing.filter((q) => q.isCurrent !== false).map((q) => store.updateShipmentQuote(q.id, { isCurrent: false })))

  const quote = await store.addShipmentQuote({ ...data, version, isCurrent: true })
  return { quote, isRevision: version > 1 }
}

export async function processRfqEmails(store: RfqProcessStore): Promise<RfqProcessSummary> {
  const summary: RfqProcessSummary = { checked: 0, quotesCreated: 0, revisions: 0, needsMatch: 0, skipped: 0, errors: [] }

  for (const account of ACCOUNTS) {
    const fetched = await fetchNew(account).catch(() => null)
    if (!fetched) continue

    for (const message of fetched.messages ?? []) {
      summary.checked++

      const match = matchEmailToRfq(message, store.shipments, store.rfqDispatches, store.forwarders)
      const sourceEmail: QuoteSourceEmail = {
        account,
        uid: message.uid,
        messageId: message.messageId,
        inReplyTo: message.inReplyTo,
        from: message.from,
        fromAddress: message.fromAddress,
        subject: message.subject,
        receivedAt: message.date,
      }

      if (match.confidence < AUTO_LINK_THRESHOLD || !match.shipmentId) {
        // לא בטוח — לא מנחשים. המייל מוצג למשתמש כ"נדרשת התאמה".
        await store.addRfqUnmatchedEmail({
          sourceEmail,
          preview: (message.text ?? '').replace(/\s+/g, ' ').trim().slice(0, 240),
          suggestedShipmentId: match.suggestedShipmentId,
          suggestedReason: match.reason,
        })
        summary.needsMatch++
        continue
      }

      const shipment = store.shipments.find((s) => s.id === match.shipmentId)
      if (!shipment) {
        summary.skipped++
        continue
      }

      try {
        const full = await fetchFullMessage(account, message.uid)
        const attachments = (full?.attachmentData ?? []).filter((a) => EXTRACTABLE.has(a.mediaType))
        const extracted = await extractQuoteFromEmail(
          shipment,
          { subject: message.subject, from: message.from, text: full?.text ?? message.text ?? '' },
          attachments,
        )

        if (!extracted.isQuote) {
          // אישור קבלה / שאלה / הודעת אין-מענה — לא הצעת מחיר, ואין מה לשמור כ-Quote.
          summary.skipped++
          continue
        }

        const forwarder = match.forwarderId ? store.forwarders.find((f) => f.id === match.forwarderId) : undefined
        const agencyName = forwarder?.name ?? extracted.agencyName ?? message.from
        const agencyKey = match.forwarderId ?? agencyName

        const { quote, isRevision } = await saveQuoteVersion(store, shipment, agencyKey, {
          shipmentId: shipment.id,
          forwarderId: match.forwarderId,
          forwarderName: agencyName,
          // המחיר/מטבע/זמן מועתקים לשדות העליונים כדי שהשוואות ותצוגות קיימות ימשיכו לעבוד.
          price: extracted.extraction.totalPrice,
          currency: extracted.extraction.currency,
          transitTimeDays: extracted.extraction.transitTimeMax,
          dateReceived: message.date.slice(0, 10),
          notes: extracted.notes,
          status: 'pending',
          extraction: extracted.extraction,
          fieldMeta: extracted.fieldMeta,
          sourceEmail,
          matchMethod: match.method,
          matchConfidence: match.confidence,
          extractedAt: new Date().toISOString(),
        })

        await store.addShipmentTimelineEvent({
          shipmentId: shipment.id,
          stage: isRevision ? 'quote_revised' : 'quote_received',
          date: todayISO(),
          notes: `${agencyName}${quote.price != null ? ` — ${quote.currency ?? ''}${quote.price}` : ''} · ${match.reason}`,
        })

        const dispatch = store.rfqDispatches.find((d) => d.shipmentId === shipment.id && d.forwarderId === match.forwarderId)
        if (dispatch) {
          const incomplete = !extracted.extraction.totalPrice || !extracted.extraction.transitTimeMax
          await store.updateRfqDispatch(dispatch.id, { status: isRevision ? 'revised' : incomplete ? 'incomplete' : 'replied' })
        }

        if (shipment.status === 'waiting_for_quotes') {
          await store.updateShipment(shipment.id, { status: 'quotes_received' })
        }

        summary.quotesCreated++
        if (isRevision) summary.revisions++
      } catch (err) {
        summary.errors.push(err instanceof QuoteExtractError ? err.message : `ניתוח מייל מ-${message.from} נכשל`)
      }
    }

    if (fetched.syncState) await repository.setRfqSyncState(account, fetched.syncState)
  }

  return summary
}
