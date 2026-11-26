import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FilePlus2,
  Info,
  LayoutDashboard,
  Menu,
  ScanSearch,
  Settings,
  Wallet,
  X,
} from 'lucide-react'
import { Badge, Button, Input, Select } from './ui'
import { Brand } from './Brand'
import { useApp } from '../state/store'
import { cx } from '../lib/cx'
import { formatRole, shortHash } from '../lib/format'
import type { Role, Toast } from '../types'

const navGroups = [
  {
    label: 'Workspace',
    items: [
      { to: '/app', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/app/tenders/new', label: 'New RFQ', icon: FilePlus2 },
      { to: '/verify', label: 'Receipt verifier', icon: ScanSearch },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    'group flex items-center gap-3 rounded-sharp px-3 py-2.5 text-sm transition-colors',
    isActive ? 'bg-ink text-paper' : 'text-muted hover:bg-ink/5 hover:text-ink',
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5200)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  const Icon = toast.tone === 'success' ? CheckCircle2 : toast.tone === 'error' ? AlertTriangle : Info
  return (
    <div className="animate-rise border border-line bg-surface p-4 shadow-ledger">
      <div className="flex items-start gap-3">
        <Icon className={cx('mt-0.5 h-4 w-4 shrink-0', toast.tone === 'success' ? 'text-mint-deep' : toast.tone === 'error' ? 'text-clay' : 'text-muted')} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">{toast.title}</div>
          {toast.detail ? <div className="mt-1 text-xs leading-5 text-muted">{toast.detail}</div> : null}
        </div>
        <button type="button" onClick={onDismiss} className="text-muted hover:text-ink" aria-label="Dismiss notification">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function WalletDialog({ onClose }: { onClose: () => void }) {
  const { state, walletAddress, connectWallet, useAddress, disconnectWallet } = useApp()
  const [address, setAddress] = useState(walletAddress ?? '')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const connect = async () => {
    setPending(true)
    const ok = await connectWallet()
    setPending(false)
    if (ok) onClose()
  }

  const applyAddress = () => {
    if (useAddress(address.trim())) onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onMouseDown={onClose}>
      <div className="w-full max-w-lg border border-line bg-surface shadow-lift" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-line px-6 py-5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Wallet</div>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">Connect identity</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Use an injected browser wallet or enter an address you control. The address signs nothing by default.</p>
          </div>
          <button type="button" onClick={onClose} className="text-muted hover:text-ink" aria-label="Close wallet dialog">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-6 py-5">
          <div className="border border-line bg-paper p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Connected address</div>
            <div className="mt-2 break-all font-mono text-xs">{walletAddress ?? 'Not connected'}</div>
          </div>
          <Button className="w-full" onClick={connect} disabled={pending || !window.ethereum}>
            <Wallet className="h-4 w-4" /> {pending ? 'Connecting…' : 'Connect injected wallet'}
          </Button>
          {!window.ethereum ? <p className="text-xs leading-5 text-muted">No injected wallet detected. You can still enter a valid address manually.</p> : null}
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Or use an address</div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="0x…" className="font-mono text-[11px]" />
              <Button variant="secondary" onClick={applyAddress}>Use address</Button>
            </div>
          </div>
          {walletAddress ? <Button variant="ghost" size="sm" onClick={disconnectWallet}>Disconnect</Button> : null}
        </div>
        <div className="border-t border-line bg-paper px-6 py-4 text-xs text-muted">
          Active role: <span className="font-semibold text-ink">{formatRole(state.role)}</span>
        </div>
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const { state, walletAddress, setRole, removeToast } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [walletOpen, setWalletOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const navigation = (
    <nav className="flex-1 space-y-8">
      {navGroups.map((group) => (
        <div key={group.label}>
          <div className="mb-3 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted/70">{group.label}</div>
          <div className="space-y-1">
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClass}>
                <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="px-2"><Brand /></div>
        <div className="mt-10 border-y border-line py-5">
          <div className="mb-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">Active role</div>
          <Select value={state.role} onChange={(event) => setRole(event.target.value as Role)} className="h-9 py-0 text-xs">
            {(['buyer', 'supplier', 'reviewer', 'approver', 'auditor'] as Role[]).map((role) => (
              <option key={role} value={role}>{formatRole(role)}</option>
            ))}
          </Select>
        </div>
        <div className="mt-6 flex flex-1 flex-col overflow-y-auto scroll-thin">{navigation}</div>
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className={cx('h-1.5 w-1.5', walletAddress ? 'bg-mint-deep' : 'bg-clay')} />
            {walletAddress ? 'Wallet connected' : 'Read-only mode'}
          </div>
          <Link className="mt-3 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted hover:text-ink" to="/">
            Back to site <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-shell items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-sharp border border-line bg-surface p-2 text-ink lg:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </button>
            <div className="lg:hidden"><Brand compact /></div>
            <div className="hidden flex-1 items-center gap-3 lg:flex">
              <Badge tone="outline">Chain 196 · X Layer</Badge>
            </div>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <Select value={state.role} onChange={(event) => setRole(event.target.value as Role)} className="h-9 w-32 py-0 text-xs">
                  {(['buyer', 'supplier', 'reviewer', 'approver', 'auditor'] as Role[]).map((role) => (
                    <option key={role} value={role}>{formatRole(role)}</option>
                  ))}
                </Select>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setWalletOpen(true)}>
                <Wallet className="h-3.5 w-3.5" />
                <span className="hidden font-mono text-[10px] sm:inline">{walletAddress ? shortHash(walletAddress, 6, 4) : 'Connect'}</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-10">{children}</main>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onMouseDown={() => setMobileOpen(false)}>
          <div className="flex h-full w-[280px] flex-col border-r border-line bg-surface px-4 py-6" onMouseDown={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between px-2">
              <Brand />
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" className="text-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-8 flex flex-1 flex-col overflow-y-auto">{navigation}</div>
            <Badge tone={walletAddress ? 'verified' : 'danger'} className="mt-4 self-start">{walletAddress ? 'Wallet connected' : 'Read-only'}</Badge>
          </div>
        </div>
      ) : null}

      {walletOpen ? <WalletDialog onClose={() => setWalletOpen(false)} /> : null}

      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(92vw,380px)] flex-col gap-2">
        {state.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </div>
  )
}
