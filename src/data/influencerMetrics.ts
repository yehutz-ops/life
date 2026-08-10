import { Influencer, InfluencerProduct, InfluencerContent, InfluencerSale } from './influencerTypes'
import { todayISO } from '../utils/date'

// שכבת חישוב טהורה — כל הפונקציות כאן פועלות על הרשומות הגולמיות (שהוזנו ידנית כרגע) ומחזירות
// מספרים גזורים. כשבעתיד יתחברו מקורות אמיתיים (Meta/TikTok/מערכת מכירות), רק אופן ההזנה של
// הרשומות הגולמיות ישתנה — הפונקציות האלה ימשיכו לעבוד בלי שינוי.

export function currentMonth(): string {
  return todayISO().slice(0, 7)
}

function monthOf(dateIso?: string): string | undefined {
  return dateIso ? dateIso.slice(0, 7) : undefined
}

function safeDiv(a: number, b: number): number | undefined {
  return b > 0 ? a / b : undefined
}

function agreementCoversMonth(influencer: Influencer, month: string): boolean {
  const a = influencer.agreement
  if (!a) return false
  const start = a.startDate ? a.startDate.slice(0, 7) : undefined
  const end = a.endDate ? a.endDate.slice(0, 7) : undefined
  if (start && month < start) return false
  if (end && month > end) return false
  return true
}

export interface ContentCounts {
  reels: number
  tiktoks: number
  stories: number
  posts: number
  total: number
}

function emptyCounts(): ContentCounts {
  return { reels: 0, tiktoks: 0, stories: 0, posts: 0, total: 0 }
}

export function agreementRequiredCounts(influencer: Influencer): ContentCounts {
  const a = influencer.agreement
  const counts = emptyCounts()
  if (!a) return counts
  counts.reels = a.reelsRequired ?? 0
  counts.tiktoks = a.tiktoksRequired ?? 0
  counts.stories = a.storiesRequired ?? 0
  counts.posts = a.postsRequired ?? 0
  counts.total = counts.reels + counts.tiktoks + counts.stories + counts.posts
  return counts
}

function contentTypeCountKey(contentType: InfluencerContent['contentType']): keyof ContentCounts | null {
  if (contentType === 'reel') return 'reels'
  if (contentType === 'tiktok') return 'tiktoks'
  if (contentType === 'story') return 'stories'
  if (contentType === 'post') return 'posts'
  return null
}

export function publishedContentCounts(content: InfluencerContent[], influencerId: string, month: string): ContentCounts {
  const counts = emptyCounts()
  content
    .filter((c) => c.influencerId === influencerId && c.status === 'published' && monthOf(c.publishDate) === month)
    .forEach((c) => {
      const key = contentTypeCountKey(c.contentType)
      if (key) counts[key] += 1
      counts.total += 1
    })
  return counts
}

export function productsForMonth(products: InfluencerProduct[], influencerId: string, month: string): InfluencerProduct[] {
  return products.filter((p) => p.influencerId === influencerId && monthOf(p.dateSent) === month)
}

export function contentForMonth(content: InfluencerContent[], influencerId: string, month: string): InfluencerContent[] {
  return content.filter((c) => c.influencerId === influencerId && (monthOf(c.publishDate) === month || monthOf(c.dueDate) === month))
}

export interface InfluencerMonthlyCost {
  cashPayment: number
  productCost: number
  totalCost: number
}

export function computeInfluencerMonthlyCost(influencer: Influencer, products: InfluencerProduct[], month: string): InfluencerMonthlyCost {
  const cashPayment = agreementCoversMonth(influencer, month) ? influencer.agreement?.monthlyPayment ?? 0 : 0
  const productCost = productsForMonth(products, influencer.id, month).reduce((sum, p) => sum + (p.actualBusinessCost ?? 0), 0)
  return { cashPayment, productCost, totalCost: cashPayment + productCost }
}

export interface InfluencerMonthMetrics {
  cashPayment: number
  productCost: number
  additionalCampaignCosts: number
  totalCost: number
  revenue: number
  orders: number
  roas?: number
  costPerOrder?: number
  revenuePerContent?: number
  totalViews: number
  engagementRate?: number
  contentRequired: ContentCounts
  contentCompleted: ContentCounts
}

