import {
  encodeAbiParameters,
  keccak256,
  padHex,
  stringToHex,
  type Hex,
} from 'viem'
import type { Policy } from '../types'

export const CHAIN_ID = 196n

const ruleCodes: Record<Policy['ruleVersion'], number> = {
  'lowest-eligible-v1': 1,
}

function tenderIdBytes(tenderId: string): Hex {
  return padHex(stringToHex(tenderId), { size: 32 })
}

export function hashText(value: string): Hex {
  return keccak256(stringToHex(value))
}

export const DOMAIN_TAG = hashText('bidoraq:domain:v3')

export async function hashDocument(file: File): Promise<Hex> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  const bytes = new Uint8Array(digest)
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}` as Hex
}

export function randomSalt(): Hex {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}` as Hex
}

export function computePolicyHash(tenderId: string, policy: Policy): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'string' },
        { type: 'uint256' },
        { type: 'uint256' },
        { type: 'uint8' },
        { type: 'string' },
        { type: 'string' },
      ],
      [
        CHAIN_ID,
        DOMAIN_TAG,
        tenderIdBytes(tenderId),
        policy.currency,
        BigInt(policy.commitDeadline),
        BigInt(policy.revealDeadline),
        ruleCodes[policy.ruleVersion],
        policy.tieRule,
        policy.ruleVersion,
      ],
    ),
  )
}

export function computeCommitment(input: {
  tenderId: string
  bidder: string
  priceKobo: string
  documentHash: string
  salt: string
}): Hex {
  return keccak256(
    encodeAbiParameters(
      [
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'bytes32' },
        { type: 'address' },
        { type: 'uint256' },
        { type: 'bytes32' },
        { type: 'bytes32' },
      ],
      [
        CHAIN_ID,
        DOMAIN_TAG,
        tenderIdBytes(input.tenderId),
        input.bidder as Hex,
        BigInt(input.priceKobo),
        input.documentHash as Hex,
        input.salt as Hex,
      ],
    ),
  )
}

export function verifyCommitment(
  expected: string,
  input: Parameters<typeof computeCommitment>[0],
) {
  return computeCommitment(input).toLowerCase() === expected.toLowerCase()
}

export function referenceId(seed: string): Hex {
  return hashText(`bidoraq:local-reference:${seed}`)
}

export function isBytes32(value: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(value)
}
