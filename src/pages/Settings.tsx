import { useState } from 'react'
import { CheckCircle2, Download, FileCheck2, Gavel, ScanSearch, Trash2, Wallet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/Domain'
import { Badge, Button, Card, DataRow, Field, Input, Select } from '../components/ui'
import { useApp } from '../state/store'
import { buildReceipt, downloadJson } from '../lib/receipt'
import { formatDate, shortHash } from '../lib/format'
import { STORAGE_KEY } from '../lib/workspace'
import type { Role } from '../types'

export function Settings() {
  const {
    state,
    walletAddress,
    setRole,
    connectWallet,
    useAddress,
    disconnectWallet,
    updateProfile,
    clearWorkspace,
    exportState,
  } = useApp()
  const [manualAddress, setManualAddress] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const latestAward = state.awards[0]
  const awardTender = state.tenders.find((tender) => tender.id === latestAward?.tenderId)

  const connect = async () => {
    setPending(true)
    const ok = await connectWallet()
    setPending(false)
    if (!ok) setError('No injected wallet responded. Enter a valid address manually instead.')
    else setError('')
  }

  const addAddress = () => {
    if (!useAddress(manualAddress.trim())) {
      setError('Enter a valid 20-byte hexadecimal wallet address.')
      return
    }
    setManualAddress('')
    setError('')
  }

  const exportLedger = () => {
    const blob = new Blob([exportState()], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'bidoraq-ledger.json'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportReceipt = () => {
    if (!latestAward || !awardTender) return
    const receipt = buildReceipt(awardTender, latestAward, state.bids)
    downloadJson(receipt, `bidoraq-receipt-${awardTender.reference}.json`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Workspace / Settings"
        title="Workspace controls"
        detail="Manage the local identity, export the evidence ledger, and publish a redacted receipt for the latest finalized award."
        actions={<Link to="/verify"><Button variant="secondary" size="sm"><ScanSearch className="h-3.5 w-3.5" /> Open verifier</Button></Link>}
      />

      <div className="grid gap-7 xl:grid-cols-[1fr_0.68fr]">
        <div className="space-y-7">
          <Card className="p-6">
            <h2 className="text-lg font-semibold tracking-[-0.04em]">Identity</h2>
            <p className="mt-1 text-sm text-muted">Role and address are written into every audit entry you create.</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <Field label="Active role">
                <Select value={state.role} onChange={(event) => setRole(event.target.value as Role)}>
                  {(['buyer', 'supplier', 'reviewer', 'approver', 'auditor'] as Role[]).map((role) => <option key={role} value={role}>{role}</option>)}
                </Select>
              </Field>
              <Field label="Operator name">
                <Input value={state.profile.name} onChange={(event) => updateProfile({ ...state.profile, name: event.target.value })} />
              </Field>
              <Field label="Organization">
                <Input value={state.profile.organization} onChange={(event) => updateProfile({ ...state.profile, organization: event.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" value={state.profile.email} onChange={(event) => updateProfile({ ...state.profile, email: event.target.value })} />
              </Field>
            </div>

            <div className="mt-7 border-t border-line pt-6">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Wallet address</div>
              {walletAddress ? (
                <div className="flex flex-col gap-4 border border-mint-deep/30 bg-mint/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Badge tone="verified">connected</Badge>
                    <div className="mt-2 break-all font-mono text-[11px]">{walletAddress}</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={disconnectWallet}>Disconnect</Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 border border-line bg-paper p-4 sm:flex-row">
                  <Button onClick={connect} disabled={pending}><Wallet className="h-4 w-4" /> {pending ? 'Connecting…' : 'Connect injected wallet'}</Button>
                  <div className="flex flex-1 gap-2">
                    <Input value={manualAddress} onChange={(event) => setManualAddress(event.target.value)} className="font-mono text-[11px]" placeholder="0x..." />
                    <Button variant="secondary" onClick={addAddress} disabled={!manualAddress.trim()}>Use</Button>
                  </div>
                </div>
              )}
              {error ? <div className="mt-3 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{error}</div> : null}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted"><CheckCircle2 className="h-3.5 w-3.5" /> Publication</div>
            <div className="mt-5 flex flex-col gap-5 border border-mint-deep/30 bg-mint/10 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-[-0.04em]">Redacted verification receipt</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Exports the locked policy, sealed commitments, eligibility outcomes and winning award without supplier names or document contents.</p>
              </div>
              <Button onClick={exportReceipt} disabled={!latestAward}><Download className="h-4 w-4" /> Export receipt</Button>
            </div>
          </Card>
        </div>

        <aside className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-semibold tracking-[-0.04em]">Ledger controls</h2>
            <div className="mt-5 border border-line bg-paper px-5 py-2">
              <DataRow label="Tenders" value={String(state.tenders.length)} />
              <DataRow label="Commitments" value={String(state.bids.length)} />
              <DataRow label="Awards" value={String(state.awards.length)} />
              <DataRow label="Audit entries" value={String(state.logs.length)} />
              <DataRow label="Latest award" value={latestAward ? formatDate(latestAward.approvedAt) : '—'} />
            </div>
            <div className="mt-6 flex flex-col gap-2">
              <Button variant="secondary" onClick={exportLedger}><Download className="h-3.5 w-3.5" /> Export ledger JSON</Button>
              <Button variant="danger" onClick={() => { if (window.confirm('Clear all local tenders, bids, awards and audit entries?')) clearWorkspace() }}>
                <Trash2 className="h-3.5 w-3.5" /> Clear workspace
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><Gavel className="h-3.5 w-3.5" /> Hash lock reference</div>
            <div className="mt-5 space-y-4">
              {state.tenders.slice(0, 3).map((tender) => (
                <div key={tender.id} className="border-b border-line/70 pb-4 last:border-b-0 last:pb-0">
                  <div className="text-sm font-semibold">{tender.reference}</div>
                  <div className="mt-1 break-all font-mono text-[10px] text-muted">{shortHash(tender.policyHash, 16, 10)}</div>
                </div>
              ))}
              {state.tenders.length === 0 ? <p className="text-sm text-muted">No policy hashes have been locked yet.</p> : null}
            </div>
          </Card>

          <div className="border border-line bg-paper p-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Storage key</div>
            <div className="mt-2 break-all font-mono text-[10px]">{STORAGE_KEY}</div>
            <div className="mt-4 flex items-start gap-2 border-t border-line pt-4 text-xs leading-5 text-muted">
              <FileCheck2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mint-deep" />
              Records stay in this browser until exported or cleared.
            </div>
          </div>
        </aside>
      </div>
    </>
  )
}
