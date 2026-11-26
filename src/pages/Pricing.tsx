import { Link } from 'react-router-dom'
import { ArrowRight, Check, LockKeyhole, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../components/Domain'
import { Badge, Button, Card } from '../components/ui'

const tiers = [
  {
    name: 'Pilot',
    price: '₦0',
    cadence: 'forever',
    summary: 'Prove the workflow on one local workspace.',
    features: ['Up to 3 tenders per month', 'All four roles', 'Hash-locked policy', 'Redacted receipt export'],
    action: 'Start pilot',
    href: '/app',
    featured: false,
  },
  {
    name: 'Team',
    price: '₦45,000',
    cadence: 'per month',
    summary: 'For procurement teams running repeatable RFQs.',
    features: ['Unlimited tenders', 'Shared reviewer and approver roles', 'Receipt verifier link', 'Priority issue triage'],
    action: 'Open workspace',
    href: '/app',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'annual contract',
    summary: 'Tape-out eligibility verification and private deployment.',
    features: ['Dedicated taped-out circuit', 'X Layer / DeWEB publishing', 'Custom award rules', 'Audit and support SLA'],
    action: 'Discuss integration',
    href: 'https://github.com/opeblow/bidoraq/issues',
    featured: false,
  },
]

export function Pricing() {
  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-shell px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <PageHeader
          eyebrow="Commercial model / Illustrative"
          title="Pricing for evidence, not for seats alone"
          detail="Bidoraq is priced per completed, receipt-backed tender. This hackathon build does not collect payments or hold funds; these tiers describe the intended launch model."
        />

        <div className="mt-10 grid gap-px border border-line bg-line lg:grid-cols-3">
          {tiers.map((tier) => (
            <Card key={tier.name} className={`flex h-full flex-col p-7 ${tier.featured ? 'border-ink bg-ink text-paper' : ''}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-[-0.04em]">{tier.name}</h2>
                {tier.featured ? <Badge tone="verified">recommended</Badge> : null}
              </div>
              <div className="mt-8 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-[-0.06em]">{tier.price}</span>
                <span className={`pb-1 font-mono text-[10px] uppercase tracking-[0.12em] ${tier.featured ? 'text-paper/55' : 'text-muted'}`}>{tier.cadence}</span>
              </div>
              <p className={`mt-4 text-sm leading-6 ${tier.featured ? 'text-paper/65' : 'text-muted'}`}>{tier.summary}</p>
              <ul className="mt-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tier.featured ? 'text-mint' : 'text-mint-deep'}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              {tier.href.startsWith('http') ? (
                <a href={tier.href} target="_blank" rel="noreferrer" className="mt-9">
                  <Button className="w-full" variant={tier.featured ? 'verified' : 'secondary'}>{tier.action} <ArrowRight className="h-4 w-4" /></Button>
                </a>
              ) : (
                <Link to={tier.href} className="mt-9">
                  <Button className="w-full" variant={tier.featured ? 'verified' : 'secondary'}>{tier.action} <ArrowRight className="h-4 w-4" /></Button>
                </Link>
              )}
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-6 border border-line bg-surface p-6 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><LockKeyhole className="h-3.5 w-3.5" /> No custody</div>
            <p className="mt-3 text-sm leading-6 text-muted">Bidoraq never holds funds or escrows documents. The app records hashes and audit events only.</p>
          </div>
          <div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"><ShieldCheck className="h-3.5 w-3.5" /> Honest verification</div>
            <p className="mt-3 text-sm leading-6 text-muted">On-chain eligibility appears only when a real taped-out processor is configured. Otherwise the app says “local simulation”.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
