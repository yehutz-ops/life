import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { handleAiCommand } from './aiHandler'

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export function aiServerPlugin(apiKey: string): Plugin {
  return {
    name: 'life-control-center-ai-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        if (req.url === '/api/ai/health' && req.method === 'GET') {
          sendJson(res, 200, { configured: !!apiKey })
          return
        }

        if (req.url === '/api/ai/command' && req.method === 'POST') {
          if (!apiKey) {
            sendJson(res, 400, { error: 'no_key', message: 'חיבור Claude AI עדיין לא הוגדר.' })
            return
          }
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw)
            const { result, usage } = await handleAiCommand(apiKey, body)
            sendJson(res, 200, { result, usage })
          } catch (err: any) {
            // פרטי השגיאה נכתבים רק למסוף השרת — לעולם לא כוללים את מפתח ה-API.
            console.error('[ai/command] failed:', err?.message ?? err)
            sendJson(res, 502, { error: 'ai_failed', message: 'לא הצלחתי להתחבר ל-Claude כרגע. אפשר לנסות שוב עוד רגע.' })
          }
          return
        }

        next()
      })
    },
  }
}
