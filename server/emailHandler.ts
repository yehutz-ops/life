import nodemailer from 'nodemailer'

export type EmailErrorType = 'auth' | 'invalid_recipient' | 'network' | 'server' | 'unknown'

export interface ClassifiedEmailError {
  type: EmailErrorType
  message: string
}

// מסווג שגיאה לקטגוריה בטוחה להצגה למשתמש — אף פעם לא כולל את ה-App Password או פרטים טכניים גולמיים.
export function classifyEmailError(err: unknown): ClassifiedEmailError {
  const code = (err as any)?.responseCode ?? (err as any)?.code
  const raw = String((err as any)?.message ?? err ?? '')
  if (code === 535 || /invalid login|username and password not accepted/i.test(raw)) {
    return { type: 'auth', message: 'ההתחברות ל-Gmail נכשלה — כדאי לבדוק שה-App Password נכון ועדיין פעיל.' }
  }
  if (code === 550 || /no such user|recipient address rejected|invalid recipient/i.test(raw)) {
    return { type: 'invalid_recipient', message: 'כתובת הנמען לא תקינה או נדחתה על ידי השרת.' }
  }
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ECONNRESET/.test(raw)) {
    return { type: 'network', message: 'אין חיבור לשרתי Gmail כרגע. בדוק את החיבור לאינטרנט ונסה שוב.' }
  }
  if (raw) {
    return { type: 'server', message: 'שירות המייל החזיר שגיאה זמנית. אפשר לנסות שוב עוד רגע.' }
  }
  return { type: 'unknown', message: 'קרתה תקלה לא צפויה בזמן השליחה. אפשר לנסות שוב.' }
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
