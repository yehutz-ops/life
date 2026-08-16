import { handleAiCommand, classifyError } from '../../server/aiHandler'

// Vercel serverless function — production equivalent of the /api/ai/command
// route in server/vitePlugin.ts. Reuses the same framework-agnostic handler.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  if (!apiKey) {
    res.status(400).json({ error: 'no_key', message: 'חיבור Claude AI עדיין לא הוגדר.' })
    return
  }
  try {
    const { result, usage } = await handleAiCommand(apiKey, req.body)
    res.status(200).json({ result, usage })
  } catch (err: any) {
    // פרטי השגיאה נכתבים רק ללוג השרת — לעולם לא כוללים את מפתח ה-API.
    console.error('[ai/command] failed:', err?.message ?? err)
    const classified = classifyError(err)
    res.status(502).json({ error: classified.type, message: classified.message })
  }
}
