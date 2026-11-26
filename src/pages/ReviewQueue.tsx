import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Fingerprint, ShieldCheck, XCircle } from 'lucide-react'
import { EligibilityTrace, PageHeader, StatusPill } from '../components/Domain'
import { Badge, Button, Card, CheckLine, DataRow, Mono } from '../components/ui'
import { useApp } from '../state/store'
import { eligibilityLabels } from '../lib/circuit'
import { verifyCommitment } from '../lib/crypto'
import { formatDate, formatMoney, shortHash } from '../lib/format'
import type { Bid, EligibilityInput, Tender } from '../types'

function deriveInputs(tender: Tender, bid: Bid): EligibilityInput[] {
  if (bid.eligibility) return bid.eligibility.inputs
  const values: Record<EligibilityInput['key'], boolean> = {
    A: tender.bidders.some((address) => address.toLowerCase() === bid.wallet.toLowerCase()),
    B: Boolean(bid.documentName && bid.documentHash),
    C: bid.committedAt <= tender.policy.commitDeadline,
    D: false,
  }
  const provenance: Record<EligibilityInput['key'], string> = {
    A: 'Supplier allowlist · invitation record',
    B: 'Document hash · local file digest',
    C: 'Commitment timestamp · policy deadline',
    D: 'Specification check · reviewer confirmation',
  }
  return (['A', 'B', 'C', 'D'] as const).map((key) => ({
    key,
    label: eligibilityLabels[key],
    value: values[key],
    provenance: provenance[key],
  }))
}

