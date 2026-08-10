import { ReactNode } from 'react'

export default function RadialProgress({
  percent,
  size = 96,
  strokeWidth = 9,
  color = '#92400E',
  children,
}: {
  percent: number
  size?: number
  strokeWidth?: number
  color?: string
  children?: ReactNode
}) {
  const r = (size - strokeWidth) / 2
  const c = 2 * Math.PI * r
  const clamped = Math.min(100, Math.max(0, percent))
  const dash = (clamped / 100) * c

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)}%`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-stone-100 dark:text-stone-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
