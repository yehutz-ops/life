import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'

export type EmailErrorType = 'auth' | 'invalid_recipient' | 'network' | 'server' | 'unknown'
export type EmailAccountId = 'work' | 'personal'

export interface ClassifiedEmailError {
  type: EmailErrorType
  message: string
}

// מסווג שגיאה לקטגוריה בטוחה להצגה למשתמש — אף פעם לא כולל את ה-App Password או פרטים טכניים גולמיים.
// משמש גם לשגיאות SMTP (שליחה) וגם ל-IMAP (קריאה) — שני הפרוטוקולים משתמשים באותו App Password.
export function classifyEmailError(err: unknown): ClassifiedEmailError {
  const code = (err as any)?.responseCode ?? (err as any)?.code
  const raw = String((err as any)?.message ?? err ?? '')
  if (code === 535 || /invalid login|username and password not accepted|invalid credentials|authentication failed/i.test(raw)) {
    return { type: 'auth', message: 'ההתחברות ל-Gmail נכשלה — כדאי לבדוק שה-App Password נכון ועדיין פעיל.' }
  }
  if (code === 550 || /no such user|recipient address rejected|invalid recipient/i.test(raw)) {
    return { type: 'invalid_recipient', message: 'כתובת הנמען לא תקינה או נדחתה על ידי השרת.' }
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET|timeout/i.test(raw)) {
    return { type: 'network', message: 'אין חיבור לשרתי Gmail כרגע. בדוק את החיבור לאינטרנט ונסה שוב.' }
  }
  if (raw) {
    return { type: 'server', message: 'שירות המייל החזיר שגיאה זמנית. אפשר לנסות שוב עוד רגע.' }
  }
  return { type: 'unknown', message: 'קרתה תקלה לא צפויה. אפשר לנסות שוב.' }
}

export interface EmailConfig {
  user: string
  appPassword: string
}

export function checkEmailHealth(config: Partial<EmailConfig>): { configured: boolean } {
  return { configured: !!(config.user && config.appPassword) }
}

function buildTransporter(config: EmailConfig) {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: config.user, pass: config.appPassword },
  })
}

export async function testEmailConnection(config: EmailConfig): Promise<{ ok: true } | { ok: false; error: ClassifiedEmailError }> {
  try {
    const transporter = buildTransporter(config)
    await transporter.verify()
    return { ok: true }
  } catch (err) {
    console.error('[email/test-connection] failed:', (err as any)?.message ?? err)
    return { ok: false, error: classifyEmailError(err) }
  }
}

export interface RfqEmailAttachment {
  fileName: string
  mediaType: string
  base64: string
}

export interface RfqEmailAgency {
  agencyId: string
  name: string
  email: string
}

export interface SendRfqEmailsRequest {
  agencies: RfqEmailAgency[]
  subject: string
  body: string
  attachments?: RfqEmailAttachment[]
}

export interface RfqEmailResult {
  agencyId: string
  name: string
  email: string
  success: boolean
  error?: ClassifiedEmailError
}

// שולח מייל נפרד לכל סוכנות בנפרד — לעולם לא CC/BCC משותף לכמה סוכנויות באותה קריאה.
export async function sendRfqEmails(config: EmailConfig, req: SendRfqEmailsRequest): Promise<RfqEmailResult[]> {
  const transporter = buildTransporter(config)
  const attachments = (req.attachments ?? []).map((a) => ({ filename: a.fileName, content: a.base64, encoding: 'base64' as const }))

  const results: RfqEmailResult[] = []
  for (const agency of req.agencies) {
    try {
      await transporter.sendMail({
        from: config.user,
        to: agency.email,
        subject: req.subject,
        text: req.body,
        attachments,
      })
      results.push({ agencyId: agency.agencyId, name: agency.name, email: agency.email, success: true })
    } catch (err) {
      console.error(`[email/send-rfq] failed for ${agency.email}:`, (err as any)?.message ?? err)
      results.push({ agencyId: agency.agencyId, name: agency.name, email: agency.email, success: false, error: classifyEmailError(err) })
    }
  }
  return results
}

export interface EmailSyncState {
  uidValidity: number
  lastUid: number
}

export interface ParsedIncomingEmail {
  uid: number
  from: string
  subject: string
  date: string
  text: string
}

export interface FetchNewEmailsResult {
  syncState: EmailSyncState
  messages: ParsedIncomingEmail[]
}

