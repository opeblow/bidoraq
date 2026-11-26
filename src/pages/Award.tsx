import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Ban, Check, Download, Gavel, LockKeyhole, ScanSearch } from 'lucide-react'
import { PageHeader, ReceiptCard } from '../components/Domain'
import { Badge, Button, Card, DataRow, Mono } from '../components/ui'
import { useApp } from '../state/store'
import { selectWinner } from '../lib/award'
import { buildReceipt, downloadJson } from '../lib/receipt'
import { formatDate, formatMoney, shortHash } from '../lib/format'

export function Award() {
  const { id } = useParams()
  const { state, finalizeAward, setRole } = useApp()
  const [attempt, setAttempt] = useState<string | null>(null)
  const tender = state.tenders.find((item) => item.id === id)
  const award = state.awards.find((item) => item.tenderId === id)

  if (!tender) {
    return <Card className="p-8"><h1 className="text-xl font-semibold">Tender not found</h1><p className="mt-2 text-sm text-muted">This reference is not in the workspace ledger.</p></Card>
  }

  if (state.role !== 'approver') {
    return (
      <>
        <PageHeader eyebrow={`Workspace / ${tender.reference}`} title="Approval authority wallet required" detail="The approver records the outcome. They cannot rewrite the rule or select a non-compliant bid." />
        <Card className="max-w-xl p-6">
          <p className="text-sm leading-6 text-muted">You are currently acting as {state.role}. Switch to the approver identity to continue.</p>
          <Button className="mt-5" onClick={() => setRole('approver')}>Switch to approver</Button>
        </Card>
      </>
    )
  }

  const decision = selectWinner(state.bids.filter((bid) => bid.tenderId === tender.id), tender.policy)
  const winningBid = decision.winner
  const winningAward = award ?? state.awards.find((item) => item.tenderId === tender.id)

  const tryOverride = (bidId: string) => {
    setAttempt(bidId)
    finalizeAward(tender.id, bidId)
  }

  const exportReceipt = () => {
    if (!winningAward) return
    const receipt = buildReceipt(tender, winningAward, state.bids)
    downloadJson(receipt, `bidoraq-receipt-${tender.reference}.json`)
  }

  return (
    <>
      <PageHeader
        eyebrow={`Workspace / ${tender.reference}`}
        title="Award control"
        detail="The rule is evaluated before the approver signs. Non-compliant selections are refused and recorded as an exception."
        actions={winningAward ? (
          <>
            <Button size="sm" variant="secondary" onClick={exportReceipt}><Download className="h-3.5 w-3.5" /> Export receipt</Button>
            <Link to="/verify"><Button size="sm" variant="verified"><ScanSearch className="h-3.5 w-3.5" /> Verify receipt</Button></Link>
          </>
        ) : undefined}
      />

      <div className="mb-6 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Locked rule</div><div className="mt-2 text-sm font-semibold">lowest eligible quotation</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Tie break</div><div className="mt-2 text-sm font-semibold">{tender.policy.tieRule}</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Policy hash</div><Mono className="mt-2 block text-ink">{shortHash(tender.policyHash, 12, 8)}</Mono></div>
      </div>

      {winningAward && winningBid ? (
        <div className="mb-7 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="border border-mint-deep/30 bg-mint/10 p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mint-deep"><Check className="h-3.5 w-3.5" /> award finalized</div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.05em]">{winningBid.supplierName}</h2>
            <div className="mt-2 text-3xl font-semibold tracking-[-0.06em] tabular">{formatMoney(winningAward.priceKobo)}</div>
            <div className="mt-6 border-t border-mint-deep/20 pt-5">
              <p className="text-sm leading-6 text-muted">{winningAward.complianceNote}</p>
            </div>
            <Link to="/verify" className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink hover:underline">Inspect redacted receipt <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <ReceiptCard tender={tender} bid={winningBid} award={winningAward} />
        </div>
      ) : null}

      <div className="grid gap-7 xl:grid-cols-[1fr_0.62fr]">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-[-0.04em]">Eligible ranking</h2>
              <p className="mt-1 text-sm text-muted">Ineligible revealed bids are listed but cannot enter the ranking.</p>
            </div>
            <Badge tone={decision.compliant ? 'verified' : 'danger'}>{decision.ranked.length} eligible</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="border-b border-line bg-paper/60 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                  <th className="px-6 py-3 font-normal">Rank</th>
                  <th className="px-6 py-3 font-normal">Supplier</th>
                  <th className="px-6 py-3 font-normal">Price</th>
                  <th className="px-6 py-3 font-normal">Committed</th>
                  <th className="px-6 py-3 font-normal">Eligibility</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {state.bids.filter((bid) => bid.tenderId === tender.id).map((bid) => {
                  const eligible = bid.eligibility?.result === true
                  const rank = decision.ranked.findIndex((item) => item.id === bid.id)
                  const isWinner = winningBid?.id === bid.id
                  return (
                    <tr key={bid.id} className={`border-b border-line/70 last:border-b-0 ${isWinner ? 'bg-mint/10' : ''}`}>
                      <td className="px-6 py-4 font-mono text-xs text-muted">{eligible ? String(rank + 1).padStart(2, '0') : '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold">{bid.supplierName}</div>
                        <div className="mt-0.5 font-mono text-[10px] text-muted">{shortHash(bid.commitment, 9, 5)}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold tabular">{formatMoney(bid.priceKobo)}</td>
                      <td className="px-6 py-4 font-mono text-[10px] text-muted">{formatDate(bid.committedAt)}</td>
                      <td className="px-6 py-4"><Badge tone={eligible ? 'verified' : 'danger'}>{eligible ? 'eligible' : 'ineligible'}</Badge></td>
                      <td className="px-6 py-4 text-right">
                        {!winningAward && eligible && !isWinner ? (
                          <Button size="sm" variant="ghost" className="text-clay hover:bg-clay/5" onClick={() => tryOverride(bid.id)}>
                            <Ban className="h-3.5 w-3.5" /> Try override
                          </Button>
                        ) : null}
                        {isWinner ? <Badge tone="ink">computed winner</Badge> : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <aside className="space-y-5">
          <div className="border border-ink bg-ink p-5 text-paper">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mint"><LockKeyhole className="h-3.5 w-3.5" /> Compliance gate</div>
            <div className="mt-5 space-y-4">
              <DataRow label="Reviewed bids" value={String(state.bids.filter((bid) => bid.tenderId === tender.id && bid.status === 'revealed').length)} />
              <DataRow label="Eligible bids" value={String(decision.ranked.length)} />
              <DataRow label="Computed winner" value={winningBid?.supplierName ?? 'None'} />
              <DataRow label="Override allowed" value="No" />
            </div>
            {!winningAward ? (
              <Button variant="verified" className="mt-6 w-full" disabled={!winningBid || tender.status !== 'evaluation'} onClick={() => finalizeAward(tender.id)}>
                <Gavel className="h-4 w-4" /> Finalize compliant award
              </Button>
            ) : (
              <div className="mt-6 border-t border-paper/15 pt-4 font-mono text-[10px] text-paper/60">local ref · {shortHash(winningAward.localReference, 12, 8)}</div>
            )}
          </div>

          {attempt ? (
            <div className="border border-clay/40 bg-clay/5 p-5">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-clay"><Ban className="h-3.5 w-3.5" /> override refused</div>
              <p className="mt-3 text-sm leading-6">Bid {attempt} could not be selected. The approver cannot choose a bid outside the locked rule; the exception is written to the activity ledger.</p>
            </div>
          ) : null}

          <div className="border border-line bg-surface p-5">
            <div className="text-sm font-semibold">Rule expression</div>
            <div className="mt-3 break-all border border-line bg-paper p-3 font-mono text-[10px] leading-5">winner = min(price_kobo | revealed ∧ eligible) then {tender.policy.tieRule}</div>
            <p className="mt-3 text-xs leading-5 text-muted">Changing a revealed price after commitment fails hash verification before this expression runs.</p>
          </div>
        </aside>
      </div>
    </>
  )
}
