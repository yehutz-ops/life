import { recordUsage } from './usageTracking'

export class ShipmentExtractError extends Error {}

export type ShipmentFieldStatus = 'extracted' | 'missing' | 'conflict'

export interface ShipmentFieldResult {
  value: string | null
  status: ShipmentFieldStatus
  source: string | null
  conflicts: { value: string; source: string }[]
}

export type ShipmentDocGuessCategory = 'invoice' | 'packing_list' | 'msds_sds' | 'other'

export interface ShipmentExtractResult {
  name: ShipmentFieldResult
  originCountry: ShipmentFieldResult
  originCity: ShipmentFieldResult
  supplierName: ShipmentFieldResult
  pickupAddress: ShipmentFieldResult
  contactPerson: ShipmentFieldResult
  contactEmail: ShipmentFieldResult
  contactPhone: ShipmentFieldResult
  readyDate: ShipmentFieldResult
  cartons: ShipmentFieldResult
  weight: ShipmentFieldResult
  dimensions: ShipmentFieldResult
  onPallet: ShipmentFieldResult
  palletCount: ShipmentFieldResult
  goodsType: ShipmentFieldResult
  isDangerousGoods: ShipmentFieldResult
  documentGuesses: { fileName: string; category: ShipmentDocGuessCategory }[]
  notes: string | null
}

export interface ShipmentExtractFileInput {
  fileName: string
  mediaType: string
  base64: string
}

export async function extractShipmentDetails(files: ShipmentExtractFileInput[], pastedText: string): Promise<ShipmentExtractResult> {
  let res: Response
  try {
    res = await fetch('/api/ai/extract-shipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ files, pastedText }),
    })
  } catch {
    throw new ShipmentExtractError('אין חיבור לאינטרנט כרגע. אפשר למלא ידנית ולנסות שוב מאוחר יותר.')
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new ShipmentExtractError(data?.message ?? 'לא הצלחתי לחלץ נתונים כרגע. אפשר לנסות שוב, או למלא ידנית.')
  }

  const data = await res.json()
  await recordUsage(data.usage.inputTokens, data.usage.outputTokens)
  return data.result as ShipmentExtractResult
}
