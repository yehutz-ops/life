import { useState } from 'react'

export interface DonutSlice {
  name: string
  amount: number
  color: string
}

// valueSuffix/centerLabel/formatValue אופציונליים — ברירת המחדל שומרת בדיוק על ההתנהגות
// הקיימת (סכומי כסף בשקלים), כדי שהשימושים הקיימים לא ישתנו.
export default function DonutChart({
  data,
  size = 180,
  strokeWidth = 26,
  valueSuffix = '₪',
  centerLabel = 'סך הוצאות',
  formatValue = (v: number) => v.toLocaleString('he-IL'),
}: {
  data: DonutSlice[]
  size?: number
  strokeWidth?: number
  valueSuffix?: string
  centerLabel?: string
  formatValue?: (v: number) => string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.amount, 0)
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  let offset = 0

  const active = hovered !== null ? data[hovered] : null

  return (
    <div className="flex items-center gap-5">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="חלוקת הוצאות לפי קטגוריה">
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-100 dark:text-stone-800" />
          {data.map((d, i) => {
            const len = total ? (d.amount / total) * circumference : 0
            const isHovered = hovered === i
            const el = (
              <circle
                key={d.name}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={d.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={-offset}
                className="transition-all duration-150 cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            )
            offset += len
            return el
          })}
        </g>
        <text x="50%" y="47%" textAnchor="middle" className="fill-stone-800 dark:fill-stone-100" style={{ fontSize: 20, fontWeight: 600 }}>
          {active ? `${Math.round((active.amount / total) * 100)}%` : `${formatValue(total)}${valueSuffix}`}
        </text>
        <text x="50%" y="62%" textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 11 }}>
          {active ? active.name : centerLabel}
        </text>
      </svg>

      <ul className="space-y-1.5 text-xs flex-1 min-w-0">
        {data.map((d, i) => (
          <li
            key={d.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`flex items-center gap-2 rounded-lg px-1.5 py-1 -mx-1.5 cursor-pointer transition-colors ${hovered === i ? 'bg-stone-50 dark:bg-stone-800' : ''}`}
          >
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
            <span className="text-stone-600 dark:text-stone-300 truncate flex-1">{d.name}</span>
            <span className="text-stone-400 dark:text-stone-500 shrink-0">
              {formatValue(d.amount)}
              {valueSuffix}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
