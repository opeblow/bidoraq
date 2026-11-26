import type { TenderStatus } from '../types'

export type TenderAction = 'publish' | 'close' | 'review' | 'finalize' | 'cancel' | 'expire'

const transitions: Record<TenderStatus, TenderAction[]> = {
  draft: ['publish', 'cancel'],
  open: ['close', 'expire', 'cancel'],
  closed: ['review', 'cancel'],
  evaluation: ['finalize', 'cancel'],
  awarded: [],
  cancelled: [],
  expired: [],
}

export function canTransition(status: TenderStatus, action: TenderAction) {
  return transitions[status].includes(action)
}

export function nextStatus(action: TenderAction): TenderStatus {
  switch (action) {
    case 'publish':
      return 'open'
    case 'close':
      return 'closed'
    case 'review':
      return 'evaluation'
    case 'finalize':
      return 'awarded'
    case 'cancel':
      return 'cancelled'
    case 'expire':
      return 'expired'
  }
}

export function assertTransition(status: TenderStatus, action: TenderAction) {
  if (!canTransition(status, action)) {
    throw new Error(`Invalid tender transition: ${status} → ${action}`)
  }
}
