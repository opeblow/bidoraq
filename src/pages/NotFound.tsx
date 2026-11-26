import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui'

export function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">404 / no record</div>
      <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em]">This page is not in the ledger.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-muted">The reference you followed does not match a route or a tender in this workspace.</p>
      <Link to="/app" className="mt-7"><Button><ArrowLeft className="h-4 w-4" /> Return to workspace</Button></Link>
    </div>
  )
}
