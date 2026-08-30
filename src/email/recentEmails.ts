import { EmailAccountId } from '../data/types'

// שליפת המיילים האחרונים להצגה בדף הבית. קריאה-בלבד מול Gmail: שום מייל לא נשמר מקומית
// ולא נוגעים בסמן הסנכרון, כך שהצינור שמסווג ומתייק מיילים (checkEmailAccount) לא מושפע.
export interface HomeEmail {
  id: string
  account: EmailAccountId
  fromName: string
  fromAddress: string
  subject: string
  preview: string
  date: string
}

const ACCOUNTS: EmailAccountId[] = ['work', 'personal']

async function fetchAccount(account: EmailAccountId, limit: number): Promise<HomeEmail[]> {
  const res = await fetch('/api/email/recent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, limit }),
  })
  if (!res.ok) return []
  const data = await res.json()
  return (data.messages ?? []).map((m: any) => ({
    id: `${account}-${m.uid}`,
    account,
    fromName: m.fromName,
    fromAddress: m.fromAddress,
    subject: m.subject,
    preview: m.preview,
    date: m.date,
  }))
}

// תיבה שאינה מוגדרת או שנכשלת לא מפילה את הפאנל — פשוט לא תורמת מיילים.
export async function fetchHomeEmails(limit = 6): Promise<HomeEmail[]> {
  const results = await Promise.allSettled(ACCOUNTS.map((a) => fetchAccount(a, limit)))
  return results
    .flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
}
