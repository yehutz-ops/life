import { checkEmailHealth } from '../../server/emailHandler'

// Vercel serverless function — production equivalent of the /api/email/health route
// that server/vitePlugin.ts serves during local dev.
export default async function handler(req: any, res: any) {
  res.status(200).json(checkEmailHealth({ user: process.env.GMAIL_USER, appPassword: process.env.GMAIL_APP_PASSWORD }))
}
