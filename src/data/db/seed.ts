import { repository } from './repository'
import { sampleItems, sampleProjects, sampleInboxEntries } from '../sampleData'

export async function seedIfEmpty() {
  const seeded = await repository.isSeeded()
  if (seeded === 'true') return

  const [items, projects, inbox] = await Promise.all([
    repository.getAllItems(),
    repository.getAllProjects(),
    repository.getAllInboxEntries(),
  ])
  if (items.length || projects.length || inbox.length) {
    await repository.markSeeded()
    return
  }

  await Promise.all([
    ...sampleItems.map((it) => repository.putItem(it)),
    ...sampleProjects.map((p) => repository.putProject(p)),
    ...sampleInboxEntries.map((e) => repository.putInboxEntry(e)),
  ])
  await repository.markSeeded()
}
