export class RfqEmailError extends Error {}

export interface RfqEmailAttachment {
  fileName: string
  mediaType: string
  base64: string
}

export interface RfqEmailAgency {
  agencyId: string
  name: string
  email: string
}

export interface RfqEmailResult {
  agencyId: string
  name: string
  email: string
  success: boolean
  error?: { type: string; message: string }
}

// בודקת רק את תיבת ה-work — זו התיבה היחידה שממנה נשלח RFQ כרגע.
export async function checkEmailHealth(): Promise<boolean> {
  try {
    const res = await fetch('/api/email/health')
    if (!res.ok) return false
    const data = await res.json()
    return !!data.work?.configured
  } catch {
    return false
  }
}

// שולח מייל נפרד לכל סוכנות — לעולם לא CC משותף. מחזיר תוצאה לכל סוכנות בנפרד (הצלחה חלקית לגיטימית).
export async function sendRfqEmails(agencies: RfqEmailAgency[], subject: string, body: string, attachments: RfqEmailAttachment[]): Promise<RfqEmailResult[]> {
  let res: Response
  try {
    res = await fetch('/api/email/send-rfq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agencies, subject, body, attachments }),
    })
  } catch {
    throw new RfqEmailError('אין חיבור לאינטרנט כרגע. הבקשה נשמרה מקומית, אפשר לנסות לשלוח שוב מאוחר יותר.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new RfqEmailError(data?.message ?? 'לא הצלחתי לשלוח את המייל כרגע. הבקשה נשמרה מקומית.')
  }

  const data = await res.json()
  return data.results as RfqEmailResult[]
}
