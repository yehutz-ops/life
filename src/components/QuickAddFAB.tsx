import { useQuickAdd } from '../data/QuickAddContext'

export default function QuickAddFAB() {
  const { open } = useQuickAdd()
  return (
    <button
      onClick={open}
      className="fixed bottom-8 left-8 w-14 h-14 rounded-full bg-indigo-600 text-white text-2xl shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center z-40"
      title="מה צריך לזכור?"
    >
      +
    </button>
  )
}
