import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { cx } from '../lib/cx'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'verified'
type ButtonSize = 'sm' | 'md' | 'lg'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-ink text-paper border-ink hover:bg-teal hover:border-teal',
  secondary: 'bg-surface text-ink border-line hover:border-ink hover:bg-paper',
  ghost: 'bg-transparent text-ink border-transparent hover:bg-ink/5',
  danger: 'bg-clay text-white border-clay hover:brightness-95',
  verified: 'bg-mint text-ink border-mint hover:bg-mint/80',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-sharp border font-semibold tracking-tight transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-45',
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

type BadgeTone = 'neutral' | 'verified' | 'warning' | 'danger' | 'ink' | 'outline'

const badgeTones: Record<BadgeTone, string> = {
  neutral: 'bg-ink/5 text-muted border-line',
  verified: 'bg-mint/20 text-mint-deep border-mint/50',
  warning: 'bg-amber/15 text-amber border-amber/40',
  danger: 'bg-clay/12 text-clay border-clay/35',
  ink: 'bg-ink text-paper border-ink',
  outline: 'bg-transparent text-ink border-line',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-hair border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function Card({
  className,
  children,
  as: Component = 'div',
}: {
  className?: string
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'aside'
}) {
  return (
    <Component className={cx('rounded-sharp border border-line bg-surface', className)}>
      {children}
    </Component>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('font-mono text-[10px] uppercase tracking-[0.2em] text-muted', className)}>
      {children}
    </div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  intro,
  right,
}: {
  eyebrow?: string
  title: ReactNode
  intro?: ReactNode
  right?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-prose">
        {eyebrow ? <Eyebrow className="mb-3">{eyebrow}</Eyebrow> : null}
        <h2 className="text-balance text-2xl font-semibold leading-tight tracking-[-0.04em] md:text-3xl">{title}</h2>
        {intro ? <p className="mt-3 text-sm leading-6 text-muted md:text-base">{intro}</p> : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  )
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('break-all font-mono text-xs tracking-tight', className)}>{children}</span>
}

export function DataRow({
  label,
  value,
  mono,
  className,
}: {
  label: ReactNode
  value: ReactNode
  mono?: boolean
  className?: string
}) {
  return (
    <div className={cx('flex flex-col gap-1 border-b border-line/70 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-6', className)}>
      <span className="text-xs uppercase tracking-[0.12em] text-muted">{label}</span>
      <span className={cx('text-sm font-medium text-ink', mono && 'font-mono text-xs')}>{value}</span>
    </div>
  )
}

export function Stat({
  label,
  value,
  note,
  tone = 'ink',
}: {
  label: string
  value: ReactNode
  note?: ReactNode
  tone?: 'ink' | 'verified' | 'warning'
}) {
  const toneClass = tone === 'verified' ? 'text-mint-deep' : tone === 'warning' ? 'text-clay' : 'text-ink'
  return (
    <div className="border-l border-line pl-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</div>
      <div className={cx('mt-2 text-2xl font-semibold tracking-[-0.05em] tabular', toneClass)}>{value}</div>
      {note ? <div className="mt-1 text-xs text-muted">{note}</div> : null}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  detail,
  action,
}: {
  icon?: ReactNode
  title: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center border border-line bg-paper text-muted">
        {icon ?? <ChevronRight className="h-5 w-5" />}
      </div>
      <h3 className="text-lg font-semibold tracking-[-0.03em]">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">{detail}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs text-clay">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  )
}

const controlClass =
  'w-full rounded-sharp border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/60 focus:border-mint-deep disabled:bg-paper disabled:text-muted'

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, props.className)} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, 'min-h-28 resize-y', props.className)} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(controlClass, 'appearance-none pr-9', props.className)} {...props} />
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-3"
    >
      <span className={cx('relative h-5 w-9 rounded-full border transition-colors', checked ? 'border-mint-deep bg-mint-deep' : 'border-line bg-paper')}>
        <span className={cx('absolute top-0.5 h-3.5 w-3.5 rounded-full bg-surface transition-all', checked ? 'left-[18px]' : 'left-0.5')} />
      </span>
      <span className="text-sm text-ink">{label}</span>
    </button>
  )
}

export function CheckLine({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 border-b border-line/60 py-3 text-left last:border-b-0"
    >
      <span className={cx('mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-hair border', checked ? 'border-mint-deep bg-mint-deep text-ink' : 'border-line bg-surface')}>
        {checked ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
      </span>
      <span className="text-sm leading-5 text-ink">{children}</span>
    </button>
  )
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
}: {
  items: Array<{ id: T; label: string; count?: number }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 border-b border-line">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cx(
            '-mb-px border-b-2 pb-3 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors',
            value === item.id ? 'border-mint-deep text-ink' : 'border-transparent text-muted hover:text-ink',
          )}
        >
          {item.label}
          {item.count !== undefined ? <span className="ml-1.5 text-muted">{item.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap gap-x-2 gap-y-3">
      {steps.map((step, index) => (
        <li key={step} className="flex items-center gap-2">
          <span className={cx('flex h-6 w-6 items-center justify-center border font-mono text-[10px]', index < current ? 'border-mint-deep bg-mint-deep text-ink' : index === current ? 'border-ink bg-ink text-paper' : 'border-line bg-paper text-muted')}>
            {index < current ? <Check className="h-3 w-3" strokeWidth={3} /> : String(index + 1).padStart(2, '0')}
          </span>
          <span className={cx('font-mono text-[10px] uppercase tracking-[0.12em]', index <= current ? 'text-ink' : 'text-muted')}>{step}</span>
          {index < steps.length - 1 ? <span className="ml-2 hidden h-px w-8 bg-line sm:block" /> : null}
        </li>
      ))}
    </ol>
  )
}

export function Bit({ value }: { value: boolean }) {
  return (
    <span className={cx('inline-flex h-6 min-w-6 items-center justify-center border px-1.5 font-mono text-xs', value ? 'border-mint-deep bg-mint text-ink' : 'border-line bg-paper text-muted')}>
      {value ? '1' : '0'}
    </span>
  )
}
