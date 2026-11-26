import { selectWinner } from './award'
import { computePolicyHash, verifyCommitment } from './crypto'
import type { Award, Bid, OnChainVerdict, Policy, Tender } from '../types'

export interface ReceiptBid {
  id: string
  bidder: string
  commitment: string
  priceKobo: string
  documentHash: string
  salt: string
  committedAt: number
  eligible: boolean
}

export interface ReceiptPayload {
  version: 2
  tenderId: string
  policy: Policy
  policyHash: string
  winningBidId: string
  priceKobo: string
  localReference: string
  approvedBy: string
  approvedAt: number
  complianceNote: string
  ranked: ReceiptBid[]
  eligibilityProof?: OnChainVerdict
}

export interface RevealedFields {
  priceKobo: string
  documentHash: string
  salt: string
}

export interface VerificationCheck {
  label: string
  ok: boolean
  detail: string
}

export function buildReceipt(tender: Tender, award: Award, bids: Bid[]): ReceiptPayload {
  const winner = bids.find((bid) => bid.id === award.winningBidId)
  if (!winner) throw new Error('The winning bid is not available to build a receipt.')

  const ranked = bids
    .filter((bid) => bid.tenderId === tender.id && bid.status === 'revealed')
    .map((bid) => ({
      id: bid.id,
      bidder: bid.wallet,
      commitment: bid.commitment,
      priceKobo: bid.priceKobo,
      documentHash: bid.documentHash,
      salt: bid.salt,
      committedAt: bid.committedAt,
      eligible: bid.eligibility?.result === true,
    }))

  return {
    version: 2,
    tenderId: tender.id,
    policy: tender.policy,
    policyHash: tender.policyHash,
    winningBidId: award.winningBidId,
    priceKobo: award.priceKobo,
    localReference: award.localReference,
    approvedBy: award.approvedBy,
    approvedAt: award.approvedAt,
    complianceNote: award.complianceNote,
    ranked,
    eligibilityProof: winner.eligibility?.onChain,
  }
}

export function parseReceipt(text: string): ReceiptPayload {
  const parsed = JSON.parse(text) as ReceiptPayload
  if (
    parsed.version !== 2 ||
    typeof parsed.tenderId !== 'string' ||
    !parsed.policy ||
    typeof parsed.policyHash !== 'string' ||
    typeof parsed.localReference !== 'string' ||
    typeof parsed.winningBidId !== 'string' ||
    !Array.isArray(parsed.ranked)
  ) {
    throw new Error('This file is not a Bidoraq version 2 receipt.')
  }
  return parsed
}

function rankedWinner(receipt: ReceiptPayload): ReceiptBid | null {
  const candidates = receipt.ranked.filter((bid) => bid.eligible)
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => {
    const priceDelta = BigInt(a.priceKobo) < BigInt(b.priceKobo) ? -1 : BigInt(a.priceKobo) > BigInt(b.priceKobo) ? 1 : 0
    if (priceDelta !== 0) return priceDelta
    if (receipt.policy.tieRule === 'earliest-commit') return a.committedAt - b.committedAt
    return a.bidder.localeCompare(b.bidder)
  })[0]
}

export function verifyReceipt(receipt: ReceiptPayload, revealed: RevealedFields): VerificationCheck[] {
  const policyOk = computePolicyHash(receipt.tenderId, receipt.policy).toLowerCase() === receipt.policyHash.toLowerCase()
  const winningBid = receipt.ranked.find((bid) => bid.id === receipt.winningBidId)
  const revealedComplete = Boolean(revealed.priceKobo && revealed.documentHash && revealed.salt)
  const commitmentOk = revealedComplete && winningBid
    ? verifyCommitment(winningBid.commitment, {
        tenderId: receipt.tenderId,
        bidder: winningBid.bidder,
        priceKobo: revealed.priceKobo,
        documentHash: revealed.documentHash,
        salt: revealed.salt,
      })
    : false
  const computed = rankedWinner(receipt)
  const ruleOk = computed?.id === receipt.winningBidId && computed.priceKobo === receipt.priceKobo

  return [
    {
      label: 'Policy hash',
      ok: policyOk,
      detail: policyOk
        ? 'The published deadlines and rule reproduce the locked policy hash.'
        : 'The published policy fields do not reproduce the locked policy hash.',
    },
    {
      label: 'Winning commitment',
      ok: commitmentOk,
      detail: revealedComplete
        ? commitmentOk
          ? 'The revealed price, document hash and salt reproduce the sealed commitment.'
          : 'The reveal inputs do not reproduce the winning commitment.'
        : 'Supply all three revealed fields before the commitment can be verified.',
    },
    {
      label: 'Award rule',
      ok: ruleOk,
      detail: ruleOk
        ? 'The published winner matches the lowest eligible quotation under the locked rule.'
        : 'The published winner violates the lowest-eligible award rule.',
    },
  ]
}

export function receiptForTender(tender: Tender, bids: Bid[]) {
  return selectWinner(bids.filter((bid) => bid.tenderId === tender.id), tender.policy)
}

export function downloadJson(payload: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
