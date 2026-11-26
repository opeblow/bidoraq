import type { AuditLog, Award, Bid, Profile, Role, Tender, Toast } from '../types'

export interface AppState {
  version: number
  profile: Profile
  role: Role
  walletAddress?: string
  tenders: Tender[]
  bids: Bid[]
  awards: Award[]
  logs: AuditLog[]
  toasts: Toast[]
}

export const STORAGE_KEY = 'bidoraq:workspace:v3'
export const LEGACY_STORAGE_KEY = 'bidoraq:workspace:v2'

export function createEmptyState(): AppState {
  return {
    version: 3,
    profile: {
      name: '',
      organization: '',
      email: '',
      onboarded: false,
    },
    role: 'buyer',
    tenders: [],
    bids: [],
    awards: [],
    logs: [],
    toasts: [],
  }
}

type LegacyRecord = Record<string, unknown>

export function migrateWorkspace(raw: string): AppState | null {
  const parsed = JSON.parse(raw) as LegacyRecord
  const version = Number(parsed.version)
  if (version !== 2 && version !== 3) return null

  const migrateBid = (value: unknown): Bid => {
    const bid = { ...(value as LegacyRecord) }
    const legacy = bid.transactionHash
    if (typeof legacy === 'string' && typeof bid.localReference !== 'string') {
      bid.localReference = legacy
    }
    delete bid.transactionHash
    return bid as unknown as Bid
  }

  const migrateAward = (value: unknown): Award => {
    const award = { ...(value as LegacyRecord) }
    const legacy = award.transactionHash
    if (typeof legacy === 'string' && typeof award.localReference !== 'string') {
      award.localReference = legacy
    }
    delete award.transactionHash
    return award as unknown as Award
  }

  return {
    ...createEmptyState(),
    ...(parsed as unknown as AppState),
    version: 3,
    bids: Array.isArray(parsed.bids) ? parsed.bids.map(migrateBid) : [],
    awards: Array.isArray(parsed.awards) ? parsed.awards.map(migrateAward) : [],
    toasts: [],
  }
}
