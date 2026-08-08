export default function SearchField({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full sm:w-64 rounded-xl border border-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 px-3.5 py-2 text-sm placeholder:text-stone-400 ${className}`}
    />
  )
}
