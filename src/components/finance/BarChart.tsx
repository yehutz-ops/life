export interface BarPoint {
  label: string
  value: number
}

export default function BarChart({
  data,
  height = 90,
  color = '#92400E',
  valueSuffix = '₪',
}: {
  data: BarPoint[]
  height?: number
  color?: string
  valueSuffix?: string
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1

  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height }}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5 group">
            <span className="text-[10px] text-stone-400 dark:text-stone-500 opacity-0 group-hover:opacity-100 transition-opacity">
              {d.value.toLocaleString('he-IL')}
              {valueSuffix}
            </span>
            <div
              className="w-full rounded-t-md transition-all duration-150 group-hover:opacity-80"
              style={{ height: `${(d.value / max) * 100}%`, background: color, minHeight: 3 }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 text-[10px] text-stone-400 dark:text-stone-500">
        {data.map((d) => (
          <span key={d.label} className="flex-1 text-center">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
