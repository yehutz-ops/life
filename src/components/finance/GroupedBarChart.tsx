import { useState } from 'react'

export interface GroupedBarPoint {
  label: string
  a: number
  b: number
}

// שתי סדרות זו לצד זו לכל תקופה. מינימלי במכוון: בלי מסגרת, קווי רשת עדינים בלבד,
// וערך מדויק מופיע רק ב-hover.
export default function GroupedBarChart({
  data,
  height = 190,
  colorA = '#3557D6',
  colorB = '#D6B98C',
  labelA,
  labelB,
  formatValue = (v) => v.toLocaleString('he-IL'),
}: {
  data: GroupedBarPoint[]
  height?: number
  colorA?: string
  colorB?: string
  labelA: string
  labelB: string
  formatValue?: (v: number) => string
}) {
  const [hovered, setHovered] = useState<number | null>(null)
  const max = Math.max(1, ...data.flatMap((d) => [d.a, d.b]))
  // סקאלה מעוגלת כלפי מעלה כדי שתווית הציר העליונה תהיה מספר נעים.
  const step = Math.pow(10, Math.floor(Math.log10(max))) / 2
  const top = Math.ceil(max / step) * step
  const ticks = [0, top / 2, top]

  return (
    <div>
      <div className="flex items-center gap-4 mb-2.5 justify-end">
        <span className="flex items-center gap-1.5 text-[10.5px] text-stone-600 dark:text-stone-300">
          <span className="w-2 h-2 rounded-sm" style={{ background: colorB }} />
          {labelB}
        </span>
        <span className="flex items-center gap-1.5 text-[10.5px] text-stone-600 dark:text-stone-300">
          <span className="w-2 h-2 rounded-sm" style={{ background: colorA }} />
          {labelA}
        </span>
      </div>

      <div className="flex" style={{ height }}>
        <div className="relative shrink-0 w-10">
          {ticks.map((t, i) => (
            <div
              key={t}
              className="absolute inset-x-0 text-[10px] text-stone-400 dark:text-stone-500 text-start"
              style={{ bottom: (i / (ticks.length - 1)) * (height - 18) + 12, transform: 'translateY(50%)' }}
            >
              {t >= 1000 ? `${Math.round(t / 1000)}K` : t}
            </div>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          {ticks.map((t, i) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-stone-100 dark:border-stone-800"
              style={{ bottom: (i / (ticks.length - 1)) * (height - 18) + 12 }}
            />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-1" style={{ paddingBottom: 12 }}>
            {data.map((d, i) => (
              <div
                key={d.label}
                className="flex-1 flex flex-col items-center justify-end h-full min-w-0"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="w-full flex items-end justify-center gap-[3px] h-full">
                  <div
                    className="w-[38%] rounded-t-[3px] transition-all"
                    style={{ height: `${(d.a / top) * 100}%`, background: colorA, minHeight: d.a > 0 ? 2 : 0, opacity: hovered === null || hovered === i ? 1 : 0.45 }}
                  />
                  <div
                    className="w-[38%] rounded-t-[3px] transition-all"
                    style={{ height: `${(d.b / top) * 100}%`, background: colorB, minHeight: d.b > 0 ? 2 : 0, opacity: hovered === null || hovered === i ? 1 : 0.45 }}
                  />
                </div>
                <span className="text-[10px] text-stone-500 dark:text-stone-400 mt-1.5 whitespace-nowrap text-center">{d.label}</span>
              </div>
            ))}
          </div>

          {hovered !== null && (
            <div className="absolute top-0 inset-x-0 flex justify-center pointer-events-none">
              <div className="bg-stone-800 text-white text-[10px] rounded-lg px-2 py-1 shadow-lg whitespace-nowrap">
                {data[hovered].label} · {labelA} {formatValue(data[hovered].a)} · {labelB} {formatValue(data[hovered].b)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
