import { describe, expect, it } from 'vitest'
import { isCompliantWinner, selectWinner } from './award'
import { allCircuitVectors, evaluateEligibility } from './circuit'
import { computeCommitment, computePolicyHash, hashText, verifyCommitment } from './crypto'
import { canTransition, nextStatus } from './stateMachine'
import type { Bid, EligibilityInput, Policy } from '../types'

const policy: Policy = {
  currency: 'NGN',
  commitDeadline: 1_000,
  revealDeadline: 2_000,
  requiredDocuments: ['Registration'],
  ruleVersion: 'lowest-eligible-v1',
  tieRule: 'earliest-commit',
}

const baseInput = {
  tenderId: 'RFQ-TEST-0001',
  bidder: '0x9c5b7c6a7d3e8f1a2b4c6d8e0f2a4b6c8d0e2f40',
  documentHash: hashText('document'),
  salt: `0x${'11'.repeat(32)}`,
}

function bid(overrides: Partial<Bid>): Bid {
  return {
    id: 'BID-1',
    tenderId: 'RFQ-TEST-0001',
    supplierId: baseInput.bidder,
    supplierName: 'Supplier',
    wallet: baseInput.bidder,
    priceKobo: '1000000',
    documentHash: baseInput.documentHash,
    documentName: 'quote.pdf',
    salt: baseInput.salt,
    commitment: '0x0',
    committedAt: 500,
    revealedAt: 900,
    status: 'revealed',
    transactionHash: hashText('tx'),
    ...overrides,
  }
}

function eligibility(value: boolean) {
  return evaluateEligibility(
    (['A', 'B', 'C', 'D'] as const).map((key) => ({
      key,
      label: key,
      value,
      provenance: 'test',
    })) satisfies EligibilityInput[],
    0,
  )
}

describe('commitments', () => {
  it('verifies a reveal only when every committed field is unchanged', () => {
    const input = { ...baseInput, priceKobo: '1080000000' }
    const commitment = computeCommitment(input)
    expect(verifyCommitment(commitment, input)).toBe(true)
    expect(verifyCommitment(commitment, { ...input, priceKobo: '1050000000' })).toBe(false)
    expect(verifyCommitment(commitment, { ...input, salt: `0x${'22'.repeat(32)}` })).toBe(false)
    expect(computeCommitment(input)).not.toBe(computeCommitment({ ...input, documentHash: hashText('other') }))
  })

  it('locks deadlines and rule version into the policy hash', () => {
    const first = computePolicyHash('RFQ-TEST-0001', policy)
    expect(computePolicyHash('RFQ-TEST-0001', policy)).toBe(first)
    expect(computePolicyHash('RFQ-TEST-0002', policy)).not.toBe(first)
    expect(computePolicyHash('RFQ-TEST-0001', { ...policy, commitDeadline: 1_001 })).not.toBe(first)
  })
})

describe('eligibility circuit', () => {
  it('returns one only for A=B=C=D=1', () => {
    const vectors = allCircuitVectors()
    expect(vectors).toHaveLength(16)
    expect(vectors.filter((vector) => vector.result)).toEqual([
      { bits: [true, true, true, true], result: true },
    ])
  })

  it('emits a six-NAND trace ending in the eligibility bit', () => {
    const result = eligibility(true)
    expect(result.trace).toHaveLength(6)
    expect(result.trace[0].gate).toContain('NAND')
    expect(result.trace[5].output).toBe(true)
    expect(eligibility(false).trace[5].output).toBe(false)
  })
})

describe('award rule', () => {
  const bids: Bid[] = [
    bid({ id: 'A', supplierId: 'a', priceKobo: '1100000000', committedAt: 100, eligibility: eligibility(true) }),
    bid({ id: 'B', supplierId: 'b', priceKobo: '1050000000', committedAt: 90, eligibility: eligibility(false) }),
    bid({ id: 'C', supplierId: 'c', priceKobo: '1080000000', committedAt: 80, eligibility: eligibility(true) }),
  ]

  it('refuses a cheaper ineligible bid', () => {
    const decision = selectWinner(bids, policy)
    expect(decision.compliant).toBe(true)
    expect(decision.winner?.id).toBe('C')
    expect(isCompliantWinner(bids, policy, 'B')).toBe(false)
  })

  it('applies the locked tie rule', () => {
    const tied = [
      bid({ id: 'first', supplierId: 'z', priceKobo: '1000000000', committedAt: 10, eligibility: eligibility(true) }),
      bid({ id: 'second', supplierId: 'a', priceKobo: '1000000000', committedAt: 20, eligibility: eligibility(true) }),
    ]
    expect(selectWinner(tied, policy).winner?.id).toBe('first')
    expect(selectWinner(tied, { ...policy, tieRule: 'supplier-id' }).winner?.id).toBe('second')
  })
})

describe('state machine', () => {
  it('permits only the documented lifecycle transitions', () => {
    expect(canTransition('draft', 'publish')).toBe(true)
    expect(canTransition('open', 'close')).toBe(true)
    expect(canTransition('closed', 'review')).toBe(true)
    expect(canTransition('evaluation', 'finalize')).toBe(true)
    expect(canTransition('awarded', 'cancel')).toBe(false)
    expect(canTransition('open', 'finalize')).toBe(false)
    expect(nextStatus('review')).toBe('evaluation')
  })
})
