import type { Bid, EligibilityResult, Policy } from '../types'

export interface AwardDecision {
  winner: Bid | null
  ranked: Bid[]
  reason: string
  compliant: boolean
}

export function selectWinner(bids: Bid[], policy: Policy): AwardDecision {
  const candidates = bids.filter(
    (bid) => bid.status === 'revealed' && bid.eligibility?.result === true,
  )

  if (candidates.length === 0) {
    return {
      winner: null,
      ranked: [],
      reason: 'No eligible revealed bid is available to award.',
      compliant: false,
    }
  }

  const ranked = [...candidates].sort((a, b) => {
    const priceDelta = BigInt(a.priceKobo) < BigInt(b.priceKobo) ? -1 : BigInt(a.priceKobo) > BigInt(b.priceKobo) ? 1 : 0
    if (priceDelta !== 0) return priceDelta
    if (policy.tieRule === 'earliest-commit') return a.committedAt - b.committedAt
    return a.supplierId.localeCompare(b.supplierId)
  })

  return {
    winner: ranked[0],
    ranked,
    reason: `Lowest eligible quotation under ${policy.ruleVersion}, tie: ${policy.tieRule}.`,
    compliant: true,
  }
}

export function isCompliantWinner(bids: Bid[], policy: Policy, bidId: string) {
  const decision = selectWinner(bids, policy)
  return decision.winner?.id === bidId
}

export function eligibilitySummary(result?: EligibilityResult) {
  if (!result) return 'Not evaluated'
  return result.result ? 'Eligible' : 'Ineligible'
}