export function computeInfluencerMonthMetrics(
  influencer: Influencer,
  products: InfluencerProduct[],
  content: InfluencerContent[],
  sale: InfluencerSale | undefined,
  month: string,
): InfluencerMonthMetrics {
  const cost = computeInfluencerMonthlyCost(influencer, products, month)
  const additionalCampaignCosts = sale?.additionalCampaignCosts ?? 0
  // Total Influencer Cost = תשלום מזומן + עלות עסקית בפועל של מוצרים + עלויות קמפיין נוספות (לא מחיר קמעונאי).
  const totalCost = cost.totalCost + additionalCampaignCosts
  const revenue = sale?.revenue ?? 0
  const orders = sale?.orders ?? 0
  const publishedThisMonth = content.filter(
    (c) => c.influencerId === influencer.id && c.status === 'published' && monthOf(c.publishDate) === month,
  )
  const totalViews = publishedThisMonth.reduce((sum, c) => sum + (c.views ?? 0), 0)
  const engagement = publishedThisMonth.reduce((sum, c) => sum + (c.likes ?? 0) + (c.comments ?? 0) + (c.shares ?? 0) + (c.saves ?? 0), 0)
  const reachOrViews = publishedThisMonth.reduce((sum, c) => sum + (c.reach ?? c.views ?? 0), 0)
  const contentCompleted = publishedContentCounts(content, influencer.id, month)

  return {
    cashPayment: cost.cashPayment,
    productCost: cost.productCost,
    additionalCampaignCosts,
    totalCost,
    revenue,
    orders,
    roas: safeDiv(revenue, totalCost),
    costPerOrder: safeDiv(totalCost, orders),
    revenuePerContent: safeDiv(revenue, contentCompleted.total),
    totalViews,
    engagementRate: safeDiv(engagement, reachOrViews),
    contentRequired: agreementRequiredCounts(influencer),
    contentCompleted,
  }
}

export type AlertSeverity = 'warm' | 'alert'

export interface InfluencerAlert {
  id: string
  influencerId: string
  influencerName: string
  severity: AlertSeverity
  message: string
}

export function computeInfluencerAlerts(
  influencers: Influencer[],
  products: InfluencerProduct[],
  content: InfluencerContent[],
  month: string,
): InfluencerAlert[] {
  const today = todayISO()
  const isCurrentMonth = month === currentMonth()
  const dayOfMonth = new Date(today + 'T00:00:00').getDate()
  const daysInMonth = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate()
  const nearMonthEnd = isCurrentMonth && dayOfMonth >= daysInMonth - 6

  const alerts: InfluencerAlert[] = []

  for (const inf of influencers) {
    if (inf.status !== 'active') continue

    for (const c of content.filter((c) => c.influencerId === inf.id)) {
      if (c.dueDate && c.dueDate < today && !['published', 'cancelled'].includes(c.status)) {
        alerts.push({
          id: `overdue-${c.id}`,
          influencerId: inf.id,
          influencerName: inf.name,
          severity: 'alert',
          message: `תוכן של ${inf.name} עבר את תאריך היעד ולא פורסם`,
        })
      }
      if (c.status === 'published' && c.views === undefined) {
        alerts.push({
          id: `missing-stats-${c.id}`,
          influencerId: inf.id,
          influencerName: inf.name,
          severity: 'warm',
          message: `לתוכן שפורסם של ${inf.name} חסרים נתוני ביצוע`,
        })
      }
    }

    if (nearMonthEnd) {
      const required = agreementRequiredCounts(inf)
      const completed = publishedContentCounts(content, inf.id, month)
      if (required.total > 0 && completed.total < required.total) {
        alerts.push({
          id: `commitment-${inf.id}-${month}`,
          influencerId: inf.id,
          influencerName: inf.name,
          severity: 'warm',
          message: `${inf.name} לא השלים/ה את ההתחייבות החודשית (${completed.total}/${required.total})`,
        })
      }
    }

    const budget = inf.agreement?.monthlyProductBudget
    if (budget !== undefined) {
      const spent = productsForMonth(products, inf.id, month).reduce((sum, p) => sum + (p.actualBusinessCost ?? 0), 0)
      if (spent > budget) {
        alerts.push({
          id: `budget-${inf.id}-${month}`,
          influencerId: inf.id,
          influencerName: inf.name,
          severity: 'alert',
          message: `עברנו את תקציב המוצרים החודשי של ${inf.name}`,
        })
      }
    }

    const endDate = inf.agreement?.endDate
    if (endDate) {
      const daysLeft = Math.round((new Date(endDate + 'T00:00:00').getTime() - new Date(today + 'T00:00:00').getTime()) / 86400000)
      if (daysLeft >= 0 && daysLeft <= 14) {
        alerts.push({
          id: `ending-${inf.id}`,
          influencerId: inf.id,
          influencerName: inf.name,
          severity: 'warm',
          message: `ההסכם עם ${inf.name} עומד להסתיים בעוד ${daysLeft} ימים`,
        })
      }
    }
  }

  return alerts
}
