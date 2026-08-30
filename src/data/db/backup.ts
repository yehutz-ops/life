import { repository } from './repository'
import { Item, Project, InboxEntry } from '../types'
import { Brand, BrandProduct, BrandCampaign, BrandContentItem, BrandPendingActivity, BrandMediaAsset, BrandContact, BrandDocument } from '../brandTypes'
import { Influencer, InfluencerProduct, InfluencerContent, InfluencerSale } from '../influencerTypes'
import { Campaign, CampaignCreative } from '../campaignTypes'
import { Shipment, ShipmentQuote, ShipmentDocument, ShipmentTimelineEvent, Forwarder } from '../shipmentTypes'
import { MediaAsset, IdeaBankItem, ContentPiece, VideoScript, ContentRule, PromotionPlan } from '../contentStudioTypes'
import { Course, Grade, DegreeRequirementCategory, StudyMaterial } from '../studyTypes'
import { RfqDispatch, RfqUnmatchedEmail } from '../rfqTypes'

interface BackupFile {
  exportedAt: string
  version: 1 | 2 | 3 | 4 | 5 | 6 | 7
  items: Item[]
  projects: Project[]
  inbox: InboxEntry[]
  brands?: Brand[]
  brandProducts?: BrandProduct[]
  brandCampaigns?: BrandCampaign[]
  brandContentItems?: BrandContentItem[]
  brandPendingActivities?: BrandPendingActivity[]
  brandMediaAssets?: BrandMediaAsset[]
  influencers?: Influencer[]
  influencerProducts?: InfluencerProduct[]
  influencerContent?: InfluencerContent[]
  influencerSales?: InfluencerSale[]
  campaigns?: Campaign[]
  campaignCreatives?: CampaignCreative[]
  shipments?: Shipment[]
  shipmentQuotes?: ShipmentQuote[]
  shipmentDocuments?: ShipmentDocument[]
  shipmentTimelineEvents?: ShipmentTimelineEvent[]
  forwarders?: Forwarder[]
  brandContacts?: BrandContact[]
  brandDocuments?: BrandDocument[]
  contentMediaAssets?: MediaAsset[]
  ideaBankItems?: IdeaBankItem[]
  contentPieces?: ContentPiece[]
  videoScripts?: VideoScript[]
  contentRules?: ContentRule[]
  promotionPlans?: PromotionPlan[]
  courses?: Course[]
  grades?: Grade[]
  degreeRequirementCategories?: DegreeRequirementCategory[]
  studyMaterials?: StudyMaterial[]
  rfqDispatches?: RfqDispatch[]
  rfqUnmatchedEmails?: RfqUnmatchedEmail[]
}

async function collectBackupData(): Promise<BackupFile> {
  const [
    items,
    projects,
    inbox,
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
    rfqDispatches,
    rfqUnmatchedEmails,
  ] = await Promise.all([
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
    repository.getAllRfqDispatches(),
    repository.getAllRfqUnmatchedEmails(),
  ])
  return {
    exportedAt: new Date().toISOString(),
    version: 7,
    items,
    projects,
    inbox,
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
    rfqDispatches,
    rfqUnmatchedEmails,
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
    ...(data.influencers ?? []).map((i) => repository.putInfluencer(i)),
    ...(data.influencerProducts ?? []).map((p) => repository.putInfluencerProduct(p)),
    ...(data.influencerContent ?? []).map((c) => repository.putInfluencerContent(c)),
    ...(data.influencerSales ?? []).map((s) => repository.putInfluencerSale(s)),
    ...(data.campaigns ?? []).map((c) => repository.putCampaign(c)),
    ...(data.campaignCreatives ?? []).map((cr) => repository.putCampaignCreative(cr)),
    ...(data.shipments ?? []).map((s) => repository.putShipment(s)),
    ...(data.shipmentQuotes ?? []).map((q) => repository.putShipmentQuote(q)),
    ...(data.shipmentDocuments ?? []).map((d) => repository.putShipmentDocument(d)),
    ...(data.shipmentTimelineEvents ?? []).map((e) => repository.putShipmentTimelineEvent(e)),
    ...(data.forwarders ?? []).map((f) => repository.putForwarder(f)),
    ...(data.brandContacts ?? []).map((c) => repository.putBrandContact(c)),
    ...(data.brandDocuments ?? []).map((d) => repository.putBrandDocument(d)),
    ...(data.contentMediaAssets ?? []).map((m) => repository.putContentMediaAsset(m)),
    ...(data.ideaBankItems ?? []).map((i) => repository.putIdeaBankItem(i)),
    ...(data.contentPieces ?? []).map((c) => repository.putContentPiece(c)),
    ...(data.videoScripts ?? []).map((s) => repository.putVideoScript(s)),
    ...(data.contentRules ?? []).map((r) => repository.putContentRule(r)),
    ...(data.promotionPlans ?? []).map((p) => repository.putPromotionPlan(p)),
    ...(data.courses ?? []).map((c) => repository.putCourse(c)),
    ...(data.grades ?? []).map((g) => repository.putGrade(g)),
    ...(data.degreeRequirementCategories ?? []).map((c) => repository.putDegreeRequirementCategory(c)),
    ...(data.studyMaterials ?? []).map((m) => repository.putStudyMaterial(m)),
    ...(data.rfqDispatches ?? []).map((d) => repository.putRfqDispatch(d)),
    ...(data.rfqUnmatchedEmails ?? []).map((e) => repository.putRfqUnmatchedEmail(e)),
  ])
  await repository.markSeeded()
}
