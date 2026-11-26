import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import { isAddress } from 'viem'
import { selectWinner } from '../lib/award'
import { evaluateEligibility } from '../lib/circuit'
import { evaluateEligibilityOnChain } from '../lib/xlayer'
import { computeCommitment, computePolicyHash, referenceId, verifyCommitment } from '../lib/crypto'
import { createEmptyState, LEGACY_STORAGE_KEY, migrateWorkspace, STORAGE_KEY, type AppState } from '../lib/workspace'
import { assertTransition } from '../lib/stateMachine'
import type {
  AuditLog,
  Bid,
  EligibilityInput,
  Policy,
  Profile,
  Role,
  Tender,
  Toast,
} from '../types'

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
  }
}

type Action =
  | { type: 'SET_ROLE'; role: Role }
  | { type: 'SET_WALLET'; address: string }
  | { type: 'CLEAR_WALLET' }
  | { type: 'UPDATE_PROFILE'; profile: Profile }
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'REMOVE_TOAST'; id: string }
  | { type: 'ADD_TENDER'; tender: Tender }
  | { type: 'SET_TENDER_STATUS'; id: string; status: Tender['status'] }
  | { type: 'ADD_BID'; bid: Bid }
  | { type: 'UPDATE_BID'; id: string; patch: Partial<Bid> }
  | { type: 'ADD_AWARD'; award: AppState['awards'][number] }
  | { type: 'ADD_LOG'; log: AuditLog }
  | { type: 'CLEAR_WORKSPACE' }

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_STORAGE_KEY)
    if (raw) {
      const migrated = migrateWorkspace(raw)
      if (migrated) return migrated
    }
  } catch {
    return createEmptyState()
  }
  return createEmptyState()
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role }
    case 'SET_WALLET':
      return { ...state, walletAddress: action.address }
    case 'CLEAR_WALLET':
      return { ...state, walletAddress: undefined }
    case 'UPDATE_PROFILE':
      return { ...state, profile: action.profile }
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.toast].slice(-4) }
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((toast) => toast.id !== action.id) }
    case 'ADD_TENDER':
      return { ...state, tenders: [action.tender, ...state.tenders] }
    case 'SET_TENDER_STATUS':
      return {
        ...state,
        tenders: state.tenders.map((tender) =>
          tender.id === action.id ? { ...tender, status: action.status } : tender,
        ),
      }
    case 'ADD_BID':
      return { ...state, bids: [...state.bids, action.bid] }
    case 'UPDATE_BID':
      return {
        ...state,
        bids: state.bids.map((bid) => (bid.id === action.id ? { ...bid, ...action.patch } : bid)),
      }
    case 'ADD_AWARD':
      return { ...state, awards: [action.award, ...state.awards] }
    case 'ADD_LOG':
      return { ...state, logs: [action.log, ...state.logs].slice(0, 250) }
    case 'CLEAR_WORKSPACE':
      return createEmptyState()
  }
}

export interface CreateTenderInput {
  title: string
  description: string
  itemName: string
  quantity: number
  budgetKobo: string
  location: string
  commitDeadline: number
  revealDeadline: number
  requiredDocuments: string[]
  bidders: string[]
}

export interface SubmitBidInput {
  tenderId: string
  priceKobo: string
  documentHash: string
  documentName: string
  salt: string
}

export interface RevealBidInput {
  bidId: string
  priceKobo: string
  documentHash: string
  salt: string
}

