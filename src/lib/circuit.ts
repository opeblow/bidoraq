import { CIRCUIT_ID, PROCESSOR_ADDRESS } from './crypto'
import type { CircuitTraceLine, EligibilityInput, EligibilityResult } from '../types'

export const eligibilityLabels: Record<EligibilityInput['key'], string> = {
  A: 'Authorized supplier',
  B: 'Reviewer-attested completeness',
  C: 'Timely commitment',
  D: 'Technical compliance',
}

const nand = (a: boolean, b: boolean) => !(a && b)

export function evaluateEligibility(inputs: EligibilityInput[], evaluatedAt = Date.now()): EligibilityResult {
  const lookup = new Map(inputs.map((input) => [input.key, input.value]))
  const A = lookup.get('A') ?? false
  const B = lookup.get('B') ?? false
  const C = lookup.get('C') ?? false
  const D = lookup.get('D') ?? false

  const trace: CircuitTraceLine[] = []
  const push = (gate: string, left: boolean, right: boolean) => {
    const output = nand(left, right)
    trace.push({ gate, inputs: [left, right], output })
    return output
  }

  const n1 = push('N1 = NAND(A, B)', A, B)
  const ab = push('AND1 = NAND(N1, N1)', n1, n1)
  const n2 = push('N2 = NAND(C, D)', C, D)
  const cd = push('AND2 = NAND(N2, N2)', n2, n2)
  const n3 = push('N3 = NAND(AND1, AND2)', ab, cd)
  const result = push('E = NAND(N3, N3)', n3, n3)

  return {
    inputs,
    bits: [A, B, C, D],
    trace,
    result,
    circuitId: CIRCUIT_ID,
    processor: PROCESSOR_ADDRESS,
    evaluatedAt,
  }
}

export function defaultEligibilityInputs(): EligibilityInput[] {
  return (['A', 'B', 'C', 'D'] as const).map((key) => ({
    key,
    label: eligibilityLabels[key],
    value: false,
    provenance: 'Awaiting reviewer evidence',
  }))
}

export function allCircuitVectors() {
  const vectors: Array<{ bits: [boolean, boolean, boolean, boolean]; result: boolean }> = []
  for (let mask = 0; mask < 16; mask += 1) {
    const bits: [boolean, boolean, boolean, boolean] = [
      Boolean(mask & 1),
      Boolean(mask & 2),
      Boolean(mask & 4),
      Boolean(mask & 8),
    ]
    const inputs = bits.map((value, index) => ({
      key: (['A', 'B', 'C', 'D'] as const)[index],
      label: eligibilityLabels[(['A', 'B', 'C', 'D'] as const)[index]],
      value,
      provenance: 'Vector',
    }))
    vectors.push({ bits, result: evaluateEligibility(inputs, 0).result })
  }
  return vectors
}
