import { createPublicClient, http, parseAbi, type Address, type Hex } from 'viem'
import type { VerificationCheck } from './receipt'
import type { OnChainVerdict } from '../types'

export const XLAYER_CHAIN_ID = 196
export const XLAYER_RPCS = [
  import.meta.env.VITE_XLAYER_RPC,
  'https://rpc.xlayer.tech',
  'https://xlayerrpc.okx.com',
].filter((value): value is string => Boolean(value))

export const TAPEOUT_REFERENCE_PROCESSOR =
  '0xA93E807fAB41431827EBBa57443Fb687a95E2AA3' as Address
export const TAPEOUT_PROCESSOR = (import.meta.env.VITE_TAPEOUT_PROCESSOR ?? '') as Address
export const TAPEOUT_CIRCUIT_ID = import.meta.env.VITE_TAPEOUT_CIRCUIT_ID ?? ''
export const IS_TAPEOUT_READY = Boolean(TAPEOUT_PROCESSOR && TAPEOUT_CIRCUIT_ID)

const ABI = parseAbi(['function eval(uint256, bytes) view returns (bytes)'])
const clients = XLAYER_RPCS.map((rpc) => createPublicClient({ transport: http(rpc, { timeout: 8000 }) }))

type Client = (typeof clients)[number]

async function withRpc<T>(call: (client: Client) => Promise<T>): Promise<{ value: T; rpc: string }> {
  return Promise.any(
    XLAYER_RPCS.map(async (rpc, index) => ({ value: await call(clients[index]), rpc })),
  )
}

function shortError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return message.length > 160 ? `${message.slice(0, 157)}...` : message
}

export interface TapeOutStatus {
  online: boolean
  chainId?: number
  blockNumber?: bigint
  processor: Address
  processorHasCode: boolean
  circuitId: string
  tapedOut: boolean
  rpc?: string
  detail: string
}

export async function verifyTapeOut(): Promise<TapeOutStatus> {
  const processor = IS_TAPEOUT_READY ? TAPEOUT_PROCESSOR : TAPEOUT_REFERENCE_PROCESSOR
  try {
    const { value, rpc } = await withRpc(async (client) => {
      const [chainId, code, blockNumber] = await Promise.all([
        client.getChainId(),
        client.getCode({ address: processor }),
        client.getBlockNumber(),
      ])
      return { chainId, code, blockNumber }
    })
    const processorHasCode = value.code !== '0x'
    const tapedOut = IS_TAPEOUT_READY && processorHasCode && value.chainId === XLAYER_CHAIN_ID
    return {
      online: true,
      chainId: value.chainId,
      blockNumber: value.blockNumber,
      processor,
      processorHasCode,
      circuitId: TAPEOUT_CIRCUIT_ID,
      tapedOut,
      rpc,
      detail: IS_TAPEOUT_READY
        ? tapedOut
          ? 'Bidoraq processor and circuit are live on X Layer mainnet.'
          : 'Configured processor is not live on X Layer mainnet.'
        : `X Layer RPC is live; ${processor} is a public reference processor, not Bidoraq's circuit.`,
    }
  } catch (error) {
    return {
      online: false,
      processor,
      processorHasCode: false,
      circuitId: TAPEOUT_CIRCUIT_ID,
      tapedOut: false,
      detail: `X Layer RPC unavailable: ${shortError(error)}`,
    }
  }
}

export function explorerAddress(address: string) {
  return `https://www.okx.com/web3/explorer/xlayer/address/${address}`
}

function parseCircuitId(circuitId: string): bigint | null {
  const raw = circuitId.split('.')[0]
  if (!/^\d+$/.test(raw)) return null
  return BigInt(raw)
}

function packBits(bits: readonly [boolean, boolean, boolean, boolean]): Hex {
  const byte = bits.reduce((accumulator, value, index) => {
    return value ? accumulator | (1 << index) : accumulator
  }, 0)
  return `0x${byte.toString(16).padStart(2, '0')}` as Hex
}

interface EvalOptions {
  processor?: Address
  circuitId?: string
  expectedResult?: boolean
}

const evaluationCache = new Map<string, OnChainVerdict>()

export async function evaluateEligibilityOnChain(
  bits: readonly [boolean, boolean, boolean, boolean],
  options: EvalOptions = {},
): Promise<OnChainVerdict> {
  const processor = options.processor ?? TAPEOUT_PROCESSOR
  const circuitId = options.circuitId ?? TAPEOUT_CIRCUIT_ID
  const evaluatedAt = Date.now()
  const cacheKey = `${processor}|${circuitId}|${bits.join('')}`
  const cached = evaluationCache.get(cacheKey)
  if (cached && (cached.status === 'verified' || cached.status === 'mismatch')) return cached

  if (!processor || !circuitId) {
    return {
      status: 'not-taped-out',
      bits: [...bits] as [boolean, boolean, boolean, boolean],
      evaluatedAt,
      detail: 'Circuit not yet taped out — local simulation only.',
    }
  }

  const id = parseCircuitId(circuitId)
  if (id === null) {
    return {
      status: 'unavailable',
      bits: [...bits] as [boolean, boolean, boolean, boolean],
      processor,
      circuitId,
      evaluatedAt,
      detail: `Unrecognized circuit ID "${circuitId}"; expected <id>.2.<processor>.`,
    }
  }

  try {
    const { value } = await withRpc((client) =>
      client.readContract({
        address: processor,
        abi: ABI,
        functionName: 'eval',
        args: [id, packBits(bits)],
      }),
    )
    if (!value || value.length < 4) throw new Error('eval returned no output bytes')
    const result = (Number.parseInt(value.slice(2, 4), 16) & 1) === 1
    const verdict: OnChainVerdict = {
      status:
        typeof options.expectedResult === 'boolean' && options.expectedResult !== result
          ? 'mismatch'
          : 'verified',
      bits: [...bits] as [boolean, boolean, boolean, boolean],
      result,
      processor,
      circuitId,
      evaluatedAt,
      detail:
        typeof options.expectedResult === 'boolean' && options.expectedResult !== result
          ? 'On-chain eval disagrees with the local timing simulation.'
          : `Reproduced on X Layer by ${processor} eval(${circuitId}).`,
    }
    evaluationCache.set(cacheKey, verdict)
    return verdict
  } catch (error) {
    return {
      status: 'unavailable',
      bits: [...bits] as [boolean, boolean, boolean, boolean],
      processor,
      circuitId,
      evaluatedAt,
      detail: `On-chain eval unavailable: ${shortError(error)}`,
    }
  }
}

export async function verifyReceiptOnChain(receipt: {
  eligibilityProof?: OnChainVerdict
}): Promise<VerificationCheck> {
  const proof = receipt.eligibilityProof
  if (!proof) {
    return {
      label: 'On-chain eligibility',
      ok: false,
      detail: 'No on-chain proof in this receipt — local simulation only.',
    }
  }
  if (proof.status === 'not-taped-out' || proof.status === 'unavailable') {
    return {
      label: 'On-chain eligibility',
      ok: false,
      detail: proof.detail,
    }
  }
  const verdict = await evaluateEligibilityOnChain(proof.bits, {
    processor: proof.processor as Address | undefined,
    circuitId: proof.circuitId,
    expectedResult: proof.result,
  })
  return {
    label: 'On-chain eligibility',
    ok: verdict.status === 'verified',
    detail: verdict.detail,
  }
}
