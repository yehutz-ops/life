// Vercel serverless function — production equivalent of the /api/ai/health route
// that server/vitePlugin.ts serves during local dev. Same response shape, so
// src/ai/aiClient.ts works unchanged against either.
export default async function handler(req: any, res: any) {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  res.status(200).json({ configured: !!apiKey })
}
