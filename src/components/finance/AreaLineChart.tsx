export interface AreaSeriesPoint {
  month: string
  income: number
  expenses: number
}

export default function AreaLineChart({ data, height = 160 }: { data: AreaSeriesPoint[]; height?: number }) {
  const width = 100 // אחוזים, viewBox יחסי — נשלט על ידי הרוחב האמיתי של הקונטיינר
  const allValues = data.flatMap((d) => [d.income, d.expenses])
  const max = Math.max(...allValues)
  const min = Math.min(0, ...allValues)
  const range = max - min || 1
  const stepX = width / (data.length - 1 || 1)

  function toY(v: number) {
    return height - ((v - min) / range) * (height - 20) - 10
  }

  function linePath(key: 'income' | 'expenses') {
    return data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(d[key])}`).join(' ')
  }

  function areaPath(key: 'income' | 'expenses') {
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${i * stepX} ${toY(d[key])}`).join(' ')
    return `${line} L ${(data.length - 1) * stepX} ${height} L 0 ${height} Z`
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-2 text-xs">
        <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
          <span className="w-2 h-2 rounded-full bg-amber-800" />
          הכנסות
        </span>
        <span className="flex items-center gap-1.5 text-stone-500 dark:text-stone-400">
          <span className="w-2 h-2 rounded-full bg-stone-400" />
          הוצאות
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} role="img" aria-label="הכנסות מול הוצאות לפי חודשים">
        <defs>
          <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#92400E" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#92400E" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="expensesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A8A29E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#A8A29E" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath('income')} fill="url(#incomeFill)" />
        <path d={areaPath('expenses')} fill="url(#expensesFill)" />
        <path d={linePath('income')} fill="none" stroke="#92400E" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
        <path d={linePath('expenses')} fill="none" stroke="#A8A29E" strokeWidth={0.8} vectorEffect="non-scaling-stroke" />
      </svg>

      <div className="flex justify-between mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
        {data.map((d) => (
          <span key={d.month}>{d.month}</span>
        ))}
      </div>
    </div>
  )
}
