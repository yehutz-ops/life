import { repository } from './repository'
import { Item, Project, InboxEntry } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset } from '../brandTypes'

interface BackupFile {
  exportedAt: string
  version: 1 | 2
  items: Item[]
  projects: Project[]
  inbox: InboxEntry[]
  brands?: Brand[]
  brandProducts?: BrandProduct[]
  brandCampaigns?: BrandCampaign[]
  brandContentItems?: BrandContentItem[]
  brandPendingActivities?: BrandPendingActivity[]
  brandMediaAssets?: BrandMediaAsset[]
}

async function collectBackupData(): Promise<BackupFile> {
  const [items, projects, inbox, brands, brandProducts, brandCampaigns, brandContentItems, brandPendingActivities, brandMediaAssets] = await Promise.all([
    repository.getAllItems(),
    repository.getAllProjects(),
    repository.getAllInboxEntries(),
    repository.getAllBrands(),
    repository.getAllBrandProducts(),
    repository.getAllBrandCampaigns(),
    repository.getAllBrandContentItems(),
    repository.getAllBrandPendingActivities(),
    repository.getAllBrandMediaAssets(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    version: 2,
    items,
    projects,
    inbox,
    brands,
    brandProducts,
    brandCampaigns,
    brandContentItems,
    brandPendingActivities,
    brandMediaAssets,
  }
}

export async function exportBackup() {
  const data = await collectBackupData()
  downloadBackupFile(data)
}

// גיבוי בטיחות אוטומטי לפני כתיבה מסוכנת (כמו ייבוא חבילת מותג) — אותו קובץ גיבוי,
// עם שם קובץ שמזהה את ההקשר.
export async function exportSafetyBackup(reason: string): Promise<void> {
  const data = await collectBackupData()
  downloadBackupFile(data, `life-control-center-backup-before-${reason}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
}

function downloadBackupFile(data: BackupFile, filename?: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename ?? `life-control-center-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function parseBackupFile(text: string): BackupFile {
  const data = JSON.parse(text)
  if (!data || !Array.isArray(data.items) || !Array.isArray(data.projects) || !Array.isArray(data.inbox)) {
    throw new Error('הקובץ הזה לא נראה כמו קובץ גיבוי תקין של Life Control Center')
  }
  return data as BackupFile
}

export async function importBackup(data: BackupFile) {
  await repository.clearAll()
  await Promise.all([
    ...data.items.map((it) => repository.putItem(it)),
    ...data.projects.map((p) => repository.putProject(p)),
    ...data.inbox.map((e) => repository.putInboxEntry(e)),
    ...(data.brands ?? []).map((b) => repository.putBrand(b)),
    ...(data.brandProducts ?? []).map((p) => repository.putBrandProduct(p)),
    ...(data.brandCampaigns ?? []).map((c) => repository.putBrandCampaign(c)),
    ...(data.brandContentItems ?? []).map((c) => repository.putBrandContentItem(c)),
    ...(data.brandPendingActivities ?? []).map((a) => repository.putBrandPendingActivity(a)),
    ...(data.brandMediaAssets ?? []).map((m) => repository.putBrandMediaAsset(m)),
  ])
  await repository.markSeeded()
}
