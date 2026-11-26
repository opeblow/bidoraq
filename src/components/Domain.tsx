import { Link } from 'react-router-dom'
import { ArrowUpRight, Check, CircleDot, FileSearch, LockKeyhole, X } from 'lucide-react'
import { Badge, DataRow, Mono } from './ui'
import { useApp } from '../state/store'
import { cx } from '../lib/cx'
import { formatCountdown, formatDate, formatMoney, shortHash } from '../lib/format'
import type { Award, Bid, EligibilityResult, Tender, TenderStatus } from '../types'

const tenderTones: Record<TenderStatus, 'verified' | 'warning' | 'ink' | 'neutral' | 'danger'> = {
  open: 'verified',
  closed: 'neutral',
  evaluation: 'warning',
  awarded: 'ink',
  cancelled: 'danger',
  expired: 'danger',
  draft: 'neutral',
}

export function StatusPill({ status }: { status: TenderStatus | Bid['status'] }) {
  const tone = status in tenderTones ? tenderTones[status as TenderStatus] : status === 'revealed' ? 'verified' : status === 'committed' ? 'warning' : 'danger'
  return <Badge tone={tone}>{status}</Badge>
}

export function PageHeader({
  eyebrow,
  title,
  detail,
  actions,
}: {
  eyebrow: string
  title: string
  detail?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 border-b border-line pb-7 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">{eyebrow}</div>
        <h1 className="text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.055em] md:text-4xl">{title}</h1>
        {detail ? <p className="mt-3 text-sm leading-6 text-muted md:text-base">{detail}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function TenderTable({ tenders }: { tenders: Tender[] }) {
  const { state, now } = useApp()

  if (tenders.length === 0) {
    return <div className="border border-line bg-surface px-6 py-12 text-center text-sm text-muted">No tenders match this filter.</div>
  }

  return (
    <>
      <div className="hidden overflow-x-auto border border-line bg-surface md:block">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-line bg-paper/60 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              <th className="px-5 py-4 font-normal">RFQ / item</th>
              <th className="px-5 py-4 font-normal">Status</th>
              <th className="px-5 py-4 font-normal">Commit window</th>
              <th className="px-5 py-4 font-normal">Bids</th>
              <th className="px-5 py-4 font-normal">Budget</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody>
            {tenders.map((tender) => {
              const bids = state.bids.filter((bid) => bid.tenderId === tender.id)
              return (
                <tr key={tender.id} className="border-b border-line/70 last:border-b-0 hover:bg-paper/50">
                  <td className="px-5 py-4">
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{tender.reference}</div>
                    <div className="mt-1.5 text-sm font-semibold tracking-tight">{tender.title}</div>
                    <div className="mt-1 text-xs text-muted">{tender.itemName} · {tender.quantity} units · {tender.location}</div>
                  </td>
                  <td className="px-5 py-4"><StatusPill status={tender.status} /></td>
                  <td className="px-5 py-4">
                    <div className="text-xs tabular">{formatCountdown(tender.policy.commitDeadline, now)}</div>
                    <div className="mt-1 font-mono text-[10px] text-muted">reveal {formatCountdown(tender.policy.revealDeadline, now)}</div>
                  </td>
                  <td className="px-5 py-4 text-sm tabular">{bids.length}<span className="text-muted"> / {tender.bidders.length}</span></td>
                  <td className="px-5 py-4 text-sm tabular">{formatMoney(tender.budgetKobo, tender.policy.currency)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link to={`/app/tenders/${tender.id}`} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink">
                      Open <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="grid gap-px border border-line bg-line md:hidden">
        {tenders.map((tender) => {
          const bids = state.bids.filter((bid) => bid.tenderId === tender.id)
          return (
            <Link key={tender.id} to={`/app/tenders/${tender.id}`} className="block bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{tender.reference}</span>
                <StatusPill status={tender.status} />
              </div>
              <div className="mt-2 text-sm font-semibold leading-5">{tender.title}</div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted">
                <span>{bids.length} bids · {formatCountdown(tender.policy.commitDeadline, now)}</span>
                <span className="tabular">{formatMoney(tender.budgetKobo)}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </>
  )
}

export function BidCard({ bid, children }: { bid: Bid; children?: React.ReactNode }) {
  const eligible = bid.eligibility?.result
  return (
    <div className="border border-line bg-surface">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <div className="text-sm font-semibold tracking-tight">{bid.supplierName}</div>
          <div className="mt-1 font-mono text-[10px] text-muted">{shortHash(bid.wallet, 10, 8)}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-semibold tracking-[-0.04em] tabular">{formatMoney(bid.priceKobo)}</div>
          <div className="mt-1 flex items-center justify-end gap-2"><StatusPill status={bid.status} /></div>
        </div>
      </div>
      <div className="grid gap-x-8 px-5 py-4 sm:grid-cols-2">
        <DataRow label="Committed" value={formatDate(bid.committedAt)} />
        <DataRow label="Revealed" value={bid.revealedAt ? formatDate(bid.revealedAt) : 'Pending'} />
        <DataRow label="Document" value={<Mono>{shortHash(bid.documentHash, 8, 4)}</Mono>} />
        <DataRow label="Eligibility" value={eligible === undefined ? 'Not attested' : eligible ? 'Eligible' : 'Ineligible'} />
      </div>
      {bid.revealError ? <div className="border-t border-clay/30 bg-clay/5 px-5 py-3 text-xs text-clay">{bid.revealError}</div> : null}
      {children ? <div className="border-t border-line bg-paper/50 px-5 py-4">{children}</div> : null}
    </div>
  )
}

export function EligibilityTrace({ result }: { result: EligibilityResult }) {
  return (
    <div className="border border-line bg-paper/60">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">NAND circuit trace</div>
        <Badge tone={result.result ? 'verified' : 'danger'}>{result.result ? 'eligible' : 'ineligible'}</Badge>
      </div>
      <div className="divide-y divide-line/70">
        {result.trace.map((line, index) => (
          <div key={line.gate} className="flex items-center justify-between gap-3 px-4 py-2.5">
            <span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex-1 text-xs text-ink">{line.gate}</span>
            <span className="flex items-center gap-1 font-mono text-[11px] text-muted">
              <span>{line.inputs[0] ? '1' : '0'}</span>
              <span>·</span>
              <span>{line.inputs[1] ? '1' : '0'}</span>
              <span className="ml-2">→</span>
              <span className={cx('font-semibold', line.output ? 'text-mint-deep' : 'text-clay')}>{line.output ? '1' : '0'}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-line px-4 py-3 font-mono text-[10px] text-muted">
        {result.circuitId} · processor {shortHash(result.processor, 8, 4)}
      </div>
    </div>
  )
}

export function ReceiptCard({ tender, bid, award, compact = false }: { tender: Tender; bid: Bid; award: Award; compact?: boolean }) {
  return (
    <div className={cx('border border-line bg-surface', compact ? '' : 'shadow-ledger')}>
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            <FileSearch className="h-3.5 w-3.5" /> Redacted verification receipt
          </div>
          <div className="mt-2 text-lg font-semibold tracking-[-0.04em]">{tender.reference}</div>
        </div>
        <div className="flex h-9 w-9 items-center justify-center border border-mint-deep bg-mint text-mint-deep">
          <Check className="h-4 w-4" strokeWidth={3} />
        </div>
      </div>
      <div className="grid gap-x-8 px-5 py-4 sm:grid-cols-2">
        <DataRow label="Awarded bid" value={<Mono>{bid.id}</Mono>} />
        <DataRow label="Price" value={formatMoney(award.priceKobo, tender.policy.currency)} />
        <DataRow label="Policy hash" value={<Mono>{shortHash(award.policyHash, 10, 6)}</Mono>} />
        <DataRow label="Commitment" value={<Mono>{shortHash(award.commitment, 10, 6)}</Mono>} />
        <DataRow label="Rule" value={tender.policy.ruleVersion} />
        <DataRow label="Approved" value={formatDate(award.approvedAt)} />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-paper/60 px-5 py-3 text-xs text-muted">
        <LockKeyhole className="h-3.5 w-3.5" />
        Supplier identity and document contents are omitted; hashes remain verifiable.
      </div>
      <div className="border-t border-line px-5 py-3 font-mono text-[10px] text-muted">
        tx {shortHash(award.transactionHash, 14, 8)}
      </div>
    </div>
  )
}

export function CircleStatus({ value }: { value: boolean }) {
  return value ? <Check className="h-4 w-4 text-mint-deep" /> : <X className="h-4 w-4 text-clay" />
}

export function MutedDot() {
  return <CircleDot className="h-3.5 w-3.5 text-muted" />
}
