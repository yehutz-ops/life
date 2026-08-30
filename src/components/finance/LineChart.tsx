import { useState } from 'react'

export interface LinePoint {
  label: string
  value: number
}

export default function LineChart({
  data,
  height = 90,
  color = '#92400E',
  valueSuffix = '',
  showAxis = false,
}: {
  data: LinePoint[]
  height?: number
  color?: string
  valueSuffix?: string
  // showAxis — תוויות ציר Y + קווי רשת עדינים מאוד. כבוי כברירת מחדל כדי לשמור על גרף מינימלי.
  showAxis?: boolean
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const width = 320
  const padTop = 14
  const labelRow = 16
  const padLeft = showAxis ? 30 : 10
  const padRight = 8

  const values = data.map((d) => d.value)
  const rawMin = Math.min(...values)
  const rawMax = Math.max(...values)

  // סקאלה מעוגלת לקפיצות של 20 כדי שתוויות הציר יהיו קריאות (ולא מספרים שבורים).
  const step = 20
  const min = showAxis ? Math.max(0, Math.floor((rawMin - 5) / step) * step) : rawMin
  const max = showAxis ? Math.ceil((rawMax + 5) / step) * step : rawMax
  const range = max - min || 1

  const plotH = height - padTop - labelRow
  const plotW = width - padLeft - padRight

  const points = data.map((d, i) => {
    const x = data.length > 1 ? padLeft + (i / (data.length - 1)) * plotW : padLeft + plotW / 2
    const y = padTop + (1 - (d.value - min) / range) * plotH
    return { x, y, ...d }
  })

  const ticks = showAxis ? Array.from({ length: Math.floor(range / step) + 1 }, (_, i) => min + i * step) : []
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const active = hovered !== null ? points[hovered] : undefined

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} role="img" aria-label="מגמת ציונים">
      {ticks.map((t) => {
        const y = padTop + (1 - (t - min) / range) * plotH
        return (
          <g key={t}>
            <line x1={padLeft} x2={width - padRight} y1={y} y2={y} stroke="currentColor" strokeWidth={1} className="text-stone-100 dark:text-stone-800" />
            <text x={padLeft - 7} y={y + 3} textAnchor="end" className="fill-stone-300 dark:fill-stone-600" style={{ fontSize: 9 }}>
              {t}
            </text>
          </g>
        )
      })}

      <path d={path} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={hovered === i ? 5 : 3.5}
          fill={color}
          stroke="#fff"
          strokeWidth={1.5}
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {active && (
        <text x={active.x} y={Math.max(9, active.y - 11)} textAnchor="middle" className="fill-stone-700 dark:fill-stone-200" style={{ fontSize: 10, fontWeight: 700 }}>
          {active.value}
          {valueSuffix}
        </text>
      )}

      {points.map((p, i) => (
        <text key={`l-${i}`} x={p.x} y={height - 3} textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
          {p.label.length > 9 ? `${p.label.slice(0, 8)}…` : p.label}
        </text>
      ))}
    </svg>
  )
}
