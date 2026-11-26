import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Check,
  CircleSlash,
  Clock3,
  FileCheck2,
  Fingerprint,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react'
import { Brand } from '../components/Brand'
import { ChainStatus } from '../components/ChainStatus'
import { Badge, Button, Mono } from '../components/ui'
import { useApp } from '../state/store'
import { formatMoney, shortHash } from '../lib/format'

const flow = [
  {
    number: '01',
    title: 'Lock the rules',
    copy: 'Currency, deadlines, eligibility inputs and the award rule are hashed before a supplier sees the tender.',
    meta: 'keccak(policy)',
  },
  {
    number: '02',
    title: 'Commit quietly',
    copy: 'Suppliers submit price and document hashes behind a commitment. No one can reshape a bid after seeing others.',
    meta: 'keccak(price · doc · salt)',
  },
  {
    number: '03',
    title: 'Reveal and attest',
    copy: 'At reveal, the commitment is checked. A reviewer records four evidence bits through a six-NAND circuit.',
    meta: 'A ∧ B ∧ C ∧ D',
  },
  {
    number: '04',
    title: 'Publish the proof',
    copy: 'The approver can only finalize the lowest eligible bid. The public receipt hides identities but keeps hashes.',
    meta: 'redacted receipt',
  },
]

export function Landing() {
  const { state } = useApp()
  const latestTender = state.tenders[0]
  const award = state.awards[0]
  const awardBid = state.bids.find((bid) => bid.id === award?.winningBidId)
  const bids = state.bids.filter((bid) => bid.tenderId === latestTender?.id)

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-18 max-w-shell items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#method" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">Method</a>
            <a href="#scenarios" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">Guards</a>
            <Link to="/verify" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">Verify</Link>
            <Link to="/pricing" className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-ink">Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/verify"><Button size="sm" variant="ghost" className="hidden sm:inline-flex">Inspect receipt</Button></Link>
            <Link to="/app"><Button size="sm">Open workspace <ArrowRight className="h-3.5 w-3.5" /></Button></Link>
          </div>
        </div>
      </header>

      <main>
        <section className="grid-paper relative overflow-hidden border-b border-line">
          <div className="mx-auto grid max-w-shell items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-24">
            <div className="relative z-10">
              <Badge tone="outline" className="mb-7"><span className="h-1.5 w-1.5 bg-mint-deep" /> Procurement evidence layer · X Layer</Badge>
              <h1 className="text-balance text-[clamp(3rem,7vw,6.4rem)] font-semibold leading-[0.92] tracking-[-0.075em]">
                Procurement that <span className="relative whitespace-nowrap">proves itself<span className="absolute -bottom-2 left-0 h-[3px] w-full bg-mint" /></span>.
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-muted sm:text-lg">
                Bidoraq gives procurement teams one defensible record: locked rules, sealed quotations, reviewer attestations and an award that can be checked without exposing confidential bids.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link to="/app"><Button size="lg">Open workspace <ArrowRight className="h-4 w-4" /></Button></Link>
                <a href="#method"><Button size="lg" variant="secondary"><ArrowDown className="h-4 w-4" /> See how it works</Button></a>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-4 border-t border-line pt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                <span>Local-first data</span>
                <span>Verifiable hashes</span>
                <span>No custody of funds</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-6 -top-6 hidden h-24 w-24 border-l border-t border-ink/15 lg:block" />
              <div className="relative border border-ink bg-surface shadow-lift">
                <div className="flex items-center justify-between border-b border-line bg-ink px-5 py-4 text-paper">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60">Decision record</div>
                    <div className="mt-1 text-sm font-semibold">{latestTender?.reference ?? 'No active tender'}</div>
                  </div>
                  <Badge tone={latestTender ? 'verified' : 'outline'}>{latestTender?.status ?? 'empty ledger'}</Badge>
                </div>
                {latestTender ? (
                  <>
                    <div className="divide-y divide-line">
                      {bids.map((bid) => {
                        const eligible = bid.eligibility?.result
                        return (
                          <div key={bid.id} className="grid grid-cols-[1fr_auto] gap-4 px-5 py-4">
                            <div>
                              <div className="text-sm font-semibold">{bid.supplierName}</div>
                              <div className="mt-1 font-mono text-[10px] text-muted">{shortHash(bid.commitment, 12, 6)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold tabular">{formatMoney(bid.priceKobo)}</div>
                              <div className="mt-1 flex items-center justify-end gap-1.5 font-mono text-[10px] text-muted">
                                {eligible ? <Check className="h-3 w-3 text-mint-deep" /> : eligible === false ? <X className="h-3 w-3 text-clay" /> : <Clock3 className="h-3 w-3" />}
                                {eligible === undefined ? 'pending' : eligible ? 'eligible' : 'ineligible'}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="border-t border-ink bg-paper px-5 py-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Locked rule</div>
                        <div className="text-right text-sm font-semibold">lowest eligible quotation</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 border-l-2 border-mint-deep bg-mint/15 px-3 py-2.5">
                        <BadgeCheck className="h-4 w-4 text-mint-deep" />
                        <span className="text-xs">{bids.length} commitment{bids.length === 1 ? '' : 's'} recorded against this policy.</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between border-t border-line px-5 py-4 font-mono text-[10px] text-muted">
                      <span className="flex items-center gap-2"><Fingerprint className="h-3.5 w-3.5" /> policy {shortHash(latestTender.policyHash, 9, 5)}</span>
                      <Link to={`/app/tenders/${latestTender.id}`} className="inline-flex items-center gap-1 text-ink hover:underline">open <ArrowUpRight className="h-3 w-3" /></Link>
                    </div>
                  </>
                ) : (
                  <div className="px-6 py-14 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center border border-line bg-paper text-muted"><FileCheck2 className="h-5 w-5" /></div>
                    <h2 className="mt-5 text-lg font-semibold tracking-tight">The ledger is empty</h2>
                    <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted">Publish your first RFQ to create a policy hash and start the evidence trail.</p>
                    <Link to="/app/tenders/new" className="mt-6 inline-block"><Button size="sm">Create an RFQ</Button></Link>
                  </div>
                )}
              </div>
              <div className="absolute -bottom-5 -right-3 hidden border border-line bg-ink px-4 py-3 text-paper sm:block lg:-right-6">
                <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/60">verifier output</div>
                <div className="mt-1 font-mono text-xs text-mint">{award ? 'receipt available' : 'awaiting first award'}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-shell gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.7fr_1.3fr] lg:px-8 lg:py-20">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">01 / The problem</div>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-4xl">A tender result is only as good as its evidence.</h2>
            </div>
            <div className="grid gap-px border border-line bg-line md:grid-cols-3">
              {[
                { icon: Clock3, title: 'Late bids slip in', copy: 'A timestamp edited after the fact turns a closed process into an argument.' },
                { icon: FileCheck2, title: 'Documents change', copy: 'A quotation reviewed in private can differ from the one submitted.' },
                { icon: CircleSlash, title: 'Rules bend quietly', copy: 'The lowest eligible bid loses, and nobody can prove the override happened.' },
              ].map((item) => (
                <div key={item.title} className="bg-surface p-6">
                  <item.icon className="h-5 w-5 text-clay" strokeWidth={1.5} />
                  <h3 className="mt-6 text-base font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="method" className="border-b border-line">
          <div className="mx-auto max-w-shell px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="flex flex-col gap-5 border-b border-line pb-8 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">02 / The method</div>
                <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-4xl">Four steps. One chain of custody.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-muted">Every state change writes a hash-backed record derived from the operator's own inputs and deadlines.</p>
            </div>
            <div className="grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
              {flow.map((step) => (
                <div key={step.number} className="group flex min-h-[280px] flex-col justify-between bg-paper p-6 transition-colors hover:bg-surface">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.16em] text-muted">{step.number}</div>
                    <h3 className="mt-8 text-xl font-semibold tracking-[-0.04em]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-muted">{step.copy}</p>
                  </div>
                  <div className="mt-8 border-t border-line pt-4 font-mono text-[10px] text-mint-deep">{step.meta}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="scenarios" className="border-b border-line bg-ink text-paper">
          <div className="mx-auto grid max-w-shell gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-24">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/50">03 / Guardrails</div>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-4xl">Designed to fail loudly.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-paper/65">The workflow compares each action against the locked policy. A late commitment, a changed reveal or a non-compliant award is refused by the same rules every time.</p>
              <Link to="/settings" className="mt-8 inline-flex items-center gap-2 border-b border-mint pb-1 font-mono text-[11px] uppercase tracking-[0.14em] text-mint">
                Review workspace settings <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="divide-y divide-paper/15 border-y border-paper/15">
              {[
                { label: 'Late bid', icon: Clock3, result: 'rejected', detail: 'Commitment window closes at the deadline locked in the policy hash.' },
                { label: 'Edited quotation', icon: ScanLine, result: 'verification failed', detail: 'Reveal hash differs from the sealed commitment.' },
                { label: 'Non-compliant award', icon: ShieldCheck, result: 'award refused', detail: 'Approver cannot select a cheaper ineligible bid.' },
              ].map((item) => (
                <div key={item.label} className="grid grid-cols-[auto_1fr_auto] items-start gap-5 py-6">
                  <item.icon className="mt-0.5 h-5 w-5 text-mint" strokeWidth={1.5} />
                  <div>
                    <div className="text-base font-semibold">{item.label}</div>
                    <div className="mt-1 text-sm text-paper/60">{item.detail}</div>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-clay">{item.result}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-surface">
          <div className="mx-auto grid max-w-shell gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8 lg:py-20">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">04 / Public receipt</div>
              <h2 className="mt-4 max-w-2xl text-balance text-3xl font-semibold leading-[1.08] tracking-[-0.055em] md:text-4xl">Enough proof to audit. Not enough to leak.</h2>
              <div className="mt-8 max-w-xl space-y-px border border-line bg-line">
                {[
                  ['Supplier name', 'omitted'],
                  ['Document contents', 'omitted'],
                  ['Price', award && awardBid ? formatMoney(award.priceKobo) : '—'],
                  ['Policy hash', award ? shortHash(award.policyHash, 12, 8) : '—'],
                  ['Commitment', award ? shortHash(award.commitment, 12, 8) : '—'],
                  ['Award local reference', award ? shortHash(award.localReference, 12, 8) : '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 bg-surface px-5 py-3">
                    <span className="text-xs uppercase tracking-[0.1em] text-muted">{label}</span>
                    <Mono className="text-ink">{value}</Mono>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col justify-between border-line p-6 lg:border-l lg:pl-10">
              <div>
                <LockKeyhole className="h-6 w-6 text-mint-deep" strokeWidth={1.4} />
                <p className="mt-6 text-base leading-7">A redacted receipt preserves the facts an auditor needs: what rule was locked, which hash won, and whether the approver stayed inside the rule.</p>
              </div>
              <Link to="/verify" className="mt-10 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:underline">
                Try the verifier <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-line bg-surface">
          <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <ChainStatus />
          </div>
        </section>

        <section>
          <div className="mx-auto flex max-w-shell flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-end md:justify-between lg:px-8 lg:py-20">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">Ready when you are</div>
              <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[0.98] tracking-[-0.065em] md:text-6xl">Move from tender argument to tender evidence.</h2>
            </div>
            <Link to="/app"><Button size="lg">Enter the workspace <ArrowRight className="h-4 w-4" /></Button></Link>
          </div>
          <footer className="border-t border-line">
            <div className="mx-auto flex max-w-shell flex-col gap-4 px-4 py-8 font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <span>Bidoraq · verifiable procurement</span>
              <span>Chain 196 · local-first records · no funds held</span>
            </div>
          </footer>
        </section>
      </main>
    </div>
  )
}
