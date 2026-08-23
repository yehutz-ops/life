import { fetchNewEmails, classifyEmailError, EmailAccountId } from '../../server/emailHandler.js'

const ACCOUNT_ENV: Record<EmailAccountId, { user?: string; appPassword?: string }> = {
  work: { user: process.env.GMAIL_WORK_USER, appPassword: process.env.GMAIL_WORK_APP_PASSWORD },
  personal: { user: process.env.GMAIL_PERSONAL_USER, appPassword: process.env.GMAIL_PERSONAL_APP_PASSWORD },
}

// Vercel serverless function — production equivalent of the /api/email/fetch-new
// route in server/vitePlugin.ts.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const accountId: EmailAccountId = req.body?.account === 'personal' ? 'personal' : 'work'
  const config = ACCOUNT_ENV[accountId]
  if (!config.user || !config.appPassword) {
    res.status(400).json({ error: 'no_key', message: 'חיבור תיבת המייל עדיין לא הוגדר.' })
    return
  }
  try {
    const result = await fetchNewEmails({ user: config.user, appPassword: config.appPassword }, req.body?.syncState)
    res.status(200).json(result)
  } catch (err: any) {
    console.error('[email/fetch-new] failed:', err?.message ?? err)
    const classified = classifyEmailError(err)
    res.status(502).json({ error: classified.type, message: classified.message })
  }
}
