import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FilePlus2, Gavel, ScanSearch, ShieldCheck } from 'lucide-react'
import { PageHeader, StatusPill, TenderTable } from '../components/Domain'
import { ChainStatus } from '../components/ChainStatus'
import { Badge, Button, EmptyState, Stat, Tabs } from '../components/ui'
import { useApp } from '../state/store'
import { formatDate, shortHash } from '../lib/format'

type Filter = 'all' | 'active' | 'review' | 'terminal'

export function Dashboard() {
  const { state, closeTender, startEvaluation } = useApp()
  const [filter, setFilter] = useState<Filter>('all')

  const active = state.tenders.filter((tender) => ['open', 'closed', 'evaluation'].includes(tender.status))
  const focusTender = state.tenders.find((tender) => tender.status === 'evaluation') ?? active[0]
  const exceptions = state.bids.filter((bid) => bid.status === 'invalid' || bid.eligibility?.result === false)
  const filtered = state.tenders.filter((tender) => {
    if (filter === 'all') return true
    if (filter === 'active') return ['open', 'closed', 'evaluation'].includes(tender.status)
    if (filter === 'review') return tender.status === 'evaluation'
    return ['awarded', 'cancelled', 'expired'].includes(tender.status)
  })

  const tabs: Array<{ id: Filter; label: string; count: number }> = [
    { id: 'all', label: 'All tenders', count: state.tenders.length },
    { id: 'active', label: 'Active', count: active.length },
    { id: 'review', label: 'In review', count: state.tenders.filter((tender) => tender.status === 'evaluation').length },
    { id: 'terminal', label: 'Closed records', count: state.tenders.filter((tender) => ['awarded', 'cancelled', 'expired'].includes(tender.status)).length },
  ]

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Overview"
        title="Procurement control room"
        detail="Every tender, commitment and decision in one chain of custody. Connect a wallet and switch roles to see what each participant is allowed to do."
        actions={
          <>
            <Link to="/verify"><Button variant="secondary" size="sm"><ScanSearch className="h-3.5 w-3.5" /> Verify receipt</Button></Link>
            <Link to="/app/tenders/new"><Button size="sm"><FilePlus2 className="h-3.5 w-3.5" /> New RFQ</Button></Link>
          </>
        }
      />

      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-surface p-5"><Stat label="Active tenders" value={active.length} note={`${state.tenders.filter((tender) => tender.status === 'open').length} accepting commitments`} /></div>
        <div className="bg-surface p-5"><Stat label="Commitments" value={state.bids.length} note={`${state.bids.filter((bid) => bid.status === 'revealed').length} revealed`} /></div>
        <div className="bg-surface p-5"><Stat label="Exceptions" value={exceptions.length} tone="warning" note="ineligible or failed reveal" /></div>
        <div className="bg-surface p-5"><Stat label="Verified awards" value={state.awards.length} tone="verified" note="redacted receipts published" /></div>
      </div>

      <div className="mt-6">
        <ChainStatus />
      </div>

      {focusTender ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          <section className="relative overflow-hidden border border-ink bg-ink p-6 text-paper lg:p-8">
            <div className="absolute right-0 top-0 h-full w-1/3 opacity-[0.12] grid-paper" />
            <div className="relative flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-mint">
                  <span className="h-1.5 w-1.5 animate-blink bg-mint" /> Current decision
                </div>
                <h2 className="mt-5 max-w-xl text-balance text-2xl font-semibold leading-tight tracking-[-0.05em] lg:text-3xl">{focusTender.title}</h2>
                <div className="mt-3 font-mono text-[10px] text-paper/50">{focusTender.reference} · policy {shortHash(focusTender.policyHash, 10, 6)}</div>
              </div>
              <StatusPill status={focusTender.status} />
            </div>
            <div className="relative mt-8 grid gap-px border border-paper/15 bg-paper/15 sm:grid-cols-3">
              {[
                ['Revealed bids', String(state.bids.filter((bid) => bid.tenderId === focusTender.id && bid.status === 'revealed').length)],
                ['Rule', 'lowest eligible'],
                ['Tie break', focusTender.policy.tieRule],
              ].map(([label, value]) => (
                <div key={label} className="bg-ink px-4 py-4">
                  <div className="font-mono text-[9px] uppercase tracking-[0.14em] text-paper/50">{label}</div>
                  <div className="mt-2 text-sm font-semibold">{value}</div>
                </div>
              ))}
            </div>
            <div className="relative mt-7 flex flex-wrap gap-2">
              <Link to={`/app/tenders/${focusTender.id}/review`}><Button variant="verified" size="sm"><ShieldCheck className="h-3.5 w-3.5" /> Review evidence</Button></Link>
              <Link to={`/app/tenders/${focusTender.id}/award`}><Button variant="secondary" size="sm" className="border-paper/25 bg-transparent text-paper hover:bg-paper/10"><Gavel className="h-3.5 w-3.5" /> Award control</Button></Link>
              {state.role === 'buyer' && focusTender.status === 'closed' ? (
                <Button size="sm" variant="ghost" className="text-mint hover:bg-mint/10" onClick={() => startEvaluation(focusTender.id)}>
                  <ShieldCheck className="h-3.5 w-3.5" /> Open evaluation
                </Button>
              ) : null}
              {state.role === 'buyer' && focusTender.status === 'open' ? (
                <Button size="sm" variant="ghost" className="text-mint hover:bg-mint/10" onClick={() => closeTender(focusTender.id)}>
                  Close commitments
                </Button>
              ) : null}
            </div>
          </section>

          <section className="border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Ledger activity</div>
              <Badge tone="outline">local</Badge>
            </div>
            <div className="max-h-[380px] overflow-y-auto scroll-thin">
              {state.logs.length > 0 ? state.logs.slice(0, 8).map((log) => (
                <div key={log.id} className="flex gap-4 border-b border-line/60 px-5 py-3.5 last:border-b-0">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-mint-deep" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{log.action}</div>
                    <div className="mt-0.5 text-xs text-muted">{formatDate(log.timestamp)} · {log.role}</div>
                    <div className="mt-1 truncate font-mono text-[10px] text-muted">{log.reference}</div>
                  </div>
                </div>
              )) : <div className="px-5 py-10 text-center text-sm text-muted">No activity recorded yet.</div>}
            </div>
          </section>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No tenders in the ledger"
            detail="Publish the first RFQ to lock a policy, invite suppliers and begin the evidence trail."
            action={<Link to="/app/tenders/new"><Button><FilePlus2 className="h-4 w-4" /> Create RFQ</Button></Link>}
          />
        </div>
      )}

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Tender ledger</h2>
            <p className="mt-1 text-sm text-muted">One row per procurement. The hash lock is created before the first commitment.</p>
          </div>
          <Tabs items={tabs} value={filter} onChange={setFilter} />
        </div>
        {filtered.length > 0 ? <TenderTable tenders={filtered} /> : <EmptyState title="Nothing in this view" detail="Change the filter or publish a new RFQ to continue." />}
      </section>
    </>
  )
}
