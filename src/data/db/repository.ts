import { Item, Project, InboxEntry } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset, BrandContact, BrandDocument } from '../brandTypes'
import { Influencer, InfluencerProduct, InfluencerContent, InfluencerSale } from '../influencerTypes'
import { Campaign, CampaignCreative } from '../campaignTypes'
import { Shipment, ShipmentQuote, ShipmentDocument, ShipmentTimelineEvent, Forwarder } from '../shipmentTypes'
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

  getAllInfluencers: () => getAll<Influencer>(STORES.influencers),
  putInfluencer: (influencer: Influencer) => put(STORES.influencers, influencer),
  deleteInfluencer: (id: string) => remove(STORES.influencers, id),

  getAllInfluencerProducts: () => getAll<InfluencerProduct>(STORES.influencerProducts),
  putInfluencerProduct: (product: InfluencerProduct) => put(STORES.influencerProducts, product),
  deleteInfluencerProduct: (id: string) => remove(STORES.influencerProducts, id),

  getAllInfluencerContent: () => getAll<InfluencerContent>(STORES.influencerContent),
  putInfluencerContent: (content: InfluencerContent) => put(STORES.influencerContent, content),
  deleteInfluencerContent: (id: string) => remove(STORES.influencerContent, id),

  getAllInfluencerSales: () => getAll<InfluencerSale>(STORES.influencerSales),
  putInfluencerSale: (sale: InfluencerSale) => put(STORES.influencerSales, sale),
  deleteInfluencerSale: (id: string) => remove(STORES.influencerSales, id),

  getAllCampaigns: () => getAll<Campaign>(STORES.campaigns),
  putCampaign: (campaign: Campaign) => put(STORES.campaigns, campaign),
  deleteCampaign: (id: string) => remove(STORES.campaigns, id),

  getAllCampaignCreatives: () => getAll<CampaignCreative>(STORES.campaignCreatives),
  putCampaignCreative: (creative: CampaignCreative) => put(STORES.campaignCreatives, creative),
  deleteCampaignCreative: (id: string) => remove(STORES.campaignCreatives, id),

  getAllShipments: () => getAll<Shipment>(STORES.shipments),
  putShipment: (shipment: Shipment) => put(STORES.shipments, shipment),
  deleteShipment: (id: string) => remove(STORES.shipments, id),

  getAllShipmentQuotes: () => getAll<ShipmentQuote>(STORES.shipmentQuotes),
  putShipmentQuote: (quote: ShipmentQuote) => put(STORES.shipmentQuotes, quote),
  deleteShipmentQuote: (id: string) => remove(STORES.shipmentQuotes, id),

  getAllShipmentDocuments: () => getAll<ShipmentDocument>(STORES.shipmentDocuments),
  putShipmentDocument: (doc: ShipmentDocument) => put(STORES.shipmentDocuments, doc),
  deleteShipmentDocument: (id: string) => remove(STORES.shipmentDocuments, id),

  getAllShipmentTimelineEvents: () => getAll<ShipmentTimelineEvent>(STORES.shipmentTimelineEvents),
  putShipmentTimelineEvent: (event: ShipmentTimelineEvent) => put(STORES.shipmentTimelineEvents, event),
  deleteShipmentTimelineEvent: (id: string) => remove(STORES.shipmentTimelineEvents, id),

  getAllForwarders: () => getAll<Forwarder>(STORES.forwarders),
  putForwarder: (forwarder: Forwarder) => put(STORES.forwarders, forwarder),
  deleteForwarder: (id: string) => remove(STORES.forwarders, id),

  getAllBrandContacts: () => getAll<BrandContact>(STORES.brandContacts),
  putBrandContact: (contact: BrandContact) => put(STORES.brandContacts, contact),
  deleteBrandContact: (id: string) => remove(STORES.brandContacts, id),

  getAllBrandDocuments: () => getAll<BrandDocument>(STORES.brandDocuments),
  putBrandDocument: (doc: BrandDocument) => put(STORES.brandDocuments, doc),
  deleteBrandDocument: (id: string) => remove(STORES.brandDocuments, id),

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
    await clearStore(STORES.influencers)
    await clearStore(STORES.influencerProducts)
    await clearStore(STORES.influencerContent)
    await clearStore(STORES.influencerSales)
    await clearStore(STORES.campaigns)
    await clearStore(STORES.campaignCreatives)
    await clearStore(STORES.shipments)
    await clearStore(STORES.shipmentQuotes)
    await clearStore(STORES.shipmentDocuments)
    await clearStore(STORES.shipmentTimelineEvents)
    await clearStore(STORES.forwarders)
    await clearStore(STORES.brandContacts)
    await clearStore(STORES.brandDocuments)
    await setMeta('seeded', 'true')
  },

  isSeeded: () => getMeta('seeded'),
  markSeeded: () => setMeta('seeded', 'true'),
}
