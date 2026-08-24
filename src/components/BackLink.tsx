import { Link } from 'react-router-dom'

// גרסת טקסט תיאורי לכפתור החזרה — משמשת בדפי פרטים (חזרה לרשימת הישויות), בניגוד ל-BackButton
// (אייקון בלבד) שמשמש בדפי-אב/רשימה. שתי הגרסאות מכוונות, לא כפילות בטעות.
export default function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300">
      ← {label}
    </Link>
  )
}
