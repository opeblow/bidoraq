export type Role = 'buyer' | 'supplier' | 'reviewer' | 'approver' | 'auditor'

export type TenderStatus =
  | 'draft'
  | 'open'
  | 'closed'
  | 'evaluation'
  | 'awarded'
  | 'cancelled'
  | 'expired'

export type BidStatus = 'committed' | 'revealed' | 'invalid' | 'rejected'

export type Currency = 'NGN' | 'USD'

export type TieRule = 'earliest-commit' | 'supplier-id'

export interface Policy {
  currency: Currency
  commitDeadline: number
  revealDeadline: number
  requiredDocuments: string[]
  ruleVersion: 'lowest-eligible-v1'
  tieRule: TieRule
}

export interface Tender {
  id: string
  reference: string
  title: string
  description: string
  organization: string
  status: TenderStatus
  createdAt: number
  policy: Policy
  policyHash: string
  bidders: string[]
  itemName: string
  quantity: number
  budgetKobo: string
  location: string
}

export type EligibilityKey = 'A' | 'B' | 'C' | 'D'

export interface EligibilityInput {
  key: EligibilityKey
  label: string
  value: boolean
  provenance: string
}

export interface CircuitTraceLine {
  gate: string
  inputs: [boolean, boolean]
  output: boolean
}

export type OnChainVerdict = {
  status: 'verified' | 'mismatch' | 'unavailable' | 'not-taped-out'
  bits: [boolean, boolean, boolean, boolean]
  result?: boolean
  processor?: string
  circuitId?: string
  evaluatedAt: number
  detail: string
}

export interface EligibilityResult {
  inputs: EligibilityInput[]
  bits: [boolean, boolean, boolean, boolean]
  trace: CircuitTraceLine[]
  result: boolean
  circuitId: string
  processor: string
  evaluatedAt: number
  onChain?: OnChainVerdict
}

export interface Bid {
  id: string
  tenderId: string
  supplierId: string
  supplierName: string
  wallet: string
  priceKobo: string
  documentHash: string
  documentName: string
  salt: string
  commitment: string
  committedAt: number
  revealedAt?: number
  status: BidStatus
  localReference: string
  eligibility?: EligibilityResult
  revealError?: string
}

export interface Award {
  tenderId: string
  winningBidId: string
  priceKobo: string
  approvedBy: string
  approvedAt: number
  localReference: string
  policyHash: string
  commitment: string
  complianceNote: string
}

export interface AuditLog {
  id: string
  actor: string
  role: Role
  action: string
  record: string
  timestamp: number
  reference: string
}

export interface Profile {
  name: string
  organization: string
  email: string
  wallet?: string
  onboarded: boolean
}

export interface Toast {
  id: string
  tone: 'success' | 'error' | 'info'
  title: string
  detail?: string
}

export type WalletOption = {
  id: string
  label: string
  role: Role
  address: string
}

export interface VerifierInput {
  receipt: string
  salt: string
  priceKobo: string
  documentHash: string
}
