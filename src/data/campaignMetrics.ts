import { Campaign, CampaignCreative } from './campaignTypes'

function safeDiv(a: number, b: number): number | undefined {
  return b > 0 ? a / b : undefined
}

export interface CampaignMetrics {
  ctr?: number
  cpc?: number
  cpm?: number
  conversionRate?: number
  costPerPurchase?: number
  roas?: number
}

export function computeCampaignMetrics(c: Pick<Campaign, 'spend' | 'impressions' | 'clicks' | 'purchases' | 'revenue'>): CampaignMetrics {
  const spend = c.spend ?? 0
  const impressions = c.impressions ?? 0
  const clicks = c.clicks ?? 0
  const purchases = c.purchases ?? 0
  const revenue = c.revenue ?? 0
  return {
    ctr: safeDiv(clicks, impressions),
    cpc: safeDiv(spend, clicks),
    cpm: impressions > 0 ? (spend / impressions) * 1000 : undefined,
    conversionRate: safeDiv(purchases, clicks),
    costPerPurchase: safeDiv(spend, purchases),
    roas: safeDiv(revenue, spend),
  }
}

export function computeCreativeROAS(creative: Pick<CampaignCreative, 'spend' | 'revenue'>): number | undefined {
  return safeDiv(creative.revenue ?? 0, creative.spend ?? 0)
}

// שדות התאריך של קמפיין מסמנים חלון פעילות; קמפיין בלי תאריכים נחשב "פעיל בכל חודש" (למשל
// חשבון פרסום מתמשך). זו הנחה פשוטה ל-v1 של הזנה ידנית — כשיתחברו נתוני אמת מה-Ads API,
// כל יום/חודש יגיע כרשומה נפרדת ואפשר יהיה להחליף את החישוב הזה בלי לגעת ב-UI.
export function campaignActiveInMonth(campaign: Pick<Campaign, 'startDate' | 'endDate'>, month: string): boolean {
  const start = campaign.startDate?.slice(0, 7)
  const end = campaign.endDate?.slice(0, 7)
  if (start && month < start) return false
  if (end && month > end) return false
  return true
}
