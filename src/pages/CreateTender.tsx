import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, LockKeyhole, Wallet } from 'lucide-react'
import { isAddress } from 'viem'
import { PageHeader } from '../components/Domain'
import { Button, Card, CheckLine, DataRow, Field, Input, Steps, Textarea } from '../components/ui'
import { useApp } from '../state/store'
import { computePolicyHash } from '../lib/crypto'
import { formatDate, formatMoney, parseMoneyToKobo } from '../lib/format'
import type { Policy } from '../types'

const requiredDocumentOptions = [
  'Business registration',
  'Tax clearance',
  'Two-year warranty',
  'Delivery timeline',
  'Insurance certificate',
]

export function CreateTender() {
  const { state, now, createTender, setRole } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [budget, setBudget] = useState('')
  const [location, setLocation] = useState('Abuja, Nigeria')
  const [commitDeadline, setCommitDeadline] = useState(() => new Date(now + 24 * 3600000).toISOString().slice(0, 16))
  const [revealDeadline, setRevealDeadline] = useState(() => new Date(now + 48 * 3600000).toISOString().slice(0, 16))
  const [documents, setDocuments] = useState<string[]>(['Business registration', 'Delivery timeline'])
  const [bidderText, setBidderText] = useState('')
  const [error, setError] = useState('')

  const bidders = useMemo(
    () => bidderText.split(/[\n,]+/).map((value) => value.trim()).filter((value) => isAddress(value)),
    [bidderText],
  )

  const policy: Policy = useMemo(
    () => ({
      currency: 'NGN',
      commitDeadline: new Date(commitDeadline).getTime(),
      revealDeadline: new Date(revealDeadline).getTime(),
      requiredDocuments: documents,
      ruleVersion: 'lowest-eligible-v1',
      tieRule: 'earliest-commit',
    }),
    [commitDeadline, revealDeadline, documents],
  )

  const policyHash = useMemo(() => computePolicyHash('PREVIEW-RFQ', policy), [policy])
  const budgetKobo = parseMoneyToKobo(budget)

  const validateBrief = () => {
    if (!title.trim() || !itemName.trim() || !description.trim() || !budgetKobo || !location.trim()) {
      setError('Complete every field in the tender brief.')
      return false
    }
    if (!Number.isFinite(Number(quantity)) || Number(quantity) < 1) {
      setError('Quantity must be at least one.')
      return false
    }
    setError('')
    return true
  }

  const validateRules = () => {
    if (!Number.isFinite(policy.commitDeadline) || !Number.isFinite(policy.revealDeadline)) {
      setError('Set both deadlines.')
      return false
    }
    if (policy.commitDeadline <= Date.now()) {
      setError('The commitment deadline must be in the future.')
      return false
    }
    if (policy.revealDeadline <= policy.commitDeadline) {
      setError('The reveal deadline must be after the commitment deadline.')
      return false
    }
    if (documents.length === 0 || bidders.length === 0) {
      setError('Choose at least one required document and add at least one valid supplier address.')
      return false
    }
    setError('')
    return true
  }

  const publish = () => {
    if (!budgetKobo) return
    const id = createTender({
      title,
      description,
      itemName,
      quantity: Number(quantity),
      budgetKobo,
      location,
      commitDeadline: policy.commitDeadline,
      revealDeadline: policy.revealDeadline,
      requiredDocuments: documents,
      bidders,
    })
    if (id) navigate(`/app/tenders/${id}`)
  }

  if (state.role !== 'buyer') {
    return (
      <>
        <PageHeader eyebrow="Workspace / New RFQ" title="Buyer role required" detail="Only the procurement team can lock a tender policy and publish an RFQ." />
        <Card className="max-w-lg p-6">
          <p className="text-sm leading-6 text-muted">You are currently viewing the workspace as {state.role}. Switch to the buyer role to continue.</p>
          <Button className="mt-5" onClick={() => setRole('buyer')}>Switch to buyer</Button>
        </Card>
      </>
    )
  }

  if (!state.walletAddress) {
    return (
      <>
        <PageHeader eyebrow="Workspace / New RFQ" title="Connect a wallet to publish" detail="Publishing records the operator address in the audit trail." />
        <Card className="max-w-lg p-6">
          <Wallet className="h-5 w-5 text-muted" />
          <p className="mt-4 text-sm leading-6 text-muted">Use the wallet button in the top bar to connect an injected wallet or enter a valid address.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace / New RFQ"
        title="Publish a sealed RFQ"
        detail="Set the brief, then lock the rule that will decide the award. Once published, the policy hash cannot be changed."
        actions={<Button variant="secondary" size="sm" onClick={() => navigate('/app')}><ArrowLeft className="h-3.5 w-3.5" /> Back to ledger</Button>}
      />

      <div className="mb-8 border-y border-line bg-surface px-5 py-4">
        <Steps steps={['Tender brief', 'Locked policy', 'Review & publish']} current={step} />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_0.62fr]">
        <Card className="p-6 lg:p-8">
          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">What are we buying?</h2>
                <p className="mt-1 text-sm text-muted">Suppliers see this brief before committing. No confidential evaluation notes go here.</p>
              </div>
              <Field label="Tender title"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 100 laptops for regional learning centres" /></Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Item name"><Input value={itemName} onChange={(event) => setItemName(event.target.value)} placeholder="Business-class laptop" /></Field>
                <Field label="Quantity"><Input type="number" min="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Budget (NGN)" hint="Enter amount in naira; stored as kobo."><Input value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="125000000" /></Field>
                <Field label="Delivery location"><Input value={location} onChange={(event) => setLocation(event.target.value)} /></Field>
              </div>
              <Field label="Description"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Scope, delivery window, warranty and service expectations." /></Field>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-7">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">Lock the decision rules</h2>
                <p className="mt-1 text-sm text-muted">These values feed the policy hash. Changing them later would break the receipt.</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Commitment deadline"><Input type="datetime-local" value={commitDeadline} onChange={(event) => setCommitDeadline(event.target.value)} /></Field>
                <Field label="Reveal deadline"><Input type="datetime-local" value={revealDeadline} onChange={(event) => setRevealDeadline(event.target.value)} /></Field>
              </div>
              <div>
                <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Required documents</div>
                <div className="border border-line bg-paper px-4">
                  {requiredDocumentOptions.map((documentName) => (
                    <CheckLine
                      key={documentName}
                      checked={documents.includes(documentName)}
                      onChange={(checked) => setDocuments((current) => checked ? [...current, documentName] : current.filter((item) => item !== documentName))}
                    >
                      {documentName}
                    </CheckLine>
                  ))}
                </div>
              </div>
              <Field label="Invited supplier addresses" hint="One wallet address per line. Invalid addresses are ignored.">
                <Textarea value={bidderText} onChange={(event) => setBidderText(event.target.value)} className="min-h-32 font-mono text-[11px]" placeholder={'0x...\n0x...'} />
              </Field>
              <div className="font-mono text-[10px] text-muted">{bidders.length} valid address{bidders.length === 1 ? '' : 'es'} detected</div>
              <div className="border-l-2 border-mint-deep bg-mint/10 px-4 py-3 text-sm">
                <span className="font-semibold">Award rule is fixed:</span> lowest eligible quotation, tie broken by earliest commitment. Reviewers control the four eligibility bits; the approver cannot override the result.
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.04em]">Review the sealed record</h2>
                <p className="mt-1 text-sm text-muted">Publishing writes the policy hash and opens the commitment window.</p>
              </div>
              <div className="border border-line bg-paper px-5 py-2">
                <DataRow label="Title" value={title} />
                <DataRow label="Item" value={`${itemName} · ${quantity} units`} />
                <DataRow label="Budget" value={budgetKobo ? formatMoney(budgetKobo) : '—'} />
                <DataRow label="Location" value={location} />
                <DataRow label="Commit closes" value={formatDate(policy.commitDeadline)} />
                <DataRow label="Reveal closes" value={formatDate(policy.revealDeadline)} />
                <DataRow label="Documents" value={`${documents.length} required`} />
                <DataRow label="Invited suppliers" value={`${bidders.length} addresses`} />
                <DataRow label="Rule" value="lowest-eligible-v1" />
                <DataRow label="Tie rule" value="earliest-commit" />
              </div>
              <div className="flex items-start gap-3 border border-ink bg-ink px-5 py-4 text-paper">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-mint" />
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-paper/60">Policy hash preview</div>
                  <div className="mt-1 break-all font-mono text-xs text-mint">{policyHash}</div>
                </div>
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-6 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{error}</div> : null}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            {step < 2 ? (
              <Button onClick={() => { if (step === 0 ? validateBrief() : validateRules()) setStep((value) => value + 1) }}>Continue <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button onClick={publish}><Check className="h-4 w-4" /> Publish RFQ</Button>
            )}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Live policy preview</div>
            <div className="mt-4 space-y-3 font-mono text-[11px]">
              <div className="flex justify-between gap-4"><span className="text-muted">currency</span><span>NGN</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">commit</span><span>{formatDate(policy.commitDeadline)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">reveal</span><span>{formatDate(policy.revealDeadline)}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">rule</span><span>lowest-eligible-v1</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted">tie</span><span>earliest-commit</span></div>
            </div>
            <div className="mt-5 border-t border-line pt-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">hash</div>
              <div className="mt-2 break-all font-mono text-[10px] text-mint-deep">{policyHash}</div>
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
}
