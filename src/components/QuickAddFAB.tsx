import { useQuickAdd } from '../data/QuickAddContext'

export default function QuickAddFAB() {
  const { open } = useQuickAdd()
  return (
    <button
      onClick={open}
      className="fixed bottom-8 left-8 w-14 h-14 rounded-full bg-amber-800 text-white text-2xl shadow-lg hover:bg-amber-900 transition-colors flex items-center justify-center z-40"
      title="מה צריך לזכור?"
    >
      +
    </button>
  )
}
