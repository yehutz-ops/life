import { Item, Project, InboxEntry } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset } from '../brandTypes'
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

  getAllBrands: () => getAll<Brand>(STORES.brands),
  putBrand: (brand: Brand) => put(STORES.brands, brand),
  deleteBrand: (id: string) => remove(STORES.brands, id),

  getAllBrandProducts: () => getAll<BrandProduct>(STORES.brandProducts),
  putBrandProduct: (product: BrandProduct) => put(STORES.brandProducts, product),
  deleteBrandProduct: (id: string) => remove(STORES.brandProducts, id),

  getAllBrandCampaigns: () => getAll<BrandCampaign>(STORES.brandCampaigns),
  putBrandCampaign: (campaign: BrandCampaign) => put(STORES.brandCampaigns, campaign),
  deleteBrandCampaign: (id: string) => remove(STORES.brandCampaigns, id),

  getAllBrandContentItems: () => getAll<BrandContentItem>(STORES.brandContentItems),
  putBrandContentItem: (item: BrandContentItem) => put(STORES.brandContentItems, item),
  deleteBrandContentItem: (id: string) => remove(STORES.brandContentItems, id),

  getAllBrandPendingActivities: () => getAll<BrandPendingActivity>(STORES.brandPendingActivities),
  putBrandPendingActivity: (activity: BrandPendingActivity) => put(STORES.brandPendingActivities, activity),
  deleteBrandPendingActivity: (id: string) => remove(STORES.brandPendingActivities, id),

  getAllBrandMediaAssets: () => getAll<BrandMediaAsset>(STORES.brandMediaAssets),
  putBrandMediaAsset: (asset: BrandMediaAsset) => put(STORES.brandMediaAssets, asset),
  deleteBrandMediaAsset: (id: string) => remove(STORES.brandMediaAssets, id),

  clearAll: async () => {
    await clearStore(STORES.items)
    await clearStore(STORES.projects)
    await clearStore(STORES.inbox)
    await clearStore(STORES.brands)
    await clearStore(STORES.brandProducts)
    await clearStore(STORES.brandCampaigns)
    await clearStore(STORES.brandContentItems)
    await clearStore(STORES.brandPendingActivities)
    await clearStore(STORES.brandMediaAssets)
    await setMeta('seeded', 'true')
  },

  isSeeded: () => getMeta('seeded'),
  markSeeded: () => setMeta('seeded', 'true'),
}
