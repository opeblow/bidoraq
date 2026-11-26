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

export const STORAGE_KEY = 'bidoraq:workspace:v2'

export function createEmptyState(): AppState {
  return {
    version: 2,
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