export function ReviewQueue() {
  const { id } = useParams()
  const { state, attestEligibility, setRole } = useApp()
  const tender = state.tenders.find((item) => item.id === id)
  const bids = state.bids.filter((bid) => bid.tenderId === id && bid.status === 'revealed')
  const [drafts, setDrafts] = useState<Record<string, EligibilityInput[]>>(() =>
    Object.fromEntries(bids.map((bid) => [bid.id, deriveInputs(tender ?? state.tenders[0], bid)])),
  )
  const [pending, setPending] = useState<string | null>(null)

  if (!tender) {
    return <Card className="p-8"><h1 className="text-xl font-semibold">Tender not found</h1><p className="mt-2 text-sm text-muted">This reference is not in the workspace ledger.</p></Card>
  }

  if (state.role !== 'reviewer') {
    return (
      <>
        <PageHeader eyebrow={`Workspace / ${tender.reference}`} title="Independent reviewer wallet required" detail="Eligibility bits attest to evidence. They cannot be set by the buyer, bidders or approver." />
        <Card className="max-w-xl p-6">
          <p className="text-sm leading-6 text-muted">You are currently acting as {state.role}. Switch to the reviewer identity to continue.</p>
          <Button className="mt-5" onClick={() => setRole('reviewer')}>Switch to reviewer</Button>
        </Card>
      </>
    )
  }

  const toggleBit = (bidId: string, key: EligibilityInput['key']) => {
    setDrafts((current) => ({
      ...current,
      [bidId]: (current[bidId] ?? []).map((input) => input.key === key ? { ...input, value: !input.value } : input),
    }))
  }

  const attest = async (bidId: string) => {
    setPending(bidId)
    await attestEligibility(bidId, drafts[bidId] ?? [])
    setPending(null)
  }

  return (
    <>
      <PageHeader
        eyebrow={`Workspace / ${tender.reference}`}
        title="Evidence review desk"
        detail="Check the reveal against the sealed commitment, then attest four evidence bits. The six-NAND circuit outputs one bit: eligible or not."
        actions={<Link to={`/app/tenders/${tender.id}/award`}><Button size="sm">Continue to award <ArrowRight className="h-3.5 w-3.5" /></Button></Link>}
      />

      <div className="mb-6 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Tender</div><div className="mt-2 text-sm font-semibold">{tender.reference}</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Rule</div><div className="mt-2 text-sm font-semibold">lowest eligible quotation</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Revealed bids</div><div className="mt-2 text-sm font-semibold tabular">{bids.length}</div></div>
      </div>

      {bids.length === 0 ? (
        <Card className="p-10 text-center"><h2 className="text-lg font-semibold">No revealed bids yet</h2><p className="mt-2 text-sm text-muted">Suppliers must reveal their commitments before eligibility can be attested.</p></Card>
      ) : (
        <div className="space-y-7">
          {bids.map((bid, index) => {
            const hashValid = verifyCommitment(bid.commitment, {
              tenderId: tender.id,
              bidder: bid.wallet,
              priceKobo: bid.priceKobo,
              documentHash: bid.documentHash,
              salt: bid.salt,
            })
            const inputs = drafts[bid.id] ?? deriveInputs(tender, bid)
            const ones = inputs.filter((input) => input.value).length
            return (
              <Card key={bid.id}>
                <div className="flex flex-col gap-4 border-b border-line px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[10px] text-muted">{String(index + 1).padStart(2, '0')}</span>
                      <h2 className="text-lg font-semibold tracking-[-0.04em]">{bid.supplierName}</h2>
                      <StatusPill status={bid.status} />
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-muted">{shortHash(bid.wallet, 12, 8)} · revealed {formatDate(bid.revealedAt ?? bid.committedAt)}</div>
                  </div>
                  <div className="text-left lg:text-right">
                    <div className="text-2xl font-semibold tracking-[-0.05em] tabular">{formatMoney(bid.priceKobo)}</div>
                    <div className="mt-1 flex items-center gap-1.5 font-mono text-[10px] text-muted lg:justify-end">
                      {hashValid ? <CheckCircle2 className="h-3 w-3 text-mint-deep" /> : <XCircle className="h-3 w-3 text-clay" />}
                      {hashValid ? 'commitment reproduced' : 'commitment mismatch'}
                    </div>
                  </div>
                </div>

                <div className="grid gap-0 lg:grid-cols-[1fr_0.85fr]">
                  <div className="border-b border-line px-6 py-5 lg:border-b-0 lg:border-r">
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Evidence bits</div>
                      <Badge tone={ones === 4 ? 'verified' : 'warning'}>{ones} / 4 true</Badge>
                    </div>
                    <div className="mt-4 border border-line bg-paper px-4">
                      {inputs.map((input) => (
                        <CheckLine key={input.key} checked={input.value} onChange={() => toggleBit(bid.id, input.key)}>
                          <span className="font-mono text-[10px] text-muted">{input.key}</span>
                          <span className="ml-2">{input.label}</span>
                          <span className="mt-0.5 block text-[11px] text-muted">{input.provenance}</span>
                        </CheckLine>
                      ))}
                    </div>
                    <div className="mt-5 border border-line bg-surface px-5 py-2">
                      <DataRow label="Document hash" value={<Mono>{shortHash(bid.documentHash, 12, 8)}</Mono>} />
                      <DataRow label="Salt" value={<Mono>{shortHash(bid.salt, 12, 8)}</Mono>} />
                    </div>
                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Button size="sm" onClick={() => attest(bid.id)} disabled={pending === bid.id}><ShieldCheck className="h-3.5 w-3.5" /> {pending === bid.id ? 'Attesting…' : 'Attest eligibility'}</Button>
                      <Link to={`/app/tenders/${tender.id}/submit`} className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted hover:text-ink">view bid receipt →</Link>
                    </div>
                  </div>

                  <div className="bg-paper/50 p-6">
                    {bid.eligibility ? (
                      <>
                        <div className="mb-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><Fingerprint className="h-3.5 w-3.5" /> Processor trace</div>
                        <EligibilityTrace result={bid.eligibility} />
                      </>
                    ) : (
                      <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                        <div className="flex h-10 w-10 items-center justify-center border border-line bg-surface text-muted"><Fingerprint className="h-4 w-4" /></div>
                        <p className="mt-4 text-sm font-semibold">No attestation yet</p>
                        <p className="mt-2 max-w-xs text-xs leading-5 text-muted">Attest the four bits to run the NAND circuit and produce an eligibility bit.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </>
  )
}
