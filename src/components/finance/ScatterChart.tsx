import { useState } from 'react'

export interface ScatterPoint {
  id: string
  x: number
  y: number
  label: string
  color: string
  meta?: string
}

// פיזור מינימלי: קווי רשת עדינים בלבד, בלי מסגרת כבדה. Tooltip מופיע ב-hover על נקודה.
export default function ScatterChart({
  points,
  height = 190,
  xLabel,
  yLabel,
  formatX = (v) => String(v),
  formatY = (v) => String(v),
}: {
  points: ScatterPoint[]
  height?: number
  xLabel?: string
  yLabel?: string
  formatX?: (v: number) => string
  formatY?: (v: number) => string
}) {
  const [hovered, setHovered] = useState<string | null>(null)
  const width = 340
  const padLeft = 44
  const padRight = 14
  const padTop = 14
  const padBottom = 30

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-stone-300 dark:text-stone-600 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl" style={{ height }}>
        אין עדיין הצעות עם מחיר וזמן מעבר
      </div>
    )
  }

  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  // שוליים סביב הנתונים כדי שנקודות לא יישבו בדיוק על הציר.
  const xMin = Math.min(...xs)
  const xMax = Math.max(...xs)
  const yMin = Math.min(...ys)
  const yMax = Math.max(...ys)
  const xPad = (xMax - xMin || 2) * 0.25
  const yPad = (yMax - yMin || Math.max(1, yMax * 0.1)) * 0.25
  const x0 = Math.max(0, xMin - xPad)
  const x1 = xMax + xPad
  const y0 = Math.max(0, yMin - yPad)
  const y1 = yMax + yPad

  const plotW = width - padLeft - padRight
  const plotH = height - padTop - padBottom

  const sx = (v: number) => padLeft + ((v - x0) / (x1 - x0 || 1)) * plotW
  const sy = (v: number) => padTop + (1 - (v - y0) / (y1 - y0 || 1)) * plotH

  const yTicks = [y0, y0 + (y1 - y0) / 2, y1]
  const xTicks = [x0, x0 + (x1 - x0) / 2, x1]
  const active = points.find((p) => p.id === hovered)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} role="img" aria-label="מחיר מול זמן מעבר">
      {yTicks.map((t, i) => (
        <g key={`y${i}`}>
          <line x1={padLeft} x2={width - padRight} y1={sy(t)} y2={sy(t)} stroke="currentColor" strokeWidth={1} className="text-stone-100 dark:text-stone-800" />
          <text x={padLeft - 6} y={sy(t) + 3} textAnchor="end" className="fill-stone-300 dark:fill-stone-600" style={{ fontSize: 9 }}>
            {formatY(t)}
          </text>
        </g>
      ))}

      {xTicks.map((t, i) => (
        <text key={`x${i}`} x={sx(t)} y={height - padBottom + 14} textAnchor="middle" className="fill-stone-300 dark:fill-stone-600" style={{ fontSize: 9 }}>
          {formatX(t)}
        </text>
      ))}

      {points.map((p) => (
        <circle
          key={p.id}
          cx={sx(p.x)}
          cy={sy(p.y)}
          r={hovered === p.id ? 8 : 6}
          fill={p.color}
          fillOpacity={hovered && hovered !== p.id ? 0.35 : 0.9}
          stroke="#fff"
          strokeWidth={1.5}
          className="cursor-pointer transition-all"
          onMouseEnter={() => setHovered(p.id)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {active && (
        <g>
          <text x={sx(active.x)} y={Math.max(10, sy(active.y) - 13)} textAnchor="middle" className="fill-stone-800 dark:fill-stone-100" style={{ fontSize: 10, fontWeight: 700 }}>
            {active.label}
          </text>
          {active.meta && (
            <text x={sx(active.x)} y={Math.max(20, sy(active.y) - 3)} textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
              {active.meta}
            </text>
          )}
        </g>
      )}

      {xLabel && (
        <text x={padLeft + plotW / 2} y={height - 2} textAnchor="middle" className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
          {xLabel}
        </text>
      )}
      {yLabel && (
        <text x={10} y={padTop - 4} className="fill-stone-400 dark:fill-stone-500" style={{ fontSize: 9 }}>
          {yLabel}
        </text>
      )}
    </svg>
  )
}
