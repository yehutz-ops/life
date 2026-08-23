import { testConnection } from '../../server/aiHandler.js'

// Vercel serverless function — production equivalent of the /api/ai/test-connection
// route in server/vitePlugin.ts. Reuses the same framework-agnostic handler.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  if (!apiKey) {
    res.status(200).json({ ok: false, error: { type: 'no_key', message: 'חיבור Claude AI עדיין לא הוגדר.' } })
    return
  }
  const result = await testConnection(apiKey)
  res.status(200).json(result)
}
