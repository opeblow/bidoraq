import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardPaste, Download, FileUp, Fingerprint, XCircle } from 'lucide-react'
import { PageHeader } from '../components/Domain'
import { Badge, Button, Card, DataRow, Field, Input, Mono, Textarea } from '../components/ui'
import { useApp } from '../state/store'
import { buildReceipt, downloadJson, parseReceipt, verifyReceipt, type VerificationCheck } from '../lib/receipt'
import { formatMoney, shortHash } from '../lib/format'

export function Verify() {
  const { state } = useApp()
  const award = state.awards[0]
  const tender = state.tenders.find((item) => item.id === award?.tenderId)
  const winningBid = state.bids.find((item) => item.id === award?.winningBidId)

  const latestReceipt = useMemo(() => {
    if (!award || !tender || !winningBid) return null
    try {
      return buildReceipt(tender, award, state.bids)
    } catch {
      return null
    }
  }, [award, tender, winningBid, state.bids])

  const [receiptText, setReceiptText] = useState(() => (latestReceipt ? JSON.stringify(latestReceipt, null, 2) : ''))
  const [priceKobo, setPriceKobo] = useState(() => winningBid?.priceKobo ?? '')
  const [documentHash, setDocumentHash] = useState(() => winningBid?.documentHash ?? '')
  const [salt, setSalt] = useState(() => winningBid?.salt ?? '')
  const [checks, setChecks] = useState<VerificationCheck[]>([])
  const [error, setError] = useState('')

  const loadLatest = () => {
    if (!latestReceipt) return
    setReceiptText(JSON.stringify(latestReceipt, null, 2))
    setPriceKobo(latestReceipt.priceKobo)
    setDocumentHash(winningBid?.documentHash ?? '')
    setSalt(winningBid?.salt ?? '')
    setChecks([])
    setError('')
  }

  const onFile = async (file?: File) => {
    if (!file) return
    const text = await file.text()
    setReceiptText(text)
    setChecks([])
    setError('')
  }

  const verify = () => {
    try {
      const receipt = parseReceipt(receiptText)
      setChecks(verifyReceipt(receipt, { priceKobo, documentHash, salt }))
      setError('')
    } catch (caught) {
      setChecks([])
      setError(caught instanceof Error ? caught.message : 'Receipt could not be parsed.')
    }
  }

  const download = () => {
    try {
      const receipt = parseReceipt(receiptText)
      downloadJson(receipt, `bidoraq-receipt-${receipt.tenderId}.json`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Receipt could not be parsed.')
    }
  }

  const allOk = checks.length === 3 && checks.every((check) => check.ok)

  return (
    <>
      <PageHeader
        eyebrow="Public / Receipt verifier"
        title="Verify without opening the bids"
        detail="Load a published receipt, supply the revealed fields, and recompute the three checks that make the award defensible."
        actions={<Link to="/app"><Button variant="secondary" size="sm">Back to workspace <ArrowRight className="h-3.5 w-3.5" /></Button></Link>}
      />

      <div className="grid gap-7 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em]">Receipt JSON</h2>
                <p className="mt-1 text-sm text-muted">Supplier names and document contents are omitted. Wallet addresses, hashes and the locked policy remain.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={loadLatest} disabled={!latestReceipt}><ClipboardPaste className="h-3.5 w-3.5" /> Load latest award</Button>
                <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-sharp border border-line bg-surface px-3 text-xs font-semibold hover:border-ink">
                  <FileUp className="h-3.5 w-3.5" /> Upload
                  <input type="file" accept="application/json" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
                </label>
                <Button size="sm" variant="ghost" onClick={download} disabled={!receiptText}><Download className="h-3.5 w-3.5" /> Download</Button>
              </div>
            </div>
            <div className="mt-5">
              <Field label="Published receipt"><Textarea value={receiptText} onChange={(event) => setReceiptText(event.target.value)} className="min-h-[300px] font-mono text-[11px] leading-5" /></Field>
            </div>
            {error ? <div className="mt-4 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{error}</div> : null}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><Fingerprint className="h-3.5 w-3.5" /> Revealed fields</div>
            <p className="mt-2 text-sm text-muted">These values are prefilled from the winning bid when a local receipt is loaded. Edit any field to test the hash.</p>
            <div className="mt-5 space-y-5">
              <Field label="Price (kobo)"><Input value={priceKobo} onChange={(event) => setPriceKobo(event.target.value)} className="font-mono text-xs" /></Field>
              <Field label="Document hash"><Input value={documentHash} onChange={(event) => setDocumentHash(event.target.value)} className="font-mono text-[11px]" /></Field>
              <Field label="Salt"><Input value={salt} onChange={(event) => setSalt(event.target.value)} className="font-mono text-[11px]" /></Field>
            </div>
            <div className="mt-6"><Button onClick={verify} disabled={!receiptText}><Fingerprint className="h-4 w-4" /> Run verification</Button></div>
          </Card>
        </div>

        <aside className="space-y-5">
          <div className={`border p-6 ${allOk ? 'border-mint-deep bg-mint/10' : checks.length > 0 ? 'border-clay/40 bg-clay/5' : 'border-ink bg-ink text-paper'}`}>
            <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${checks.length > 0 ? allOk ? 'text-mint-deep' : 'text-clay' : 'text-mint'}`}>
              {checks.length === 0 ? 'Verification output' : allOk ? 'receipt valid' : 'receipt invalid'}
            </div>
            <div className="mt-5 text-3xl font-semibold tracking-[-0.06em]">
              {checks.length === 0 ? '—' : `${checks.filter((check) => check.ok).length} / 3`}
            </div>
            <p className={`mt-2 text-sm leading-6 ${checks.length > 0 ? 'text-muted' : 'text-paper/65'}`}>
              {checks.length === 0 ? 'Run the verifier to recompute policy, commitment and rule compliance.' : allOk ? 'All checks pass. The receipt can be published without exposing confidential bid contents.' : 'At least one check failed. Do not treat this receipt as evidence.'}
            </p>
          </div>

          <div className="border border-line bg-surface">
            {checks.length === 0 ? (
              <div className="p-6 text-sm text-muted">No checks have been run yet.</div>
            ) : (
              checks.map((check) => (
                <div key={check.label} className="flex items-start gap-4 border-b border-line/70 p-5 last:border-b-0">
                  {check.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-mint-deep" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-clay" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2"><span className="text-sm font-semibold">{check.label}</span><Badge tone={check.ok ? 'verified' : 'danger'}>{check.ok ? 'pass' : 'fail'}</Badge></div>
                    <p className="mt-1 text-xs leading-5 text-muted">{check.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {latestReceipt ? (
            <div className="border border-line bg-paper p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Latest local award</div>
              <div className="mt-4">
                <DataRow label="Tender" value={latestReceipt.tenderId} />
                <DataRow label="Rule" value={latestReceipt.policy.ruleVersion} />
                <DataRow label="Price" value={formatMoney(latestReceipt.priceKobo)} />
                <DataRow label="Commitment" value={<Mono>{shortHash(winningBid?.commitment ?? latestReceipt.ranked.find((bid) => bid.id === latestReceipt.winningBidId)?.commitment ?? '', 10, 6)}</Mono>} />
                <DataRow label="Transaction" value={<Mono>{shortHash(latestReceipt.transactionHash, 10, 6)}</Mono>} />
              </div>
            </div>
          ) : (
            <div className="border border-line bg-paper p-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Latest local award</div>
              <p className="mt-4 text-sm leading-6 text-muted">No finalized award exists in this workspace. Upload a published receipt to verify it.</p>
            </div>
          )}
        </aside>
      </div>
    </>
  )
}
