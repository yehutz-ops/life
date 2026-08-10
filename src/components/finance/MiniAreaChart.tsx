export default function MiniAreaChart({
  data,
  labels,
  color = '#92400E',
  height = 100,
}: {
  data: number[]
  labels?: string[]
  color?: string
  height?: number
}) {
  const width = 100
  const max = Math.max(...data)
  const min = Math.min(0, ...data)
  const range = max - min || 1
  const stepX = width / (data.length - 1 || 1)

  function toY(v: number) {
    return height - ((v - min) / range) * (height - 16) - 8
  }

  const line = data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(v)}`).join(' ')
  const area = `${line} L ${(data.length - 1) * stepX} ${height} L 0 ${height} Z`
  const gradientId = `mini-area-${color.replace('#', '')}`

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="גרף מגמה">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={0.9} vectorEffect="non-scaling-stroke" />
        <circle cx={(data.length - 1) * stepX} cy={toY(data[data.length - 1])} r={2} fill={color} vectorEffect="non-scaling-stroke" />
      </svg>
      {labels && (
        <div className="flex justify-between mt-1 text-[10px] text-stone-400 dark:text-stone-500">
          {labels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}
    </div>
  )
}
