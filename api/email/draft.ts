import { saveDraftReply, classifyEmailError } from '../../server/emailHandler.js'

// Vercel serverless function — saves a reply DRAFT into Gmail's Drafts folder.
// It never sends: the user reviews and sends from Gmail themselves.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const user = process.env.GMAIL_WORK_USER
  const appPassword = process.env.GMAIL_WORK_APP_PASSWORD
  if (!user || !appPassword) {
    res.status(400).json({ error: 'no_key', message: 'חיבור תיבת המייל עדיין לא הוגדר.' })
    return
  }
  try {
    const result = await saveDraftReply({ user, appPassword }, req.body)
    res.status(200).json(result)
  } catch (err: any) {
    console.error('[email/draft] failed:', err?.message ?? err)
    const classified = classifyEmailError(err)
    res.status(502).json({ error: classified.type, message: classified.message })
  }
}
