// שכבת Provider עתידית לכלי יצירה/פרסום/אנליטיקה — לא מחוברת לשום שירות אמיתי כרגע.
// המטרה: כל שאר המערכת (Content Studio, Today, Analytics) מדברת רק עם הממשקים האלה,
// כך שאפשר יהיה בעתיד להחליף/להוסיף ספק (Google Gemini Image / Nano Banana, Meta Publishing
// API, TikTok Ads API וכו') בלי לגעת ב-UI. כרגע כל הממשקים מיושמים על ידי stub שמחזיר
// "לא מחובר" בצורה ברורה, לא מדמה נתונים.

export interface ProviderStatus {
  connected: boolean
  message: string
}

export interface ImageProvider {
  name: string
  status(): ProviderStatus
  generate(prompt: string): Promise<{ url: string }>
}

export interface VideoProvider {
  name: string
  status(): ProviderStatus
  generate(prompt: string): Promise<{ url: string }>
}

export interface PublishingProvider {
  name: string
  status(): ProviderStatus
  publish(contentPieceId: string): Promise<{ published: boolean }>
  schedule(contentPieceId: string, atISO: string): Promise<{ scheduled: boolean }>
}

export interface AnalyticsProvider {
  name: string
  status(): ProviderStatus
  syncPerformance(contentPieceId: string): Promise<void>
}

function notConfigured(name: string): ProviderStatus {
  return { connected: false, message: `${name} עדיין לא מחובר — יש להגדיר אינטגרציה כדי להפעיל את הפעולה הזו.` }
}

export const imageProvider: ImageProvider = {
  name: 'Image Generation (לדוגמה Google Gemini Image / Nano Banana)',
  status: () => notConfigured('Image Generation'),
  generate: async () => {
    throw new Error(notConfigured('Image Generation').message)
  },
}

export const videoProvider: VideoProvider = {
  name: 'Video Editing',
  status: () => notConfigured('Video Editing'),
  generate: async () => {
    throw new Error(notConfigured('Video Editing').message)
  },
}

export const publishingProvider: PublishingProvider = {
  name: 'Social Publishing (Instagram / TikTok)',
  status: () => notConfigured('Social Publishing'),
  publish: async () => {
    throw new Error(notConfigured('Social Publishing').message)
  },
  schedule: async () => {
    throw new Error(notConfigured('Social Publishing').message)
  },
}

export const analyticsProvider: AnalyticsProvider = {
  name: 'Instagram / TikTok Analytics',
  status: () => notConfigured('Analytics Sync'),
  syncPerformance: async () => {
    throw new Error(notConfigured('Analytics Sync').message)
  },
}

export const contentProviders = { imageProvider, videoProvider, publishingProvider, analyticsProvider }