const MAX_MESSAGES_PER_CHECK = 20
const MAX_BODY_CHARS = 20000

// קורא מיילים חדשים בלבד מ-INBOX דרך IMAP (אותו App Password כמו השליחה). לא נוגע בתיקיות/תוויות אחרות.
// חיבור ראשון לחשבון (או שינוי UIDVALIDITY, נדיר בג'ימייל) — לא מעבד היסטוריה, רק קובע קו בסיס חדש ומחזיר 0 הודעות.
// זו החלטה מכוונת: חיבור תיבת מייל לא סורק רטרואקטיבית מיילים ישנים (רלוונטי במיוחד לתיבה האישית עם תוכן רפואי).
// מייל אחרון להצגה בלבד (פאנל "מיילים חדשים" בדף הבית). קריאה-בלבד: לא נשמר כלום מקומית
// ולא נוגעים ב-syncState, כדי שהצינור שמסווג ומתייק מיילים ימשיך לעבוד בדיוק כמו קודם.
export interface RecentEmail {
  uid: number
  fromName: string
  fromAddress: string
  subject: string
  date: string
  preview: string
}

const MAX_RECENT_EMAILS = 10
const RECENT_PREVIEW_CHARS = 160

export async function fetchRecentEmails(config: EmailConfig, limit = MAX_RECENT_EMAILS): Promise<RecentEmail[]> {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: config.user, pass: config.appPassword },
    logger: false,
  })

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      const total = Number((client.mailbox as any)?.exists) || 0
      if (total === 0) return []

      const start = Math.max(1, total - limit + 1)
      const out: RecentEmail[] = []
      // שליפה לפי מספר סידורי (ולא UID) — פשוט "ה-N האחרונים בתיבה", בלי תלות בסמן הסנכרון.
      for await (const msg of client.fetch(`${start}:${total}`, { uid: true, source: true })) {
        const parsed = await simpleParser(msg.source as Buffer)
        const sender = parsed.from?.value?.[0]
        const address = sender?.address ?? ''
        out.push({
          uid: msg.uid,
          fromName: sender?.name?.trim() || address.split('@')[0] || 'ללא שולח',
          fromAddress: address,
          subject: parsed.subject?.trim() || '(ללא נושא)',
          date: (parsed.date ?? new Date()).toISOString(),
          preview: (parsed.text ?? '').replace(/\s+/g, ' ').trim().slice(0, RECENT_PREVIEW_CHARS),
        })
      }
      return out.sort((a, b) => b.date.localeCompare(a.date))
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
}

export async function fetchNewEmails(config: EmailConfig, syncState?: EmailSyncState): Promise<FetchNewEmailsResult> {
  const client = new ImapFlow({
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: { user: config.user, pass: config.appPassword },
    logger: false,
  })

  await client.connect()
  try {
    const lock = await client.getMailboxLock('INBOX')
    try {
      const mailbox = client.mailbox as any
      const uidValidity = Number(mailbox.uidValidity)

      if (!syncState || syncState.uidValidity !== uidValidity) {
        const uidNext = Number(mailbox.uidNext)
        const baselineUid = Number.isFinite(uidNext) ? Math.max(uidNext - 1, 0) : 0
        return { syncState: { uidValidity, lastUid: baselineUid }, messages: [] }
      }

      const messages: ParsedIncomingEmail[] = []
      let lastUid = syncState.lastUid
      let count = 0
      for await (const msg of client.fetch(`${syncState.lastUid + 1}:*`, { uid: true, source: true }, { uid: true })) {
        if (msg.uid <= syncState.lastUid) continue // '*' עלול להחזיר גם את ההודעה האחרונה הקיימת גם כשאין חדשות
        if (count >= MAX_MESSAGES_PER_CHECK) break
        const parsed = await simpleParser(msg.source as Buffer)
        messages.push({
          uid: msg.uid,
          from: parsed.from?.text ?? '',
          subject: parsed.subject ?? '',
          date: (parsed.date ?? new Date()).toISOString(),
          text: (parsed.text ?? '').slice(0, MAX_BODY_CHARS),
        })
        lastUid = msg.uid
        count++
      }

      return { syncState: { uidValidity, lastUid }, messages }
    } finally {
      lock.release()
    }
  } finally {
    await client.logout()
  }
}
