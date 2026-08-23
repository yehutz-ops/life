import { checkEmailHealth } from '../../server/emailHandler.js'

// Vercel serverless function — production equivalent of the /api/email/health route
// that server/vitePlugin.ts serves during local dev. Reports status for both accounts.
export default async function handler(req: any, res: any) {
  res.status(200).json({
    work: checkEmailHealth({ user: process.env.GMAIL_WORK_USER, appPassword: process.env.GMAIL_WORK_APP_PASSWORD }),
    personal: checkEmailHealth({ user: process.env.GMAIL_PERSONAL_USER, appPassword: process.env.GMAIL_PERSONAL_APP_PASSWORD }),
  })
}
