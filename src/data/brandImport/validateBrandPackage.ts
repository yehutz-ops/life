// בדיקות תקינות גנריות לחבילת מותג — רצות תמיד לפני הצגת Preview ולפני כל כתיבה.
// אין כאן שום דבר ספציפי ל-FOMOWA.

const SECRET_KEY_PATTERN = /(api[_-]?key|secret|password|token|access[_-]?key|client[_-]?secret|auth)/i
const SECRET_VALUE_PATTERN = /(sk-[A-Za-z0-9]{10,}|ya29\.[A-Za-z0-9_-]{10,}|AIza[A-Za-z0-9_-]{10,}|xox[baprs]-[A-Za-z0-9-]{10,}|[A-Za-z0-9]{32,})/

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export function validateBrandPackage(raw: unknown): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['הקובץ אינו אובייקט JSON תקין'], warnings: [] }
  }
  const data = raw as any

  if (data.export_type && data.export_type !== 'brand_knowledge_package') {
    warnings.push(`export_type לא מוכר: "${data.export_type}" — ממשיך בכל זאת`)
  }
  if (!data.schema_version) {
    warnings.push('לא צוין schema_version בקובץ')
  } else if (data.schema_version !== '1.0') {
    warnings.push(`schema_version "${data.schema_version}" שונה מהגרסה הידועה ("1.0") — ייבוא עלול להיות חלקי`)
  }

  if (!data.brand || typeof data.brand !== 'object') errors.push('חסר אובייקט brand')
  else {
    if (!data.brand.id) errors.push('ל-brand אין id')
    if (!data.brand.name) errors.push('ל-brand אין name')
  }
  if (!Array.isArray(data.products)) errors.push('products חייב להיות מערך')
  if (!Array.isArray(data.content_items)) errors.push('content_items חייב להיות מערך')
  if (data.campaigns && !Array.isArray(data.campaigns)) errors.push('campaigns חייב להיות מערך')
  if (data.pending_activities && !Array.isArray(data.pending_activities)) errors.push('pending_activities חייב להיות מערך')
  if (data.open_tasks && !Array.isArray(data.open_tasks)) errors.push('open_tasks חייב להיות מערך')

  if (errors.length) return { valid: false, errors, warnings }

  // מזהים כפולים בתוך הקובץ עצמו
  const idCounts = new Map<string, number>()
  const walk = (obj: unknown) => {
    if (Array.isArray(obj)) {
      obj.forEach(walk)
    } else if (obj && typeof obj === 'object') {
      const rec = obj as Record<string, unknown>
      if (typeof rec.id === 'string' || typeof rec.id === 'number') {
        const id = String(rec.id)
        idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
      }
      Object.values(rec).forEach(walk)
    }
  }
  walk(data)
  const duplicateIds = [...idCounts.entries()].filter(([, count]) => count > 1).map(([id]) => id)
  if (duplicateIds.length) errors.push(`נמצאו מזהים כפולים בתוך הקובץ: ${duplicateIds.join(', ')}`)

  // מספר מוצרים/פריטי תוכן — לא חוסם, רק אזהרה אם חורג מהצפוי הרגיל (5 מוצרים, לרוב 10-40 פריטי תוכן)
  if (data.products.length === 0) warnings.push('אין אף מוצר בקובץ')
  if (data.content_items.length === 0) warnings.push('אין אף פריט תוכן בקובץ')

  // סריקת מפתחות/סיסמאות/טוקנים — חוסמת ייבוא לגמרי אם נמצא משהו חשוד
  const secretFindings: string[] = []
  const scanSecrets = (obj: unknown, path: string) => {
    if (Array.isArray(obj)) {
      obj.forEach((v, i) => scanSecrets(v, `${path}[${i}]`))
    } else if (obj && typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        if (SECRET_KEY_PATTERN.test(k)) secretFindings.push(`${path}.${k}`)
        if (typeof v === 'string' && SECRET_VALUE_PATTERN.test(v)) secretFindings.push(`${path}.${k} (ערך חשוד)`)
        scanSecrets(v, `${path}.${k}`)
      }
    }
  }
  scanSecrets(data, '$')
  if (secretFindings.length) {
    errors.push(`נמצא מידע שנראה כמו מפתח/סיסמה/טוקן — הייבוא נחסם מטעמי בטיחות: ${secretFindings.join(', ')}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}
