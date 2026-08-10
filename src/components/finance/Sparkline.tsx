export default function Sparkline({ data, color = '#92400E', width = 100, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const step = width / (data.length - 1)

  const points = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ')
  const last = data[data.length - 1]
  const lastX = (data.length - 1) * step
  const lastY = height - ((last - min) / range) * (height - 4) - 2

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" role="img" aria-label="גרף מגמה">
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2.5} fill={color} />
    </svg>
  )
}
