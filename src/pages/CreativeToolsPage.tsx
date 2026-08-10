import { Link } from 'react-router-dom'
import { WrenchIcon } from '../components/hub/hubIcons'
import { Card } from '../components/ui'
import StatusPill from '../components/hub/StatusPill'
import { contentProviders } from '../data/contentProviders'

const PROVIDER_LABELS: { key: keyof typeof contentProviders; title: string; description: string }[] = [
  { key: 'imageProvider', title: 'יצירת/עריכת תמונות', description: 'לדוגמה Google Gemini Image / Nano Banana — יצירת ויזואלים לתוכן.' },
  { key: 'videoProvider', title: 'עריכת וידאו', description: 'עריכה וגנרציה של קליפים לתוכן ברשתות.' },
  { key: 'publishingProvider', title: 'פרסום ברשתות', description: 'פרסום ותזמון ישיר לאינסטגרם/טיקטוק אחרי אישור.' },
  { key: 'analyticsProvider', title: 'סנכרון אנליטיקה', description: 'משיכת נתוני צפיות/מעורבות אוטומטית אחרי פרסום.' },
]

// עמוד placeholder לשכבת ה-Provider — ראו src/data/contentProviders.ts. אין כאן שום חיבור אמיתי,
// רק תשתית מוכנה לחיבור עתידי בלי לשנות UI כשיתווספו credentials.
export default function CreativeToolsPage() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link
          to="/work/brands"
          className="w-9 h-9 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-400 dark:text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800 shrink-0"
          aria-label="חזרה למותגים"
          title="חזרה למותגים"
        >
          ←
        </Link>
        <div className="flex items-center gap-2">
          <WrenchIcon className="w-6 h-6 text-stone-700 dark:text-stone-200" />
          <h1 className="text-2xl font-bold text-stone-800 dark:text-stone-100">כלי יצירה ואינטגרציות</h1>
        </div>
      </div>

      <p className="text-sm text-stone-500 dark:text-stone-400">
        המערכת בנויה כך שכל כלי יצירה/פרסום/אנליטיקה מתחבר דרך שכבת Provider אחידה — אפשר יהיה להחליף או להוסיף ספק בעתיד בלי לשנות את שאר המערכת.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {PROVIDER_LABELS.map(({ key, title, description }) => {
          const status = contentProviders[key].status()
          return (
            <Card key={key}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-stone-800 dark:text-stone-100">{title}</h3>
                <StatusPill label={status.connected ? 'מחובר' : 'לא מחובר'} tone={status.connected ? 'calm' : 'neutral'} />
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mb-2">{description}</p>
              <p className="text-xs text-stone-400 dark:text-stone-500">{status.message}</p>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
