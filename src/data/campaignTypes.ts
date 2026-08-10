export type CampaignPlatform = 'meta' | 'instagram' | 'facebook' | 'tiktok' | 'other'
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed'

export interface Campaign {
  id: string
  name: string
  platform: CampaignPlatform
  status: CampaignStatus
  goal?: string
  startDate?: string
  endDate?: string
  budget?: number
  spend?: number
  impressions?: number
  reach?: number
  frequency?: number
  clicks?: number
  addToCart?: number
  purchases?: number
  revenue?: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CampaignCreative {
  id: string
  campaignId: string
  name: string
  format?: string
  mediaRef?: string
  copy?: string
  product?: string
  spend?: number
  impressions?: number
  clicks?: number
  purchases?: number
  revenue?: number
  createdAt: string
  updatedAt: string
}
