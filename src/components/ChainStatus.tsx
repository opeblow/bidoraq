import { useEffect, useState } from 'react'
import { Activity, ExternalLink } from 'lucide-react'
import { Badge, DataRow, Mono } from './ui'
import { explorerAddress, verifyTapeOut, type TapeOutStatus } from '../lib/xlayer'
import { shortHash } from '../lib/format'

export function ChainStatus() {
  const [status, setStatus] = useState<TapeOutStatus | null>(null)

  useEffect(() => {
    let active = true
    verifyTapeOut().then((result) => {
      if (active) setStatus(result)
    })
    return () => {
      active = false
    }
  }, [])

  const tone = !status ? 'neutral' : !status.online ? 'danger' : status.tapedOut ? 'verified' : 'warning'

  return (
    <section className="border border-line bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
          <Activity className="h-3.5 w-3.5" /> X Layer · live chain status
        </div>
        <Badge tone={tone}>{!status ? 'checking' : status.tapedOut ? 'taped out' : status.online ? 'Tier C' : 'offline'}</Badge>
      </div>
      {status ? (
        <div className="mt-4 border border-line bg-paper px-4 py-2">
          <DataRow label="Chain" value={status.chainId ? `${status.chainId} (mainnet)` : 'unavailable'} />
          <DataRow label="Block" value={status.blockNumber ? `#${status.blockNumber.toString()}` : '—'} />
          <DataRow
            label="Processor"
            value={
              <a href={explorerAddress(status.processor)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline">
                <Mono>{shortHash(status.processor, 8, 6)}</Mono> <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
          <DataRow label="Code" value={status.processorHasCode ? 'present' : 'none'} />
          <DataRow label="RPC" value={status.rpc ? shortHash(status.rpc, 18, 6) : '—'} />
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted">Reading chain ID, latest block and processor bytecode from public X Layer RPCs…</p>
      )}
      <p className="mt-4 text-xs leading-5 text-muted">
        {status?.detail ?? 'Live RPC facts are shown separately from procurement evidence.'}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
        Tier C · chain facts only, not an eligibility proof
      </p>
    </section>
  )
}