interface AppContextValue {
  state: AppState
  now: number
  walletAddress?: string
  connectWallet: () => Promise<boolean>
  useAddress: (address: string) => boolean
  disconnectWallet: () => void
  setRole: (role: Role) => void
  updateProfile: (profile: Profile) => void
  removeToast: (id: string) => void
  clearWorkspace: () => void
  exportState: () => string
  createTender: (input: CreateTenderInput) => string | null
  closeTender: (id: string) => boolean
  startEvaluation: (id: string) => boolean
  cancelTender: (id: string) => boolean
  submitBid: (input: SubmitBidInput) => Promise<{ ok: boolean; reason?: string; bidId?: string }>
  revealBid: (input: RevealBidInput) => Promise<{ ok: boolean; reason?: string }>
  attestEligibility: (bidId: string, inputs: EligibilityInput[]) => Promise<boolean>
  finalizeAward: (tenderId: string, overrideBidId?: string) => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

function makeToast(tone: Toast['tone'], title: string, detail?: string): Toast {
  return { id: `TOAST-${Date.now()}-${Math.random().toString(16).slice(2)}`, tone, title, detail }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const stateRef = useRef(state)
  stateRef.current = state
  const now = Date.now()

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  const toast = useCallback((tone: Toast['tone'], title: string, detail?: string) => {
    dispatch({ type: 'ADD_TOAST', toast: makeToast(tone, title, detail) })
  }, [])

  const audit = useCallback(
    (actor: string, role: Role, action: string, record: string, reference: string) => {
      dispatch({
        type: 'ADD_LOG',
        log: {
          id: `LOG-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          actor,
          role,
          action,
          record,
          timestamp: Date.now(),
          reference,
        },
      })
    },
    [],
  )

  const requireWallet = useCallback(() => {
    const address = stateRef.current.walletAddress
    if (!address) {
      toast('error', 'Wallet required', 'Connect a wallet address before writing to the ledger.')
      return null
    }
    return address
  }, [toast])

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      toast('error', 'No injected wallet found', 'Install a browser wallet or enter an address manually.')
      return false
    }
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[]
      const address = accounts?.[0]
      if (!address || !isAddress(address)) throw new Error('Wallet did not return a valid address.')
      dispatch({ type: 'SET_WALLET', address })
      toast('success', 'Wallet connected', `${address.slice(0, 10)}…${address.slice(-6)}`)
      return true
    } catch (error) {
      toast('error', 'Wallet connection failed', error instanceof Error ? error.message : 'Request rejected.')
      return false
    }
  }, [toast])

  const useAddress = useCallback(
    (address: string) => {
      if (!isAddress(address)) {
        toast('error', 'Invalid address', 'Enter a valid 20-byte hexadecimal wallet address.')
        return false
      }
      dispatch({ type: 'SET_WALLET', address })
      toast('success', 'Address added', `${address.slice(0, 10)}…${address.slice(-6)}`)
      return true
    },
    [toast],
  )

  const disconnectWallet = useCallback(() => {
    dispatch({ type: 'CLEAR_WALLET' })
    toast('info', 'Wallet disconnected', 'The workspace remains available in read-only mode.')
  }, [toast])

  const setRole = useCallback((role: Role) => dispatch({ type: 'SET_ROLE', role }), [])
  const updateProfile = useCallback((profile: Profile) => dispatch({ type: 'UPDATE_PROFILE', profile }), [])
  const removeToast = useCallback((id: string) => dispatch({ type: 'REMOVE_TOAST', id }), [])
  const clearWorkspace = useCallback(() => {
    dispatch({ type: 'CLEAR_WORKSPACE' })
    toast('info', 'Workspace cleared', 'All locally stored tenders, bids and receipts were removed.')
  }, [toast])
  const exportState = useCallback(() => JSON.stringify(stateRef.current, null, 2), [])

  const createTender = useCallback(
    (input: CreateTenderInput) => {
      const actor = requireWallet()
      if (!actor) return null
      const current = stateRef.current
      const id = `RFQ-${new Date().getUTCFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`
      const policy: Policy = {
        currency: 'NGN',
        commitDeadline: input.commitDeadline,
        revealDeadline: input.revealDeadline,
        requiredDocuments: input.requiredDocuments,
        ruleVersion: 'lowest-eligible-v1',
        tieRule: 'earliest-commit',
      }
      assertTransition('draft', 'publish')
      const tender: Tender = {
        id,
        reference: id,
        title: input.title,
        description: input.description,
        organization: current.profile.organization || 'Unnamed organization',
        status: 'open',
        createdAt: Date.now(),
        policy,
        policyHash: computePolicyHash(id, policy),
        bidders: input.bidders.map((address) => address.trim()).filter((address) => isAddress(address)),
        itemName: input.itemName,
        quantity: input.quantity,
        budgetKobo: input.budgetKobo,
        location: input.location,
      }
      dispatch({ type: 'ADD_TENDER', tender })
      audit(actor, current.role, 'Policy locked', id, tender.policyHash)
      toast('success', 'Tender published', `${id} is open for commitments.`)
      return id
    },
    [audit, requireWallet, toast],
  )

  const closeTender = useCallback(
    (id: string) => {
      const actor = requireWallet()
      if (!actor) return false
      const current = stateRef.current
      const tender = current.tenders.find((item) => item.id === id)
      if (!tender || tender.status !== 'open') return false
      assertTransition(tender.status, 'close')
      dispatch({ type: 'SET_TENDER_STATUS', id, status: 'closed' })
      audit(actor, current.role, 'Tender closed', id, tender.policyHash)
      toast('success', 'Tender closed', 'Commitments are frozen. The reveal window is active.')
      return true
    },
    [audit, requireWallet, toast],
  )

  const startEvaluation = useCallback(
    (id: string) => {
      const actor = requireWallet()
      if (!actor) return false
      const current = stateRef.current
      const tender = current.tenders.find((item) => item.id === id)
      if (!tender || tender.status !== 'closed') return false
      assertTransition(tender.status, 'review')
      dispatch({ type: 'SET_TENDER_STATUS', id, status: 'evaluation' })
      audit(actor, current.role, 'Evaluation opened', id, tender.policyHash)
      return true
    },
    [audit, requireWallet],
  )

  const cancelTender = useCallback(
    (id: string) => {
      const actor = requireWallet()
      if (!actor) return false
      const current = stateRef.current
      const tender = current.tenders.find((item) => item.id === id)
      if (!tender || !['draft', 'open', 'closed', 'evaluation'].includes(tender.status)) return false
      assertTransition(tender.status, 'cancel')
      dispatch({ type: 'SET_TENDER_STATUS', id, status: 'cancelled' })
      audit(actor, current.role, 'Tender cancelled', id, tender.policyHash)
      toast('info', 'Tender cancelled', `${id} is now terminal.`)
      return true
    },
    [audit, requireWallet, toast],
  )

  const submitBid = useCallback(
    async (input: SubmitBidInput) => {
      const actor = requireWallet()
      if (!actor) return { ok: false, reason: 'Connect a wallet before committing a quotation.' }
      const current = stateRef.current
      const tender = current.tenders.find((item) => item.id === input.tenderId)
      if (!tender) return { ok: false, reason: 'Tender not found.' }
      if (tender.status !== 'open') return { ok: false, reason: 'This tender is not open for commitments.' }
      if (Date.now() > tender.policy.commitDeadline) return { ok: false, reason: 'The commitment deadline has passed.' }
      if (current.bids.some((bid) => bid.tenderId === tender.id && bid.wallet.toLowerCase() === actor.toLowerCase())) {
        return { ok: false, reason: 'This wallet already has a commitment on this tender.' }
      }
      if (!isAddress(actor)) return { ok: false, reason: 'Connected wallet address is invalid.' }
      const commitment = computeCommitment({
        tenderId: tender.id,
        bidder: actor,
        priceKobo: input.priceKobo,
        documentHash: input.documentHash,
        salt: input.salt,
      })
      const bid: Bid = {
        id: `BID-${Date.now().toString(36).toUpperCase()}`,
        tenderId: tender.id,
        supplierId: actor,
        supplierName: current.profile.name || actor.slice(0, 10),
        wallet: actor,
        priceKobo: input.priceKobo,
        documentHash: input.documentHash,
        documentName: input.documentName,
        salt: input.salt,
        commitment,
        committedAt: Date.now(),
        status: 'committed',
        localReference: referenceId(`commit-${tender.id}-${actor}`),
      }
      dispatch({ type: 'ADD_BID', bid })
      audit(actor, current.role, 'Bid committed', bid.id, bid.localReference)
      toast('success', 'Commitment recorded', `${bid.id} · ${commitment.slice(0, 12)}…`)
      return { ok: true, bidId: bid.id }
    },
    [audit, requireWallet, toast],
  )

  const revealBid = useCallback(
    async (input: RevealBidInput) => {
      const actor = requireWallet()
      if (!actor) return { ok: false, reason: 'Connect the original bidder wallet.' }
      const current = stateRef.current
      const bid = current.bids.find((item) => item.id === input.bidId)
      const tender = bid ? current.tenders.find((item) => item.id === bid.tenderId) : undefined
      if (!bid || !tender) return { ok: false, reason: 'Bid not found.' }
      if (bid.wallet.toLowerCase() !== actor.toLowerCase()) {
        return { ok: false, reason: 'Only the original bidder wallet can reveal this commitment.' }
      }
      if (Date.now() > tender.policy.revealDeadline) {
        return { ok: false, reason: 'The reveal window has closed.' }
      }
      const valid = verifyCommitment(bid.commitment, {
        tenderId: tender.id,
        bidder: bid.wallet,
        priceKobo: input.priceKobo,
        documentHash: input.documentHash,
        salt: input.salt,
      })
      if (!valid) {
        dispatch({
          type: 'UPDATE_BID',
          id: bid.id,
          patch: { status: 'invalid', revealError: 'Commitment verification failed. Price, document hash or salt does not match.' },
        })
        toast('error', 'Verification failed', 'The reveal does not match the committed hash.')
        return { ok: false, reason: 'Commitment verification failed.' }
      }
      dispatch({
        type: 'UPDATE_BID',
        id: bid.id,
        patch: { status: 'revealed', revealedAt: Date.now(), revealError: undefined },
      })
      audit(actor, current.role, 'Bid revealed', bid.id, bid.commitment)
      toast('success', 'Commitment verified', `${bid.id} is available for eligibility review.`)
      return { ok: true }
    },
    [audit, requireWallet, toast],
  )

  const attestEligibility = useCallback(
    async (bidId: string, inputs: EligibilityInput[]) => {
      const actor = requireWallet()
      if (!actor) return false
      if (stateRef.current.role !== 'reviewer') {
        toast('error', 'Reviewer role required', 'Switch to the reviewer role before attesting evidence.')
        return false
      }
      const local = evaluateEligibility(inputs, Date.now())
      const onChain = await evaluateEligibilityOnChain(local.bits, { expectedResult: local.result })
      const eligibility = { ...local, onChain }
      dispatch({ type: 'UPDATE_BID', id: bidId, patch: { eligibility } })
      audit(actor, 'reviewer', 'Eligibility attested', bidId, eligibility.circuitId)
      toast(
        eligibility.result ? 'success' : 'info',
        eligibility.result ? 'Supplier marked eligible' : 'Supplier marked ineligible',
        `${eligibility.circuitId} returned ${eligibility.result ? '1' : '0'} locally; on-chain: ${onChain.status}.`,
      )
      return true
    },
    [audit, requireWallet, toast],
  )

  const finalizeAward = useCallback(
    (tenderId: string, overrideBidId?: string) => {
      const actor = requireWallet()
      if (!actor) return false
      const current = stateRef.current
      if (current.role !== 'approver') {
        toast('error', 'Approver role required', 'Switch to the approver role before finalizing an award.')
        return false
      }
      const tender = current.tenders.find((item) => item.id === tenderId)
      if (!tender || tender.status !== 'evaluation') return false
      const decision = selectWinner(current.bids.filter((bid) => bid.tenderId === tenderId), tender.policy)
      if (overrideBidId && decision.winner?.id !== overrideBidId) {
        toast('error', 'Award refused', 'The selected bid violates the locked lowest-eligible-price rule.')
        return false
      }
      if (!decision.winner) {
        toast('error', 'Award blocked', decision.reason)
        return false
      }
      const award: AppState['awards'][number] = {
        tenderId,
        winningBidId: decision.winner.id,
        priceKobo: decision.winner.priceKobo,
        approvedBy: actor,
        approvedAt: Date.now(),
        localReference: referenceId(`award-${tenderId}`),
        policyHash: tender.policyHash,
        commitment: decision.winner.commitment,
        complianceNote: decision.reason,
      }
      dispatch({ type: 'ADD_AWARD', award })
      dispatch({ type: 'SET_TENDER_STATUS', id: tenderId, status: 'awarded' })
      audit(actor, 'approver', 'Award finalized', tenderId, award.localReference)
      toast('success', 'Award recorded', `${decision.winner.supplierName} · ${decision.winner.id}`)
      return true
    },
    [audit, requireWallet, toast],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      now,
      walletAddress: state.walletAddress,
      connectWallet,
      useAddress,
      disconnectWallet,
      setRole,
      updateProfile,
      removeToast,
      clearWorkspace,
      exportState,
      createTender,
      closeTender,
      startEvaluation,
      cancelTender,
      submitBid,
      revealBid,
      attestEligibility,
      finalizeAward,
    }),
    [
      state,
      connectWallet,
      useAddress,
      disconnectWallet,
      setRole,
      updateProfile,
      removeToast,
      clearWorkspace,
      exportState,
      createTender,
      closeTender,
      startEvaluation,
      cancelTender,
      submitBid,
      revealBid,
      attestEligibility,
      finalizeAward,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
