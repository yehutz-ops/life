import { repository } from './repository'
import { Item, Project, InboxEntry } from '../types'

interface BackupFile {
  exportedAt: string
  version: 1
  items: Item[]
  projects: Project[]
  inbox: InboxEntry[]
}

export async function exportBackup() {
  const [items, projects, inbox] = await Promise.all([
    repository.getAllItems(),
    repository.getAllProjects(),
    repository.getAllInboxEntries(),
  ])
  const data: BackupFile = { exportedAt: new Date().toISOString(), version: 1, items, projects, inbox }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `life-control-center-backup-${new Date().toISOString().slice(0, 10)}.json`
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
  ])
  await repository.markSeeded()
}
