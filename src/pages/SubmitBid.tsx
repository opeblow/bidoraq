import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Check, Clock3, FileUp, Fingerprint, RefreshCw, Wallet } from 'lucide-react'
import { PageHeader } from '../components/Domain'
import { Badge, Button, Card, DataRow, Field, Input, Mono } from '../components/ui'
import { useApp } from '../state/store'
import { computeCommitment, hashDocument, hashText, randomSalt } from '../lib/crypto'
import { formatCountdown, formatDate, formatMoney, parseMoneyToKobo, shortHash } from '../lib/format'

export function SubmitBid() {
  const { id } = useParams()
  const { state, walletAddress, submitBid, revealBid, setRole } = useApp()
  const tender = state.tenders.find((item) => item.id === id)
  const myBid = state.bids.find((bid) => bid.tenderId === id && bid.wallet.toLowerCase() === (walletAddress ?? '').toLowerCase())

  const [price, setPrice] = useState('')
  const [documentName, setDocumentName] = useState('')
  const [documentHash, setDocumentHash] = useState('')
  const [salt, setSalt] = useState<string>(() => randomSalt())
  const [revealPrice, setRevealPrice] = useState(() => myBid ? String(Number(BigInt(myBid.priceKobo)) / 100) : '')
  const [revealDocumentHash, setRevealDocumentHash] = useState(() => myBid?.documentHash ?? '')
  const [revealSalt, setRevealSalt] = useState(() => myBid?.salt ?? '')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const priceKobo = parseMoneyToKobo(price)
  const effectiveDocumentHash = documentHash || (documentName ? hashText(documentName) : '')
  const commitment = useMemo(() => {
    if (!tender || !walletAddress || !priceKobo || !effectiveDocumentHash) return ''
    return computeCommitment({
      tenderId: tender.id,
      bidder: walletAddress,
      priceKobo,
      documentHash: effectiveDocumentHash,
      salt,
    })
  }, [tender, walletAddress, priceKobo, effectiveDocumentHash, salt])

  if (!tender) {
    return <Card className="p-8"><h1 className="text-xl font-semibold">Tender not found</h1><p className="mt-2 text-sm text-muted">This reference is not in the workspace ledger.</p></Card>
  }

  if (state.role !== 'supplier') {
    return (
      <>
        <PageHeader eyebrow={`Workspace / ${tender.reference}`} title="Supplier role required" detail="Only an invited supplier can seal or reveal a quotation on this tender." />
        <Card className="max-w-xl p-6">
          <p className="text-sm leading-6 text-muted">You are currently acting as {state.role}. Switch to the supplier role to continue.</p>
          <Button className="mt-5" onClick={() => setRole('supplier')}>Switch to supplier</Button>
        </Card>
      </>
    )
  }

  if (!walletAddress) {
    return (
      <>
        <PageHeader eyebrow={`Workspace / ${tender.reference}`} title="Connect a bidder wallet" detail="The connected address becomes the bidder identity in the commitment hash." />
        <Card className="max-w-xl p-6">
          <Wallet className="h-5 w-5 text-muted" />
          <p className="mt-4 text-sm leading-6 text-muted">Use the wallet button in the top bar to connect an injected wallet or enter a valid address.</p>
        </Card>
      </>
    )
  }

  const invited = tender.bidders.length === 0 || tender.bidders.some((address) => address.toLowerCase() === walletAddress.toLowerCase())
  const isLate = tender.status !== 'open' || Date.now() > tender.policy.commitDeadline
  const isRevealClosed = Date.now() > tender.policy.revealDeadline

  const onFile = async (file?: File) => {
    if (!file) return
    setDocumentName(file.name)
    setDocumentHash(await hashDocument(file))
    setMessage('Document hashed locally. File contents are not stored in the ledger.')
  }

  const seal = async () => {
    if (!priceKobo || !effectiveDocumentHash) {
      setMessage('Add a price and a document before sealing the commitment.')
      return
    }
    setBusy(true)
    const result = await submitBid({ tenderId: tender.id, priceKobo, documentHash: effectiveDocumentHash, documentName: documentName || 'supplier-quotation.pdf', salt })
    setBusy(false)
    if (result.ok) {
      setMessage('')
      setRevealPrice(price)
      setRevealDocumentHash(effectiveDocumentHash)
      setRevealSalt(salt)
    } else {
      setMessage(result.reason ?? 'Commitment could not be recorded.')
    }
  }

  const reveal = async () => {
    if (!myBid) return
    const revealKobo = parseMoneyToKobo(revealPrice)
    if (!revealKobo) {
      setMessage('Enter a valid reveal price.')
      return
    }
    setBusy(true)
    const result = await revealBid({ bidId: myBid.id, priceKobo: revealKobo, documentHash: revealDocumentHash, salt: revealSalt })
    setBusy(false)
    setMessage(result.ok ? '' : result.reason ?? 'Reveal failed.')
  }

  return (
    <>
      <PageHeader
        eyebrow={`Workspace / ${tender.reference}`}
        title={myBid ? 'Reveal your commitment' : 'Seal a quotation'}
        detail={tender.title}
        actions={<Link to={`/app/tenders/${tender.id}`}><Button variant="secondary" size="sm"><ArrowLeft className="h-3.5 w-3.5" /> Tender detail</Button></Link>}
      />

      <div className="mb-6 grid gap-px border border-line bg-line sm:grid-cols-3">
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Buyer</div><div className="mt-2 text-sm font-semibold">{tender.organization}</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Commit closes</div><div className="mt-2 text-sm font-semibold tabular">{formatCountdown(tender.policy.commitDeadline, Date.now())}</div><div className="mt-1 font-mono text-[10px] text-muted">{formatDate(tender.policy.commitDeadline)}</div></div>
        <div className="bg-surface p-4"><div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Your wallet</div><div className="mt-2 font-mono text-xs">{shortHash(walletAddress, 12, 8)}</div></div>
      </div>

      {!invited ? (
        <Card className="border-clay/40"><div className="p-6 text-sm leading-6 text-clay">This wallet is not on the invited supplier list for the tender.</div></Card>
      ) : null}

      {invited && isLate && !myBid ? (
        <Card className="border-clay/40">
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center border border-clay/40 bg-clay/10 text-clay"><Clock3 className="h-5 w-5" /></div>
              <div>
                <Badge tone="danger">late bid rejected</Badge>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.04em]">The commitment window is closed.</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">The deadline was locked in the policy hash before suppliers were invited. A late commitment cannot be written into this tender without invalidating the receipt.</p>
              </div>
            </div>
            <div className="shrink-0 border-line pl-0 lg:border-l lg:pl-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">policy hash</div>
              <Mono className="mt-2 block max-w-[240px] text-ink">{shortHash(tender.policyHash, 16, 12)}</Mono>
            </div>
          </div>
        </Card>
      ) : null}

      {invited && !isLate && !myBid ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <Card className="p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em]">Seal the quotation</h2>
            <p className="mt-1 text-sm text-muted">Price and document hash are combined with a one-time salt. Keep the salt for the reveal step.</p>
            <div className="mt-7 space-y-6">
              <Field label="Quotation amount (NGN)" hint={`Stored as ${priceKobo ?? '—'} kobo.`}>
                <Input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="10800000" inputMode="decimal" />
              </Field>
              <Field label="Quotation document" hint="A SHA-256 hash is computed in your browser.">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-sharp border border-line bg-surface px-3 text-sm hover:border-ink">
                    <FileUp className="h-4 w-4" /> Choose file
                    <input type="file" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
                  </label>
                  <span className="truncate font-mono text-[11px] text-muted">{documentName || 'no file selected'}</span>
                </div>
              </Field>
              <Field label="Reveal salt" hint="Required later to prove this exact commitment.">
                <div className="flex gap-2">
                  <Input value={salt} onChange={(event) => setSalt(event.target.value)} className="font-mono text-[11px]" />
                  <Button type="button" variant="secondary" size="md" onClick={() => setSalt(randomSalt())} aria-label="Generate new salt"><RefreshCw className="h-4 w-4" /></Button>
                </div>
              </Field>
            </div>
            {message ? <div className="mt-5 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{message}</div> : null}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">No transaction is broadcast</span>
              <Button onClick={seal} disabled={busy || !priceKobo || !effectiveDocumentHash}>{busy ? 'Sealing…' : 'Commit quotation'}</Button>
            </div>
          </Card>

          <aside className="space-y-5">
            <div className="border border-ink bg-ink p-5 text-paper">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-mint"><Fingerprint className="h-3.5 w-3.5" /> Commitment preview</div>
              <div className="mt-4 break-all font-mono text-xs leading-6 text-paper/80">{commitment || 'Enter a price and document to derive the hash.'}</div>
              <div className="mt-5 border-t border-paper/15 pt-4 font-mono text-[10px] text-paper/50">keccak(chain · verifier · rfq · bidder · price · doc · salt)</div>
            </div>
          </aside>
        </div>
      ) : null}

      {myBid ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <Card className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Your commitment</div>
                <div className="mt-2 text-xl font-semibold tracking-[-0.04em]">{myBid.id}</div>
              </div>
              <Badge tone={myBid.status === 'revealed' ? 'verified' : myBid.status === 'invalid' ? 'danger' : 'warning'}>{myBid.status}</Badge>
            </div>
            <div className="mt-5 border border-line bg-paper px-5 py-2">
              <DataRow label="Committed" value={formatDate(myBid.committedAt)} />
              <DataRow label="Sealed price" value={myBid.status === 'revealed' ? formatMoney(myBid.priceKobo) : 'Hidden until reveal'} />
              <DataRow label="Document" value={<Mono>{shortHash(myBid.documentHash, 10, 6)}</Mono>} />
              <DataRow label="Commitment" value={<Mono>{shortHash(myBid.commitment, 12, 8)}</Mono>} />
              <DataRow label="Local reference" value={<Mono>{shortHash(myBid.localReference, 10, 6)}</Mono>} />
            </div>

            {myBid.status !== 'revealed' ? (
              <div className="mt-7 border-t border-line pt-6">
                <h3 className="text-lg font-semibold tracking-[-0.03em]">Reveal and verify</h3>
                <p className="mt-1 text-sm text-muted">Use the exact price, document hash and salt from the commitment. Editing any field fails verification.</p>
                {isRevealClosed ? (
                  <div className="mt-5 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">The reveal window has closed. This commitment can no longer be verified.</div>
                ) : (
                  <div className="mt-5 space-y-5">
                    <Field label="Reveal price (NGN)"><Input value={revealPrice} onChange={(event) => setRevealPrice(event.target.value)} /></Field>
                    <Field label="Document hash"><Input value={revealDocumentHash} onChange={(event) => setRevealDocumentHash(event.target.value)} className="font-mono text-[11px]" /></Field>
                    <Field label="Salt"><Input value={revealSalt} onChange={(event) => setRevealSalt(event.target.value)} className="font-mono text-[11px]" /></Field>
                    <Button onClick={reveal} disabled={busy}>{busy ? 'Verifying…' : 'Verify reveal'}</Button>
                  </div>
                )}
                {message ? <div className="mt-5 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{message}</div> : null}
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 border border-mint-deep/30 bg-mint/10 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-mint-deep text-ink"><Check className="h-4 w-4" strokeWidth={3} /></div>
                <div>
                  <div className="text-sm font-semibold text-mint-deep">Commitment verified</div>
                  <p className="mt-1 text-xs leading-5 text-muted">The revealed fields reproduce the sealed hash. This bid is visible to the reviewer.</p>
                </div>
              </div>
            )}
          </Card>

          <aside className="space-y-5">
            <div className="border border-line bg-surface p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Guard status</div>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span>Commitment in window</span><Badge tone="verified">pass</Badge></div>
                <div className="flex items-center justify-between gap-3"><span>Hash reproduction</span><Badge tone={myBid.status === 'invalid' ? 'danger' : myBid.status === 'revealed' ? 'verified' : 'neutral'}>{myBid.status === 'invalid' ? 'fail' : myBid.status === 'revealed' ? 'pass' : 'pending'}</Badge></div>
                <div className="flex items-center justify-between gap-3"><span>Document contents</span><Badge tone="neutral">private</Badge></div>
              </div>
            </div>
            {myBid.revealError ? (
              <div className="flex items-start gap-3 border border-clay/40 bg-clay/5 p-4 text-clay"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><p className="text-xs leading-5">{myBid.revealError}</p></div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  )
}
