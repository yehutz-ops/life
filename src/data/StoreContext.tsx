import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { Item, Project, InboxEntry, InboxSource, EmailAccountId } from './types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset, BrandContact, BrandDocument } from './brandTypes'
import { Influencer, InfluencerProduct, InfluencerContent, InfluencerSale } from './influencerTypes'
import { Campaign, CampaignCreative } from './campaignTypes'
import { Shipment, ShipmentQuote, ShipmentDocument, ShipmentTimelineEvent, Forwarder } from './shipmentTypes'
import { MediaAsset, IdeaBankItem, ContentPiece, VideoScript, ContentRule, PromotionPlan } from './contentStudioTypes'
import { Course, Grade, DegreeRequirementCategory, StudyMaterial } from './studyTypes'
import { repository } from './db/repository'
import { seedIfEmpty } from './db/seed'
import { isIndexedDBAvailable } from './db/database'
import { newId } from '../utils/id'
import { tomorrowISO, nowISO } from '../utils/date'
import { useNotify } from './NotificationContext'
import { recordDomainCorrection } from '../ai/routingPreferences'
import { getAiLearningEnabled } from '../ai/aiSettings'

interface StoreValue {
  items: Item[]
  projects: Project[]
  inboxEntries: InboxEntry[]
  brands: Brand[]
  brandProducts: BrandProduct[]
  brandCampaigns: BrandCampaign[]
  brandContentItems: BrandContentItem[]
  brandPendingActivities: BrandPendingActivity[]
  brandMediaAssets: BrandMediaAsset[]
  influencers: Influencer[]
  influencerProducts: InfluencerProduct[]
  influencerContent: InfluencerContent[]
  influencerSales: InfluencerSale[]
  campaigns: Campaign[]
  campaignCreatives: CampaignCreative[]
  shipments: Shipment[]
  shipmentQuotes: ShipmentQuote[]
  shipmentDocuments: ShipmentDocument[]
  shipmentTimelineEvents: ShipmentTimelineEvent[]
  forwarders: Forwarder[]
  brandContacts: BrandContact[]
  brandDocuments: BrandDocument[]
  contentMediaAssets: MediaAsset[]
  ideaBankItems: IdeaBankItem[]
  contentPieces: ContentPiece[]
  videoScripts: VideoScript[]
  contentRules: ContentRule[]
  promotionPlans: PromotionPlan[]
  courses: Course[]
  grades: Grade[]
  degreeRequirementCategories: DegreeRequirementCategory[]
  studyMaterials: StudyMaterial[]
  loading: boolean
  storageAvailable: boolean
  addItem: (data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Item>
  updateItem: (id: string, patch: Partial<Item>) => Promise<void>
  deleteItem: (id: string) => Promise<void>
  toggleDone: (id: string) => Promise<void>
  postponeToTomorrow: (id: string) => Promise<void>
  addProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  addInboxEntry: (
    text: string,
    source: InboxSource,
    meta?: { emailAccount?: EmailAccountId; emailFrom?: string; emailSubject?: string },
  ) => Promise<void>
  sortInboxEntry: (entryId: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteInboxEntry: (id: string) => Promise<void>
  addBrand: (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'lastImportedAt'>) => Promise<Brand>
  updateBrand: (id: string, patch: Partial<Brand>) => Promise<void>
  deleteBrand: (id: string) => Promise<void>
  addBrandProduct: (data: Omit<BrandProduct, 'id' | 'createdAt' | 'updatedAt' | 'lastImportedAt'>) => Promise<BrandProduct>
  updateBrandProduct: (id: string, patch: Partial<BrandProduct>) => Promise<void>
  deleteBrandProduct: (id: string) => Promise<void>
  addBrandContact: (data: Omit<BrandContact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BrandContact>
  updateBrandContact: (id: string, patch: Partial<BrandContact>) => Promise<void>
  deleteBrandContact: (id: string) => Promise<void>
  addBrandDocument: (data: Omit<BrandDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<BrandDocument>
  updateBrandDocument: (id: string, patch: Partial<BrandDocument>) => Promise<void>
  deleteBrandDocument: (id: string) => Promise<void>
  addContentMediaAsset: (data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<MediaAsset>
  updateContentMediaAsset: (id: string, patch: Partial<MediaAsset>) => Promise<void>
  deleteContentMediaAsset: (id: string) => Promise<void>
  addIdeaBankItem: (data: Omit<IdeaBankItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IdeaBankItem>
  updateIdeaBankItem: (id: string, patch: Partial<IdeaBankItem>) => Promise<void>
  deleteIdeaBankItem: (id: string) => Promise<void>
  addContentPiece: (data: Omit<ContentPiece, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentPiece>
  updateContentPiece: (id: string, patch: Partial<ContentPiece>) => Promise<void>
  deleteContentPiece: (id: string) => Promise<void>
  addVideoScript: (data: Omit<VideoScript, 'id' | 'createdAt' | 'updatedAt'>) => Promise<VideoScript>
  updateVideoScript: (id: string, patch: Partial<VideoScript>) => Promise<void>
  deleteVideoScript: (id: string) => Promise<void>
  addContentRule: (data: Omit<ContentRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ContentRule>
  deleteContentRule: (id: string) => Promise<void>
  addOrUpdatePromotionPlan: (brandId: string, patch: Partial<Omit<PromotionPlan, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>>) => Promise<PromotionPlan>
  addShipment: (data: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Shipment>
  updateShipment: (id: string, patch: Partial<Shipment>) => Promise<void>
  deleteShipment: (id: string) => Promise<void>
  addShipmentQuote: (data: Omit<ShipmentQuote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ShipmentQuote>
  updateShipmentQuote: (id: string, patch: Partial<ShipmentQuote>) => Promise<void>
  deleteShipmentQuote: (id: string) => Promise<void>
  addShipmentDocument: (data: Omit<ShipmentDocument, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ShipmentDocument>
  deleteShipmentDocument: (id: string) => Promise<void>
  addShipmentTimelineEvent: (data: Omit<ShipmentTimelineEvent, 'id' | 'createdAt'>) => Promise<ShipmentTimelineEvent>
  addForwarder: (data: Omit<Forwarder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Forwarder>
  updateForwarder: (id: string, patch: Partial<Forwarder>) => Promise<void>
  deleteForwarder: (id: string) => Promise<void>
  addInfluencer: (data: Omit<Influencer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Influencer>
  updateInfluencer: (id: string, patch: Partial<Influencer>) => Promise<void>
  deleteInfluencer: (id: string) => Promise<void>
  addInfluencerProduct: (data: Omit<InfluencerProduct, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InfluencerProduct>
  updateInfluencerProduct: (id: string, patch: Partial<InfluencerProduct>) => Promise<void>
  deleteInfluencerProduct: (id: string) => Promise<void>
  addInfluencerContent: (data: Omit<InfluencerContent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InfluencerContent>
  updateInfluencerContent: (id: string, patch: Partial<InfluencerContent>) => Promise<void>
  deleteInfluencerContent: (id: string) => Promise<void>
  addOrUpdateInfluencerSale: (
    influencerId: string,
    month: string,
    patch: Partial<Omit<InfluencerSale, 'id' | 'influencerId' | 'month' | 'createdAt' | 'updatedAt'>>,
  ) => Promise<InfluencerSale>
  addCampaign: (data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Campaign>
  updateCampaign: (id: string, patch: Partial<Campaign>) => Promise<void>
  deleteCampaign: (id: string) => Promise<void>
  addCampaignCreative: (data: Omit<CampaignCreative, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CampaignCreative>
  updateCampaignCreative: (id: string, patch: Partial<CampaignCreative>) => Promise<void>
  deleteCampaignCreative: (id: string) => Promise<void>
  addCourse: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Course>
  updateCourse: (id: string, patch: Partial<Course>) => Promise<void>
  deleteCourse: (id: string) => Promise<void>
  addGrade: (data: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Grade>
  updateGrade: (id: string, patch: Partial<Grade>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
  addDegreeRequirementCategory: (data: Omit<DegreeRequirementCategory, 'id' | 'createdAt' | 'updatedAt'>) => Promise<DegreeRequirementCategory>
  updateDegreeRequirementCategory: (id: string, patch: Partial<DegreeRequirementCategory>) => Promise<void>
  deleteDegreeRequirementCategory: (id: string) => Promise<void>
  addStudyMaterial: (data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StudyMaterial>
  deleteStudyMaterial: (id: string) => Promise<void>
  clearSampleData: () => Promise<void>
  reloadFromDisk: () => Promise<void>
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [inboxEntries, setInboxEntries] = useState<InboxEntry[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandProducts, setBrandProducts] = useState<BrandProduct[]>([])
  const [brandCampaigns, setBrandCampaigns] = useState<BrandCampaign[]>([])
  const [brandContentItems, setBrandContentItems] = useState<BrandContentItem[]>([])
  const [brandPendingActivities, setBrandPendingActivities] = useState<BrandPendingActivity[]>([])
  const [brandMediaAssets, setBrandMediaAssets] = useState<BrandMediaAsset[]>([])
  const [influencers, setInfluencers] = useState<Influencer[]>([])
  const [influencerProducts, setInfluencerProducts] = useState<InfluencerProduct[]>([])
  const [influencerContent, setInfluencerContent] = useState<InfluencerContent[]>([])
  const [influencerSales, setInfluencerSales] = useState<InfluencerSale[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignCreatives, setCampaignCreatives] = useState<CampaignCreative[]>([])
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [shipmentQuotes, setShipmentQuotes] = useState<ShipmentQuote[]>([])
  const [shipmentDocuments, setShipmentDocuments] = useState<ShipmentDocument[]>([])
  const [shipmentTimelineEvents, setShipmentTimelineEvents] = useState<ShipmentTimelineEvent[]>([])
  const [forwarders, setForwarders] = useState<Forwarder[]>([])
  const [brandContacts, setBrandContacts] = useState<BrandContact[]>([])
  const [brandDocuments, setBrandDocuments] = useState<BrandDocument[]>([])
  const [contentMediaAssets, setContentMediaAssets] = useState<MediaAsset[]>([])
  const [ideaBankItems, setIdeaBankItems] = useState<IdeaBankItem[]>([])
  const [contentPieces, setContentPieces] = useState<ContentPiece[]>([])
  const [videoScripts, setVideoScripts] = useState<VideoScript[]>([])
  const [contentRules, setContentRules] = useState<ContentRule[]>([])
  const [promotionPlans, setPromotionPlans] = useState<PromotionPlan[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [degreeRequirementCategories, setDegreeRequirementCategories] = useState<DegreeRequirementCategory[]>([])
  const [studyMaterials, setStudyMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const storageAvailable = isIndexedDBAvailable()
  const notify = useNotify()

  async function loadAll() {
    const [i, p, ib, br, bp, bc, bci, bpa, bma, inf, infp, infc, infs, camp, campc, sh, shq, shd, shte, fw, bcn, bdc, cma, ibi, cp, vs, cr, pp, crs, grd, drc, sm] = await Promise.all([
      repository.getAllItems(),
      repository.getAllProjects(),
      repository.getAllInboxEntries(),
      repository.getAllBrands(),
      repository.getAllBrandProducts(),
      repository.getAllBrandCampaigns(),
      repository.getAllBrandContentItems(),
      repository.getAllBrandPendingActivities(),
      repository.getAllBrandMediaAssets(),
      repository.getAllInfluencers(),
      repository.getAllInfluencerProducts(),
      repository.getAllInfluencerContent(),
      repository.getAllInfluencerSales(),
      repository.getAllCampaigns(),
      repository.getAllCampaignCreatives(),
      repository.getAllShipments(),
      repository.getAllShipmentQuotes(),
      repository.getAllShipmentDocuments(),
      repository.getAllShipmentTimelineEvents(),
      repository.getAllForwarders(),
      repository.getAllBrandContacts(),
      repository.getAllBrandDocuments(),
      repository.getAllContentMediaAssets(),
      repository.getAllIdeaBankItems(),
      repository.getAllContentPieces(),
      repository.getAllVideoScripts(),
      repository.getAllContentRules(),
      repository.getAllPromotionPlans(),
      repository.getAllCourses(),
      repository.getAllGrades(),
      repository.getAllDegreeRequirementCategories(),
      repository.getAllStudyMaterials(),
    ])
    setItems(i)
    setProjects(p)
    setInboxEntries(ib)
    setBrands(br)
    setBrandProducts(bp)
    setBrandCampaigns(bc)
    setBrandContentItems(bci)
    setBrandPendingActivities(bpa)
    setBrandMediaAssets(bma)
    setInfluencers(inf)
    setInfluencerProducts(infp)
    setInfluencerContent(infc)
    setInfluencerSales(infs)
    setCampaigns(camp)
    setCampaignCreatives(campc)
    setShipments(sh)
    setShipmentQuotes(shq)
    setShipmentDocuments(shd)
    setShipmentTimelineEvents(shte)
    setForwarders(fw)
    setBrandContacts(bcn)
    setBrandDocuments(bdc)
    setContentMediaAssets(cma)
    setIdeaBankItems(ibi)
    setContentPieces(cp)
    setVideoScripts(vs)
    setContentRules(cr)
    setPromotionPlans(pp)
    setCourses(crs)
    setGrades(grd)
    setDegreeRequirementCategories(drc)
    setStudyMaterials(sm)
  }

  useEffect(() => {
    if (!storageAvailable) {
      notify('הדפדפן חסם את האחסון המקומי של האתר. המידע לא יישמר בין פתיחות — אפשר לבדוק את הגדרות הפרטיות של הדפדפן.', 'error')
      setLoading(false)
      return
    }
    seedIfEmpty()
      .then(loadAll)
      .catch((err) => notify(`שגיאה בטעינת המידע השמור: ${err.message ?? err}`, 'error'))
      .finally(() => setLoading(false))
  }, [])

  async function addItem(data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const item: Item = { ...data, id: newId('item'), createdAt: now, updatedAt: now }
    try {
      await repository.putItem(item)
      setItems((prev) => [item, ...prev])
      return item
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הפריט: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateItem(id: string, patch: Partial<Item>) {
    const current = items.find((it) => it.id === id)
    if (!current) return
    const next: Item = { ...current, ...patch, updatedAt: nowISO() }
    if (patch.status === 'done' && current.status !== 'done') next.completedAt = nowISO()
    if (patch.status && patch.status !== 'done') next.completedAt = undefined
    try {
      await repository.putItem(next)
      setItems((prev) => prev.map((it) => (it.id === id ? next : it)))
      // תיקון ידני של תחום/יעד — נשמר כהעדפת ניתוב מקומית ללמידה עתידית (לא חוק מוחלט, ראו routingPreferences.ts).
      if (patch.domain && patch.domain !== current.domain && getAiLearningEnabled()) {
        recordDomainCorrection(next.title, next.domain, next.destination).catch(() => {})
      }
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteItem(id: string) {
    try {
      await repository.deleteItem(id)
      setItems((prev) => prev.filter((it) => it.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function toggleDone(id: string) {
    const current = items.find((it) => it.id === id)
    if (!current) return
    await updateItem(id, { status: current.status === 'done' ? 'open' : 'done' })
  }

  async function postponeToTomorrow(id: string) {
    await updateItem(id, { date: tomorrowISO() })
  }

  async function addProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const project: Project = { ...data, id: newId('proj'), createdAt: now, updatedAt: now }
    try {
      await repository.putProject(project)
      setProjects((prev) => [project, ...prev])
      return project
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הפרויקט: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateProject(id: string, patch: Partial<Project>) {
    const current = projects.find((p) => p.id === id)
    if (!current) return
    const next: Project = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putProject(next)
      setProjects((prev) => prev.map((p) => (p.id === id ? next : p)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי בפרויקט: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteProject(id: string) {
    try {
      await repository.deleteProject(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפרויקט: ${err.message ?? err}`, 'error')
    }
  }

  async function addInboxEntry(
    text: string,
    source: InboxSource,
    meta?: { emailAccount?: EmailAccountId; emailFrom?: string; emailSubject?: string },
  ) {
    const entry: InboxEntry = {
      id: newId('inbox'),
      text,
      source,
      createdAt: nowISO(),
      status: 'pending',
      emailAccount: meta?.emailAccount,
      emailFrom: meta?.emailFrom,
      emailSubject: meta?.emailSubject,
    }
    try {
      await repository.putInboxEntry(entry)
      setInboxEntries((prev) => [entry, ...prev])
    } catch (err: any) {
      notify(`לא הצלחתי לשמור בתיבת הכניסה: ${err.message ?? err}`, 'error')
    }
  }

  async function sortInboxEntry(entryId: string, data: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) {
    const entry = inboxEntries.find((e) => e.id === entryId)
    if (!entry) return
    try {
      const item = await addItem(data)
      const next: InboxEntry = { ...entry, status: 'sorted', sortedItemId: item.id }
      await repository.putInboxEntry(next)
      setInboxEntries((prev) => prev.map((e) => (e.id === entryId ? next : e)))
    } catch (err: any) {
      notify(`לא הצלחתי לסדר את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteInboxEntry(id: string) {
    const entry = inboxEntries.find((e) => e.id === id)
    if (!entry) return
    const next: InboxEntry = { ...entry, status: 'deleted' }
    try {
      await repository.putInboxEntry(next)
      setInboxEntries((prev) => prev.map((e) => (e.id === id ? next : e)))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הפריט: ${err.message ?? err}`, 'error')
    }
  }

  async function addBrand(data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt' | 'lastImportedAt'>) {
    const now = nowISO()
    const brand: Brand = { ...data, id: newId('brand'), createdAt: now, updatedAt: now, lastImportedAt: now }
    try {
      await repository.putBrand(brand)
      setBrands((prev) => [brand, ...prev])
      return brand
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המותג: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateBrand(id: string, patch: Partial<Brand>) {
    const current = brands.find((b) => b.id === id)
    if (!current) return
    const next: Brand = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putBrand(next)
      setBrands((prev) => prev.map((b) => (b.id === id ? next : b)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteBrand(id: string) {
    try {
      await repository.deleteBrand(id)
      setBrands((prev) => prev.filter((b) => b.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המותג: ${err.message ?? err}`, 'error')
    }
  }

  async function addBrandProduct(data: Omit<BrandProduct, 'id' | 'createdAt' | 'updatedAt' | 'lastImportedAt'>) {
    const now = nowISO()
    const product: BrandProduct = { ...data, id: newId('brandprod'), createdAt: now, updatedAt: now, lastImportedAt: now }
    try {
      await repository.putBrandProduct(product)
      setBrandProducts((prev) => [product, ...prev])
      return product
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המוצר: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateBrandProduct(id: string, patch: Partial<BrandProduct>) {
    const current = brandProducts.find((p) => p.id === id)
    if (!current) return
    const next: BrandProduct = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putBrandProduct(next)
      setBrandProducts((prev) => prev.map((p) => (p.id === id ? next : p)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteBrandProduct(id: string) {
    try {
      await repository.deleteBrandProduct(id)
      setBrandProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המוצר: ${err.message ?? err}`, 'error')
    }
  }

  async function addBrandContact(data: Omit<BrandContact, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const contact: BrandContact = { ...data, id: newId('contact'), createdAt: now, updatedAt: now }
    try {
      await repository.putBrandContact(contact)
      setBrandContacts((prev) => [contact, ...prev])
      return contact
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את איש הקשר: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateBrandContact(id: string, patch: Partial<BrandContact>) {
    const current = brandContacts.find((c) => c.id === id)
    if (!current) return
    const next: BrandContact = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putBrandContact(next)
      setBrandContacts((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteBrandContact(id: string) {
    try {
      await repository.deleteBrandContact(id)
      setBrandContacts((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את איש הקשר: ${err.message ?? err}`, 'error')
    }
  }

  async function addBrandDocument(data: Omit<BrandDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const doc: BrandDocument = { ...data, id: newId('branddoc'), createdAt: now, updatedAt: now }
    try {
      await repository.putBrandDocument(doc)
      setBrandDocuments((prev) => [doc, ...prev])
      return doc
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המסמך: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateBrandDocument(id: string, patch: Partial<BrandDocument>) {
    const current = brandDocuments.find((d) => d.id === id)
    if (!current) return
    const next: BrandDocument = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putBrandDocument(next)
      setBrandDocuments((prev) => prev.map((d) => (d.id === id ? next : d)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteBrandDocument(id: string) {
    try {
      await repository.deleteBrandDocument(id)
      setBrandDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המסמך: ${err.message ?? err}`, 'error')
    }
  }

  async function addContentMediaAsset(data: Omit<MediaAsset, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const asset: MediaAsset = { ...data, id: newId('media'), createdAt: now, updatedAt: now }
    try {
      await repository.putContentMediaAsset(asset)
      setContentMediaAssets((prev) => [asset, ...prev])
      return asset
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את החומר: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateContentMediaAsset(id: string, patch: Partial<MediaAsset>) {
    const current = contentMediaAssets.find((m) => m.id === id)
    if (!current) return
    const next: MediaAsset = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putContentMediaAsset(next)
      setContentMediaAssets((prev) => prev.map((m) => (m.id === id ? next : m)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteContentMediaAsset(id: string) {
    try {
      await repository.deleteContentMediaAsset(id)
      setContentMediaAssets((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את החומר: ${err.message ?? err}`, 'error')
    }
  }

  async function addIdeaBankItem(data: Omit<IdeaBankItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const item: IdeaBankItem = { ...data, id: newId('idea'), createdAt: now, updatedAt: now }
    try {
      await repository.putIdeaBankItem(item)
      setIdeaBankItems((prev) => [item, ...prev])
      return item
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הרעיון: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateIdeaBankItem(id: string, patch: Partial<IdeaBankItem>) {
    const current = ideaBankItems.find((i) => i.id === id)
    if (!current) return
    const next: IdeaBankItem = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putIdeaBankItem(next)
      setIdeaBankItems((prev) => prev.map((i) => (i.id === id ? next : i)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteIdeaBankItem(id: string) {
    try {
      await repository.deleteIdeaBankItem(id)
      setIdeaBankItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הרעיון: ${err.message ?? err}`, 'error')
    }
  }

  async function addContentPiece(data: Omit<ContentPiece, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const piece: ContentPiece = { ...data, id: newId('content'), createdAt: now, updatedAt: now }
    try {
      await repository.putContentPiece(piece)
      setContentPieces((prev) => [piece, ...prev])
      return piece
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את התוכן: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateContentPiece(id: string, patch: Partial<ContentPiece>) {
    const current = contentPieces.find((c) => c.id === id)
    if (!current) return
    const next: ContentPiece = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putContentPiece(next)
      setContentPieces((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteContentPiece(id: string) {
    try {
      await repository.deleteContentPiece(id)
      setContentPieces((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את התוכן: ${err.message ?? err}`, 'error')
    }
  }

  async function addVideoScript(data: Omit<VideoScript, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const script: VideoScript = { ...data, id: newId('script'), createdAt: now, updatedAt: now }
    try {
      await repository.putVideoScript(script)
      setVideoScripts((prev) => [script, ...prev])
      return script
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את התסריט: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateVideoScript(id: string, patch: Partial<VideoScript>) {
    const current = videoScripts.find((s) => s.id === id)
    if (!current) return
    const next: VideoScript = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putVideoScript(next)
      setVideoScripts((prev) => prev.map((s) => (s.id === id ? next : s)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteVideoScript(id: string) {
    try {
      await repository.deleteVideoScript(id)
      setVideoScripts((prev) => prev.filter((s) => s.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את התסריט: ${err.message ?? err}`, 'error')
    }
  }

  async function addContentRule(data: Omit<ContentRule, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const rule: ContentRule = { ...data, id: newId('rule'), createdAt: now, updatedAt: now }
    try {
      await repository.putContentRule(rule)
      setContentRules((prev) => [rule, ...prev])
      return rule
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הכלל: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function deleteContentRule(id: string) {
    try {
      await repository.deleteContentRule(id)
      setContentRules((prev) => prev.filter((r) => r.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הכלל: ${err.message ?? err}`, 'error')
    }
  }

  async function addOrUpdatePromotionPlan(brandId: string, patch: Partial<Omit<PromotionPlan, 'id' | 'brandId' | 'createdAt' | 'updatedAt'>>) {
    const current = promotionPlans.find((p) => p.brandId === brandId)
    const now = nowISO()
    const next: PromotionPlan = current
      ? { ...current, ...patch, updatedAt: now }
      : { id: newId('promoplan'), brandId, priority: 'medium', ...patch, createdAt: now, updatedAt: now }
    try {
      await repository.putPromotionPlan(next)
      setPromotionPlans((prev) => (current ? prev.map((p) => (p.id === next.id ? next : p)) : [next, ...prev]))
      return next
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את תוכנית הקידום: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function addShipment(data: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const shipment: Shipment = { ...data, id: newId('shipment'), createdAt: now, updatedAt: now }
    try {
      await repository.putShipment(shipment)
      setShipments((prev) => [shipment, ...prev])
      return shipment
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המשלוח: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateShipment(id: string, patch: Partial<Shipment>) {
    const current = shipments.find((s) => s.id === id)
    if (!current) return
    const next: Shipment = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putShipment(next)
      setShipments((prev) => prev.map((s) => (s.id === id ? next : s)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteShipment(id: string) {
    try {
      await repository.deleteShipment(id)
      setShipments((prev) => prev.filter((s) => s.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המשלוח: ${err.message ?? err}`, 'error')
    }
  }

  async function addShipmentQuote(data: Omit<ShipmentQuote, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const quote: ShipmentQuote = { ...data, id: newId('quote'), createdAt: now, updatedAt: now }
    try {
      await repository.putShipmentQuote(quote)
      setShipmentQuotes((prev) => [quote, ...prev])
      return quote
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הצעת המחיר: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateShipmentQuote(id: string, patch: Partial<ShipmentQuote>) {
    const current = shipmentQuotes.find((q) => q.id === id)
    if (!current) return
    const next: ShipmentQuote = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putShipmentQuote(next)
      setShipmentQuotes((prev) => prev.map((q) => (q.id === id ? next : q)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteShipmentQuote(id: string) {
    try {
      await repository.deleteShipmentQuote(id)
      setShipmentQuotes((prev) => prev.filter((q) => q.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הצעת המחיר: ${err.message ?? err}`, 'error')
    }
  }

  async function addShipmentDocument(data: Omit<ShipmentDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const doc: ShipmentDocument = { ...data, id: newId('shipdoc'), createdAt: now, updatedAt: now }
    try {
      await repository.putShipmentDocument(doc)
      setShipmentDocuments((prev) => [doc, ...prev])
      return doc
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המסמך: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function deleteShipmentDocument(id: string) {
    try {
      await repository.deleteShipmentDocument(id)
      setShipmentDocuments((prev) => prev.filter((d) => d.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המסמך: ${err.message ?? err}`, 'error')
    }
  }

  async function addShipmentTimelineEvent(data: Omit<ShipmentTimelineEvent, 'id' | 'createdAt'>) {
    const event: ShipmentTimelineEvent = { ...data, id: newId('timeline'), createdAt: nowISO() }
    try {
      await repository.putShipmentTimelineEvent(event)
      setShipmentTimelineEvents((prev) => [event, ...prev])
      return event
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את האירוע: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function addForwarder(data: Omit<Forwarder, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const forwarder: Forwarder = { ...data, id: newId('forwarder'), createdAt: now, updatedAt: now }
    try {
      await repository.putForwarder(forwarder)
      setForwarders((prev) => [forwarder, ...prev])
      return forwarder
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את חברת השילוח: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateForwarder(id: string, patch: Partial<Forwarder>) {
    const current = forwarders.find((f) => f.id === id)
    if (!current) return
    const next: Forwarder = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putForwarder(next)
      setForwarders((prev) => prev.map((f) => (f.id === id ? next : f)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteForwarder(id: string) {
    try {
      await repository.deleteForwarder(id)
      setForwarders((prev) => prev.filter((f) => f.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את חברת השילוח: ${err.message ?? err}`, 'error')
    }
  }

  async function addInfluencer(data: Omit<Influencer, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const influencer: Influencer = { ...data, id: newId('influencer'), createdAt: now, updatedAt: now }
    try {
      await repository.putInfluencer(influencer)
      setInfluencers((prev) => [influencer, ...prev])
      return influencer
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המשפיען: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateInfluencer(id: string, patch: Partial<Influencer>) {
    const current = influencers.find((i) => i.id === id)
    if (!current) return
    const next: Influencer = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putInfluencer(next)
      setInfluencers((prev) => prev.map((i) => (i.id === id ? next : i)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteInfluencer(id: string) {
    try {
      await repository.deleteInfluencer(id)
      setInfluencers((prev) => prev.filter((i) => i.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המשפיען: ${err.message ?? err}`, 'error')
    }
  }

  async function addInfluencerProduct(data: Omit<InfluencerProduct, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const product: InfluencerProduct = { ...data, id: newId('infprod'), createdAt: now, updatedAt: now }
    try {
      await repository.putInfluencerProduct(product)
      setInfluencerProducts((prev) => [product, ...prev])
      return product
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את המוצר: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateInfluencerProduct(id: string, patch: Partial<InfluencerProduct>) {
    const current = influencerProducts.find((p) => p.id === id)
    if (!current) return
    const next: InfluencerProduct = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putInfluencerProduct(next)
      setInfluencerProducts((prev) => prev.map((p) => (p.id === id ? next : p)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteInfluencerProduct(id: string) {
    try {
      await repository.deleteInfluencerProduct(id)
      setInfluencerProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את המוצר: ${err.message ?? err}`, 'error')
    }
  }

  async function addInfluencerContent(data: Omit<InfluencerContent, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const content: InfluencerContent = { ...data, id: newId('infcontent'), createdAt: now, updatedAt: now }
    try {
      await repository.putInfluencerContent(content)
      setInfluencerContent((prev) => [content, ...prev])
      return content
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את התוכן: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateInfluencerContent(id: string, patch: Partial<InfluencerContent>) {
    const current = influencerContent.find((c) => c.id === id)
    if (!current) return
    const next: InfluencerContent = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putInfluencerContent(next)
      setInfluencerContent((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteInfluencerContent(id: string) {
    try {
      await repository.deleteInfluencerContent(id)
      setInfluencerContent((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את התוכן: ${err.message ?? err}`, 'error')
    }
  }

  async function addOrUpdateInfluencerSale(
    influencerId: string,
    month: string,
    patch: Partial<Omit<InfluencerSale, 'id' | 'influencerId' | 'month' | 'createdAt' | 'updatedAt'>>,
  ) {
    const current = influencerSales.find((s) => s.influencerId === influencerId && s.month === month)
    const now = nowISO()
    const next: InfluencerSale = current
      ? { ...current, ...patch, updatedAt: now }
      : { id: newId('infsale'), influencerId, month, ...patch, createdAt: now, updatedAt: now }
    try {
      await repository.putInfluencerSale(next)
      setInfluencerSales((prev) => (current ? prev.map((s) => (s.id === next.id ? next : s)) : [next, ...prev]))
      return next
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את נתוני המכירות: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function addCampaign(data: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const campaign: Campaign = { ...data, id: newId('campaign'), createdAt: now, updatedAt: now }
    try {
      await repository.putCampaign(campaign)
      setCampaigns((prev) => [campaign, ...prev])
      return campaign
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הקמפיין: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateCampaign(id: string, patch: Partial<Campaign>) {
    const current = campaigns.find((c) => c.id === id)
    if (!current) return
    const next: Campaign = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putCampaign(next)
      setCampaigns((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteCampaign(id: string) {
    try {
      await repository.deleteCampaign(id)
      setCampaigns((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הקמפיין: ${err.message ?? err}`, 'error')
    }
  }

  async function addCampaignCreative(data: Omit<CampaignCreative, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const creative: CampaignCreative = { ...data, id: newId('creative'), createdAt: now, updatedAt: now }
    try {
      await repository.putCampaignCreative(creative)
      setCampaignCreatives((prev) => [creative, ...prev])
      return creative
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הקריאייטיב: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateCampaignCreative(id: string, patch: Partial<CampaignCreative>) {
    const current = campaignCreatives.find((c) => c.id === id)
    if (!current) return
    const next: CampaignCreative = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putCampaignCreative(next)
      setCampaignCreatives((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteCampaignCreative(id: string) {
    try {
      await repository.deleteCampaignCreative(id)
      setCampaignCreatives((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הקריאייטיב: ${err.message ?? err}`, 'error')
    }
  }

  async function addCourse(data: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const course: Course = { ...data, id: newId('course'), createdAt: now, updatedAt: now }
    try {
      await repository.putCourse(course)
      setCourses((prev) => [course, ...prev])
      return course
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הקורס: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateCourse(id: string, patch: Partial<Course>) {
    const current = courses.find((c) => c.id === id)
    if (!current) return
    const next: Course = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putCourse(next)
      setCourses((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteCourse(id: string) {
    try {
      await repository.deleteCourse(id)
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הקורס: ${err.message ?? err}`, 'error')
    }
  }

  async function addGrade(data: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const grade: Grade = { ...data, id: newId('grade'), createdAt: now, updatedAt: now }
    try {
      await repository.putGrade(grade)
      setGrades((prev) => [grade, ...prev])
      return grade
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את הציון: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateGrade(id: string, patch: Partial<Grade>) {
    const current = grades.find((g) => g.id === id)
    if (!current) return
    const next: Grade = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putGrade(next)
      setGrades((prev) => prev.map((g) => (g.id === id ? next : g)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteGrade(id: string) {
    try {
      await repository.deleteGrade(id)
      setGrades((prev) => prev.filter((g) => g.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הציון: ${err.message ?? err}`, 'error')
    }
  }

  async function addDegreeRequirementCategory(data: Omit<DegreeRequirementCategory, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const category: DegreeRequirementCategory = { ...data, id: newId('degreecat'), createdAt: now, updatedAt: now }
    try {
      await repository.putDegreeRequirementCategory(category)
      setDegreeRequirementCategories((prev) => [category, ...prev])
      return category
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את קטגוריית הדרישות: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function updateDegreeRequirementCategory(id: string, patch: Partial<DegreeRequirementCategory>) {
    const current = degreeRequirementCategories.find((c) => c.id === id)
    if (!current) return
    const next: DegreeRequirementCategory = { ...current, ...patch, updatedAt: nowISO() }
    try {
      await repository.putDegreeRequirementCategory(next)
      setDegreeRequirementCategories((prev) => prev.map((c) => (c.id === id ? next : c)))
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את השינוי: ${err.message ?? err}`, 'error')
    }
  }

  async function deleteDegreeRequirementCategory(id: string) {
    try {
      await repository.deleteDegreeRequirementCategory(id)
      setDegreeRequirementCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את הקטגוריה: ${err.message ?? err}`, 'error')
    }
  }

  async function addStudyMaterial(data: Omit<StudyMaterial, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowISO()
    const material: StudyMaterial = { ...data, id: newId('studymat'), createdAt: now, updatedAt: now }
    try {
      await repository.putStudyMaterial(material)
      setStudyMaterials((prev) => [material, ...prev])
      return material
    } catch (err: any) {
      notify(`לא הצלחתי לשמור את חומר הלימוד: ${err.message ?? err}`, 'error')
      throw err
    }
  }

  async function deleteStudyMaterial(id: string) {
    try {
      await repository.deleteStudyMaterial(id)
      setStudyMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch (err: any) {
      notify(`לא הצלחתי למחוק את חומר הלימוד: ${err.message ?? err}`, 'error')
    }
  }

  async function clearSampleData() {
    try {
      await repository.clearAll()
      setItems([])
      setProjects([])
      setInboxEntries([])
      setBrands([])
      setBrandProducts([])
      setBrandCampaigns([])
      setBrandContentItems([])
      setBrandPendingActivities([])
      setBrandMediaAssets([])
      setInfluencers([])
      setInfluencerProducts([])
      setInfluencerContent([])
      setInfluencerSales([])
      setCampaigns([])
      setCampaignCreatives([])
      setShipments([])
      setShipmentQuotes([])
      setShipmentDocuments([])
      setShipmentTimelineEvents([])
      setForwarders([])
      setBrandContacts([])
      setBrandDocuments([])
      setContentMediaAssets([])
      setIdeaBankItems([])
      setContentPieces([])
      setVideoScripts([])
      setContentRules([])
      setPromotionPlans([])
      setCourses([])
      setGrades([])
      setDegreeRequirementCategories([])
      setStudyMaterials([])
      notify('כל המידע נמחק. אפשר להתחיל מחדש.', 'success')
    } catch (err: any) {
      notify(`המחיקה נכשלה: ${err.message ?? err}`, 'error')
    }
  }

  const value = useMemo<StoreValue>(
    () => ({
      items,
      projects,
      inboxEntries,
      brands,
      brandProducts,
      brandCampaigns,
      brandContentItems,
      brandPendingActivities,
      brandMediaAssets,
      influencers,
      influencerProducts,
      influencerContent,
      influencerSales,
      campaigns,
      campaignCreatives,
      shipments,
      shipmentQuotes,
      shipmentDocuments,
      shipmentTimelineEvents,
      forwarders,
      brandContacts,
      brandDocuments,
      contentMediaAssets,
      ideaBankItems,
      contentPieces,
      videoScripts,
      contentRules,
      promotionPlans,
      courses,
      grades,
      degreeRequirementCategories,
      studyMaterials,
      loading,
      storageAvailable,
      addItem,
      updateItem,
      deleteItem,
      toggleDone,
      postponeToTomorrow,
      addProject,
      updateProject,
      deleteProject,
      addInboxEntry,
      sortInboxEntry,
      deleteInboxEntry,
      addBrand,
      updateBrand,
      deleteBrand,
      addBrandProduct,
      updateBrandProduct,
      deleteBrandProduct,
      addBrandContact,
      updateBrandContact,
      deleteBrandContact,
      addBrandDocument,
      updateBrandDocument,
      deleteBrandDocument,
      addContentMediaAsset,
      updateContentMediaAsset,
      deleteContentMediaAsset,
      addIdeaBankItem,
      updateIdeaBankItem,
      deleteIdeaBankItem,
      addContentPiece,
      updateContentPiece,
      deleteContentPiece,
      addVideoScript,
      updateVideoScript,
      deleteVideoScript,
      addContentRule,
      deleteContentRule,
      addOrUpdatePromotionPlan,
      addShipment,
      updateShipment,
      deleteShipment,
      addShipmentQuote,
      updateShipmentQuote,
      deleteShipmentQuote,
      addShipmentDocument,
      deleteShipmentDocument,
      addShipmentTimelineEvent,
      addForwarder,
      updateForwarder,
      deleteForwarder,
      addInfluencer,
      updateInfluencer,
      deleteInfluencer,
      addInfluencerProduct,
      updateInfluencerProduct,
      deleteInfluencerProduct,
      addInfluencerContent,
      updateInfluencerContent,
      deleteInfluencerContent,
      addOrUpdateInfluencerSale,
      addCampaign,
      updateCampaign,
      deleteCampaign,
      addCampaignCreative,
      updateCampaignCreative,
      deleteCampaignCreative,
      addCourse,
      updateCourse,
      deleteCourse,
      addGrade,
      updateGrade,
      deleteGrade,
      addDegreeRequirementCategory,
      updateDegreeRequirementCategory,
      deleteDegreeRequirementCategory,
      addStudyMaterial,
      deleteStudyMaterial,
      clearSampleData,
      reloadFromDisk: loadAll,
    }),
    [
      items,
      projects,
      inboxEntries,
      brands,
      brandProducts,
      brandCampaigns,
      brandContentItems,
      brandPendingActivities,
      brandMediaAssets,
      influencers,
      influencerProducts,
      influencerContent,
      influencerSales,
      campaigns,
      campaignCreatives,
      shipments,
      shipmentQuotes,
      shipmentDocuments,
      shipmentTimelineEvents,
      forwarders,
      brandContacts,
      brandDocuments,
      contentMediaAssets,
      ideaBankItems,
      contentPieces,
      videoScripts,
      contentRules,
      promotionPlans,
      courses,
      grades,
      degreeRequirementCategories,
      studyMaterials,
      loading,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
