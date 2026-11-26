import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Clock3, FilePlus2, Gavel, ScanSearch, ShieldCheck, Users } from 'lucide-react'
import { BidCard, PageHeader, StatusPill } from '../components/Domain'
import { Badge, Button, DataRow, EmptyState, Mono, Tabs } from '../components/ui'
import { useApp } from '../state/store'
import { formatCountdown, formatDate, formatMoney, shortHash } from '../lib/format'

type Tab = 'overview' | 'bids' | 'activity'

export function TenderDetail() {
  const { id } = useParams()
  const { state, now, closeTender, startEvaluation } = useApp()
  const [tab, setTab] = useState<Tab>('overview')
  const tender = state.tenders.find((item) => item.id === id)
  const award = state.awards.find((item) => item.tenderId === id)

  if (!tender) {
    return <EmptyState title="Tender not found" detail="This reference does not exist in the workspace ledger." action={<Link to="/app"><Button>Return to ledger</Button></Link>} />
  }

  const bids = state.bids.filter((bid) => bid.tenderId === tender.id)
  const policy = tender.policy

  return (
    <>
      <PageHeader
        eyebrow={`Workspace / ${tender.reference}`}
        title={tender.title}
        detail={tender.description}
        actions={
          <>
            {tender.status === 'open' && state.role === 'supplier' ? <Link to={`/app/tenders/${tender.id}/submit`}><Button size="sm"><FilePlus2 className="h-3.5 w-3.5" /> Commit quotation</Button></Link> : null}
            {tender.status === 'open' && state.role === 'buyer' ? <Button size="sm" variant="secondary" onClick={() => closeTender(tender.id)}><Clock3 className="h-3.5 w-3.5" /> Close commitments</Button> : null}
            {tender.status === 'closed' && state.role === 'buyer' ? <Button size="sm" variant="secondary" onClick={() => startEvaluation(tender.id)}><ShieldCheck className="h-3.5 w-3.5" /> Open evaluation</Button> : null}
            {award ? <Link to="/verify"><Button size="sm" variant="verified"><ScanSearch className="h-3.5 w-3.5" /> View receipt</Button></Link> : null}
          </>
        }
      />

      <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Status', <StatusPill status={tender.status} />, ''],
          ['Commit window', formatCountdown(policy.commitDeadline, now), formatDate(policy.commitDeadline)],
          ['Reveal window', formatCountdown(policy.revealDeadline, now), formatDate(policy.revealDeadline)],
          ['Budget', formatMoney(tender.budgetKobo, policy.currency), `${tender.quantity} units`],
        ].map(([label, value, note]) => (
          <div key={String(label)} className="bg-surface p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{label}</div>
            <div className="mt-3 text-xl font-semibold tracking-[-0.04em] tabular">{value}</div>
            {note ? <div className="mt-1 font-mono text-[10px] text-muted">{note}</div> : null}
          </div>
        ))}
      </div>

      <div className="mt-7 border-y border-line bg-surface px-5 py-4">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'overview', label: 'Policy & scope' },
            { id: 'bids', label: 'Commitments', count: bids.length },
            { id: 'activity', label: 'Activity', count: state.logs.filter((log) => log.record.includes(tender.id) || bids.some((bid) => bid.id === log.record)).length },
          ]}
        />
      </div>

      {tab === 'overview' ? (
        <div className="mt-7 grid gap-7 xl:grid-cols-[1fr_0.68fr]">
          <section className="border border-line bg-surface p-6">
            <h2 className="text-lg font-semibold tracking-[-0.04em]">Locked policy</h2>
            <p className="mt-1 text-sm text-muted">This hash fixes deadlines, document requirements, rule version and tie behaviour.</p>
            <div className="mt-5 border border-line bg-paper px-5 py-2">
              <DataRow label="Currency" value={policy.currency} />
              <DataRow label="Rule version" value={policy.ruleVersion} />
              <DataRow label="Tie rule" value={policy.tieRule} />
              <DataRow label="Required documents" value={`${policy.requiredDocuments.length} items`} />
              <DataRow label="Invited wallets" value={`${tender.bidders.length} suppliers`} />
              <DataRow label="Policy hash" value={<Mono>{shortHash(tender.policyHash, 14, 10)}</Mono>} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {policy.requiredDocuments.map((documentName) => <Badge key={documentName} tone="outline">{documentName}</Badge>)}
            </div>
          </section>

          <aside className="space-y-5">
            <div className="border border-line bg-paper p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><Users className="h-3.5 w-3.5" /> Invited suppliers</div>
              <div className="mt-4 space-y-3">
                {tender.bidders.map((address) => (
                  <div key={address} className="flex items-center justify-between gap-3 border-b border-line/70 pb-3 last:border-b-0">
                    <Mono className="text-ink">{shortHash(address, 10, 6)}</Mono>
                    <Badge tone={bids.some((bid) => bid.wallet === address) ? 'verified' : 'neutral'}>
                      {bids.some((bid) => bid.wallet === address) ? 'committed' : 'invited'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-ink bg-ink p-5 text-paper">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-mint">Audit note</div>
              <p className="mt-3 text-sm leading-6 text-paper/70">The public record never exposes document contents. Only the document hash, commitment and final rule outcome are retained.</p>
            </div>
          </aside>
        </div>
      ) : null}

      {tab === 'bids' ? (
        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {bids.length > 0 ? bids.map((bid) => (
            <BidCard key={bid.id} bid={bid}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="font-mono text-[10px] text-muted">tx {shortHash(bid.transactionHash, 10, 6)}</div>
                {bid.status === 'committed' ? (
                  <Link to={`/app/tenders/${tender.id}/submit`} className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink hover:underline">
                    Reveal <ArrowRight className="h-3 w-3" />
                  </Link>
                ) : null}
                {bid.status === 'revealed' && bid.eligibility?.result ? (
                  <Badge tone="verified">hash verified</Badge>
                ) : null}
              </div>
            </BidCard>
          )) : (
            <div className="lg:col-span-2"><EmptyState title="No commitments yet" detail="Invited suppliers can seal a quotation while the tender is open." /></div>
          )}
        </div>
      ) : null}

      {tab === 'activity' ? (
        <div className="mt-7 border border-line bg-surface">
          {state.logs.filter((log) => log.record.includes(tender.id) || bids.some((bid) => bid.id === log.record)).map((log) => (
            <div key={log.id} className="flex flex-col gap-2 border-b border-line/70 px-5 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold">{log.action}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted">{log.record} · {log.role}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-muted">{formatDate(log.timestamp)}</div>
                <div className="mt-0.5 font-mono text-[10px] text-muted">{shortHash(log.reference, 10, 6)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tender.status !== 'awarded' ? (
        <div className="mt-8 flex flex-col gap-4 border border-line bg-paper p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold">Move to the decision phase</div>
            <div className="mt-1 text-xs text-muted">Evidence review, award control and public receipts live in the dedicated views.</div>
          </div>
          <div className="flex gap-2">
            <Link to={`/app/tenders/${tender.id}/review`}><Button variant="secondary" size="sm"><ShieldCheck className="h-3.5 w-3.5" /> Review</Button></Link>
            <Link to={`/app/tenders/${tender.id}/award`}><Button size="sm"><Gavel className="h-3.5 w-3.5" /> Award</Button></Link>
          </div>
        </div>
      ) : null}
    </>
  )
}
