import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Fingerprint, UserRound, Wallet } from 'lucide-react'
import { Badge, Button, Card, Field, Input, Steps } from '../components/ui'
import { PageHeader } from '../components/Domain'
import { useApp } from '../state/store'
import { formatRole, shortHash } from '../lib/format'
import type { Role } from '../types'

export function Onboarding() {
  const { state, walletAddress, setRole, connectWallet, useAddress, updateProfile } = useApp()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState(state.profile.name)
  const [organization, setOrganization] = useState(state.profile.organization)
  const [email, setEmail] = useState(state.profile.email)
  const [manualAddress, setManualAddress] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  const roles: Role[] = ['buyer', 'supplier', 'reviewer', 'approver', 'auditor']

  const connect = async () => {
    setPending(true)
    const ok = await connectWallet()
    setPending(false)
    if (!ok) {
      setError('The wallet request was declined or no injected provider was found. Enter an address manually instead.')
      return
    }
    setError('')
    setStep(2)
  }

  const addManualAddress = () => {
    if (!useAddress(manualAddress.trim())) {
      setError('Enter a valid 20-byte hexadecimal wallet address.')
      return
    }
    setError('')
    setStep(2)
  }

  const finish = () => {
    if (!name.trim() || !organization.trim() || !email.includes('@')) {
      setError('Add your name, organization and a valid email.')
      return
    }
    if (!walletAddress) {
      setError('Connect a wallet or enter an address before continuing.')
      return
    }
    updateProfile({ name, organization, email, wallet: walletAddress, onboarded: true })
    navigate('/app')
  }

  return (
    <>
      <PageHeader
        eyebrow="Setup / Workspace onboarding"
        title="Choose how you enter the record"
        detail="Your role determines what you can act on. Your address labels the local audit trail for every write you make."
      />

      <div className="mb-8 border-y border-line bg-surface px-5 py-4">
        <Steps steps={['Role', 'Wallet address', 'Profile']} current={step} />
      </div>

      <div className="mx-auto max-w-3xl">
        <Card className="p-6 lg:p-8">
          {step === 0 ? (
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em]">Select a role</h2>
              <p className="mt-1 text-sm text-muted">You can switch roles at any time from the workspace sidebar.</p>
              <div className="mt-7 grid gap-px border border-line bg-line sm:grid-cols-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRole(role)}
                    className={`flex items-start justify-between gap-3 bg-surface p-5 text-left transition-colors hover:bg-paper ${state.role === role ? 'bg-paper' : ''}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{formatRole(role)}</span>
                      <span className="mt-1 block text-xs text-muted">
                        {role === 'buyer' ? 'Publishes the RFQ and locks policy.' : role === 'supplier' ? 'Seals and reveals quotations.' : role === 'reviewer' ? 'Attests eligibility bits.' : role === 'approver' ? 'Finalizes compliant awards.' : 'Checks redacted receipts.'}
                      </span>
                    </span>
                    {state.role === role ? <Check className="h-4 w-4 text-mint-deep" strokeWidth={3} /> : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 1 ? (
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em]">Connect a wallet address</h2>
              <p className="mt-1 text-sm text-muted">Use an injected EIP-1193 wallet, or enter a valid address for read-first setup.</p>
              <div className="mt-7">
                <Button onClick={connect} disabled={pending}><Wallet className="h-4 w-4" /> {pending ? 'Connecting…' : 'Connect injected wallet'}</Button>
              </div>
              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-line" />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">or use an address</span>
                <span className="h-px flex-1 bg-line" />
              </div>
              <Field label="Wallet address" hint="The address is stored locally and used as the audit actor.">
                <Input value={manualAddress} onChange={(event) => setManualAddress(event.target.value)} className="font-mono text-[11px]" placeholder="0x0000000000000000000000000000000000000000" />
              </Field>
              <div className="mt-4"><Button variant="secondary" onClick={addManualAddress} disabled={!manualAddress.trim()}>Use this address</Button></div>
              {walletAddress ? (
                <div className="mt-6 flex flex-wrap items-center gap-3 border border-mint-deep/30 bg-mint/10 p-4">
                  <Badge tone="verified">active address</Badge>
                  <span className="break-all font-mono text-[11px] text-ink">{shortHash(walletAddress, 14, 8)}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.04em]">Operator profile</h2>
              <p className="mt-1 text-sm text-muted">Stored only in this browser. It labels the local audit trail.</p>
              <div className="mt-7 grid gap-6 sm:grid-cols-2">
                <Field label="Full name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
                <Field label="Organization"><Input value={organization} onChange={(event) => setOrganization(event.target.value)} /></Field>
              </div>
              <div className="mt-6"><Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field></div>
              <div className="mt-6 flex items-center gap-3 border border-mint-deep/30 bg-mint/10 p-4">
                <Fingerprint className="h-4 w-4 text-mint-deep" />
                <Badge tone="verified">address active</Badge>
                <span className="font-mono text-[10px] text-muted">{walletAddress ? shortHash(walletAddress, 12, 8) : '—'}</span>
              </div>
            </div>
          ) : null}

          {error ? <div className="mt-5 border-l-2 border-clay bg-clay/5 px-4 py-3 text-sm text-clay">{error}</div> : null}

          <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ArrowLeft className="h-3.5 w-3.5" /> Back</Button>
            {step === 0 ? <Button onClick={() => setStep(1)}>Continue <ArrowRight className="h-4 w-4" /></Button> : null}
            {step === 1 ? <Button onClick={() => { if (walletAddress) setStep(2); else setError('Connect or enter an address to continue.') }}>Continue <UserRound className="h-4 w-4" /></Button> : null}
            {step === 2 ? <Button onClick={finish}>Enter workspace <ArrowRight className="h-4 w-4" /></Button> : null}
          </div>
        </Card>
      </div>
    </>
  )
}
