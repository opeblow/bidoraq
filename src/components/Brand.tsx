import { Link } from 'react-router-dom'
import { cx } from '../lib/cx'

export function BrandMark({ className }: { className?: string }) {
  return (
    <span className={cx('relative inline-flex h-9 w-9 shrink-0 items-center justify-center border border-ink bg-ink text-paper', className)}>
      <span className="absolute left-[7px] top-[7px] h-[3px] w-[3px] bg-mint" />
      <span className="absolute bottom-[7px] right-[7px] h-[3px] w-[3px] bg-mint" />
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M6 4h12M6 10h12M6 16h7" stroke="currentColor" strokeWidth="1.4" />
        <path d="m8.5 19 2.4 2.4 4.6-5" stroke="rgb(var(--mint))" strokeWidth="1.6" />
      </svg>
    </span>
  )
}

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link to="/" className={cx('inline-flex items-center gap-3', className)} aria-label="Bidoraq home">
      <BrandMark />
      {!compact ? (
        <span>
          <span className="block text-[17px] font-bold leading-none tracking-[-0.06em]">bidoraq</span>
          <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted">verifiable procurement</span>
        </span>
      ) : null}
    </Link>
  )
}
