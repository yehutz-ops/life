import { Item, Project, InboxEntry } from '../types'
import { STORES, getAll, put, remove, clearStore, getMeta, setMeta } from './database'

export const repository = {
  getAllItems: () => getAll<Item>(STORES.items),
  putItem: (item: Item) => put(STORES.items, item),
  deleteItem: (id: string) => remove(STORES.items, id),

  getAllProjects: () => getAll<Project>(STORES.projects),
  putProject: (project: Project) => put(STORES.projects, project),
  deleteProject: (id: string) => remove(STORES.projects, id),

  getAllInboxEntries: () => getAll<InboxEntry>(STORES.inbox),
  putInboxEntry: (entry: InboxEntry) => put(STORES.inbox, entry),
  deleteInboxEntry: (id: string) => remove(STORES.inbox, id),

  clearAll: async () => {
    await clearStore(STORES.items)
    await clearStore(STORES.projects)
    await clearStore(STORES.inbox)
    await setMeta('seeded', 'true')
  },

  isSeeded: () => getMeta('seeded'),
  markSeeded: () => setMeta('seeded', 'true'),
}
