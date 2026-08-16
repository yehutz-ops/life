import { sendRfqEmails, classifyEmailError } from '../../server/emailHandler'

// Vercel serverless function — production equivalent of the /api/email/send-rfq
// route in server/vitePlugin.ts.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const user = process.env.GMAIL_USER
  const appPassword = process.env.GMAIL_APP_PASSWORD
  if (!user || !appPassword) {
    res.status(400).json({ error: 'no_key', message: 'חיבור תיבת המייל עדיין לא הוגדר.' })
    return
  }
  try {
    const results = await sendRfqEmails({ user, appPassword }, req.body)
    res.status(200).json({ results })
  } catch (err: any) {
    console.error('[email/send-rfq] failed:', err?.message ?? err)
    const classified = classifyEmailError(err)
    res.status(502).json({ error: classified.type, message: classified.message })
  }
}
