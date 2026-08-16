import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'http'
import { handleAiCommand, testConnection, classifyError } from './aiHandler'
import { handleShipmentExtract } from './shipmentExtractHandler'
import { checkEmailHealth, testEmailConnection, sendRfqEmails, classifyEmailError, EmailConfig } from './emailHandler'

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

        // בדיקה קלה — האם בכלל הוגדר מפתח בשרת. לא מבצעת קריאה אמיתית ל-Claude.
        if (req.url === '/api/ai/health' && req.method === 'GET') {
          sendJson(res, 200, { configured: !!apiKey })
          return
        }

        // בדיקת חיבור אמיתית — קריאה מינימלית ל-Claude API, מופעלת רק בלחיצה מפורשת.
        if (req.url === '/api/ai/test-connection' && req.method === 'POST') {
          if (!apiKey) {
            sendJson(res, 200, { ok: false, error: { type: 'no_key', message: 'חיבור Claude AI עדיין לא הוגדר.' } })
            return
          }
          const result = await testConnection(apiKey)
          sendJson(res, 200, result)
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
            const classified = classifyError(err)
            sendJson(res, 502, { error: classified.type, message: classified.message })
          }
          return
        }

        if (req.url === '/api/ai/extract-shipment' && req.method === 'POST') {
          if (!apiKey) {
            sendJson(res, 400, { error: 'no_key', message: 'חיבור Claude AI עדיין לא הוגדר.' })
            return
          }
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw)
            const { result, usage } = await handleShipmentExtract(apiKey, body)
            sendJson(res, 200, { result, usage })
          } catch (err: any) {
            console.error('[ai/extract-shipment] failed:', err?.message ?? err)
            const classified = classifyError(err)
            sendJson(res, 502, { error: classified.type, message: classified.message })
          }
          return
        }

        next()
      })
    },
  }
}

// שרת Gmail — מקביל בדיוק ל-aiServerPlugin, אך לדומיין שליחת מיילים (RFQ). מפתח נפרד לגמרי מ-Claude AI.
export function emailServerPlugin(config: Partial<EmailConfig>): Plugin {
  return {
    name: 'life-control-center-email-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        if (req.url === '/api/email/health' && req.method === 'GET') {
          sendJson(res, 200, checkEmailHealth(config))
          return
        }

        if (req.url === '/api/email/test-connection' && req.method === 'POST') {
          if (!config.user || !config.appPassword) {
            sendJson(res, 200, { ok: false, error: { type: 'no_key', message: 'חיבור תיבת המייל עדיין לא הוגדר.' } })
            return
          }
          const result = await testEmailConnection(config as EmailConfig)
          sendJson(res, 200, result)
          return
        }

        if (req.url === '/api/email/send-rfq' && req.method === 'POST') {
          if (!config.user || !config.appPassword) {
            sendJson(res, 400, { error: 'no_key', message: 'חיבור תיבת המייל עדיין לא הוגדר.' })
            return
          }
          try {
            const raw = await readBody(req)
            const body = JSON.parse(raw)
            const results = await sendRfqEmails(config as EmailConfig, body)
            sendJson(res, 200, { results })
          } catch (err: any) {
            console.error('[email/send-rfq] failed:', err?.message ?? err)
            const classified = classifyEmailError(err)
            sendJson(res, 502, { error: classified.type, message: classified.message })
          }
          return
        }

        next()
      })
    },
  }
}
