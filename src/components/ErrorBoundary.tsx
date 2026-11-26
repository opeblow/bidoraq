import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {}

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Bidoraq render error', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main className="flex min-h-screen items-center justify-center bg-paper p-6 text-ink">
        <div className="max-w-lg border border-ink bg-surface p-8 shadow-ledger">
          <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-clay">workspace error</div>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">This page could not be rendered.</h1>
          <p className="mt-3 text-sm leading-6 text-muted">Your local workspace data is still in this browser. Reload to try again.</p>
          <button
            className="mt-6 inline-flex h-9 items-center border border-ink bg-ink px-4 text-xs font-semibold text-paper"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload Bidoraq
          </button>
        </div>
      </main>
    )
  }
}
