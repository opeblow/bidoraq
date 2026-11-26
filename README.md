<div align="center">
  <img src="public/favicon.svg" alt="Bidoraq" width="72" height="72" />
  <h1>Bidoraq</h1>
  <p><strong>Verifiable procurement for real businesses.</strong></p>
  <p>
    <img src="https://img.shields.io/badge/build-passing-0F6F5C?style=flat-square" alt="Build" />
    <img src="https://img.shields.io/badge/tests-7%20passed-0F6F5C?style=flat-square" alt="Tests" />
    <img src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square" alt="TypeScript" />
    <img src="https://img.shields.io/badge/stack-React%20%2B%20Vite-646CFF?style=flat-square" alt="Stack" />
    <img src="https://img.shields.io/badge/network-X%20Layer%20196-1F2937?style=flat-square" alt="Network" />
    <img src="https://img.shields.io/badge/license-MIT-0F6F5C?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/open%20source-yes-0F6F5C?style=flat-square" alt="Open source" />
  </p>
</div>

Bidoraq is a local-first procurement evidence workspace for producing defensible tender outcomes. It locks the award rule before bids arrive, seals quotations as commitments, reveals and verifies those quotations later, records eligibility decisions, and publishes a redacted receipt that can be checked independently.

The application starts empty. Tenders, bids, attestations, awards, audit entries, and receipts are created through the interface by the people acting in each role. No tenders, suppliers, prices, or receipts are embedded in the source.

## Table of Contents

- [Documentation](#documentation)
- [Why Bidoraq exists](#why-bidoraq-exists)
- [The problem we are tackling](#the-problem-we-are-tackling)
- [What Bidoraq solves](#what-bidoraq-solves)
- [Product thesis](#product-thesis)
- [Design goals and non-goals](#design-goals-and-non-goals)
- [Roles and authority](#roles-and-authority)
- [End-to-end workflow](#end-to-end-workflow)
- [Evidence model](#evidence-model)
  - [Policy lock](#policy-lock)
  - [Commitment and reveal](#commitment-and-reveal)
  - [Eligibility circuit](#eligibility-circuit)
  - [Award rule](#award-rule)
  - [Receipt verification](#receipt-verification)
- [Feature map](#feature-map)
- [Getting started](#getting-started)
  - [HTTP smoke check](#http-smoke-check)
- [Quality gates](#quality-gates)
- [Application tour](#application-tour)
- [Architecture](#architecture)
  - [Architecture diagram](#architecture-diagram)
  - [Evidence lifecycle diagram](#evidence-lifecycle-diagram)
- [Design system](#design-system)
- [Data lifecycle and privacy](#data-lifecycle-and-privacy)
- [Security model](#security-model)
- [Known limitations](#known-limitations)
- [FAQ](#faq)
- [Glossary](#glossary)
- [Open source](#open-source)
  - [Release process](#release-process)
  - [Support](#support)

## Documentation

| Document | Purpose |
| --- | --- |
| [README](README.md) | Product overview, workflow, evidence model, application tour, and quick start. |
| [Architecture](docs/ARCHITECTURE.md) | Runtime boundaries, components, data model, domain contracts, invariants, and testing strategy. |
| [Architecture decision records](docs/adr/README.md) | Why the workspace is local-first, why commitments exist, why eligibility uses NAND gates, and why receipts are redacted. |
| [Roadmap](ROADMAP.md) | Current focus, next priorities, later ideas, and explicit non-goals. |
| [Changelog](CHANGELOG.md) | Notable changes by release. |
| [Contributing](CONTRIBUTING.md) | Development setup, workflow, and pull request checklist. |
| [Governance](GOVERNANCE.md) | Roles, decision making, release authority, and enforcement. |
| [Support](SUPPORT.md) | Where to ask questions and how to report issues. |
| [Privacy](PRIVACY.md) | Local data, wallet interaction, exports, and screenshot automation. |
| [Security](SECURITY.md) | Supported versions and vulnerability reporting. |

## Why Bidoraq exists

Procurement decisions often fail at the point of proof, not at the point of selection. A buyer may choose the correct supplier, but if the rule, bid, timing, eligibility decision, and final award cannot be tied together, the result is difficult to defend.

Bidoraq exists to make the award path inspectable from the beginning:

1. The rule is fixed before suppliers bid.
2. A supplier cannot quietly change a quotation after seeing competitors.
3. Reviewers must record why a bid is eligible or not.
4. The approver can only finalize the computed compliant winner.
5. An auditor can verify the outcome without opening confidential bid documents.

The product is not a generic dashboard. It is an evidence workspace built around a small chain of records where each step constrains the next.

## The problem we are tackling

| Failure mode | What usually goes wrong | Consequence |
| --- | --- | --- |
| Rules move after bidding | Evaluation criteria change once prices are visible. | The winner no longer corresponds to the published rule. |
| Quotation tampering | A price or document can be altered after submission. | The audit trail cannot prove which bid was actually submitted. |
| Late submissions | Closing time is ignored or selectively enforced. | Fairness is compromised and decisions become disputed. |
| Opaque compliance | Eligibility is asserted without a visible reason or trace. | Reviewers cannot defend why a bid passed or failed. |
| Over-disclosure | Full bid packages are shared to prove an award. | Supplier identities and confidential documents become public. |
| Unverifiable receipts | A published result contains claims but not recomputable evidence. | Auditors must trust the publisher. |
| Demo-driven prototypes | Interfaces show fabricated tenders instead of real state. | The product proves presentation, not behavior. |

Bidoraq addresses these failure modes by turning each one into a concrete mechanism in the interface and domain layer.

## What Bidoraq solves

| Problem | Bidoraq mechanism | Result |
| --- | --- | --- |
| Rule changes after publication | Policy hash computed from chain, verifier, tender identity, deadlines, currency, rule, and tie rule. | The rule is locked and can be recomputed from the receipt. |
| Quotation substitution | Commitment hash over tender, bidder, price, document hash, and one-time salt. | The supplier proves the submitted values before reveal. |
| Late bidding | Commit action checks the current clock against the commitment deadline. | Late commitments are refused. |
| Hidden eligibility decisions | Four reviewer-attested bits pass through a six-NAND circuit with a trace. | Eligibility is visible, deterministic, and explainable. |
| Non-compliant award | Approver action compares the chosen bid with the computed lowest eligible winner. | Invalid awards are refused before finalization. |
| Confidentiality versus auditability | Receipt omits supplier names and document contents but keeps hashes, eligibility outcomes, and salts. | The outcome is auditable without publishing full bid packages. |
| Fake application state | Empty workspace by default and all records created through UI actions. | Every visible record corresponds to a user action. |

## Product thesis

A tender result is defensible when the rule, the bid, and the decision can be tied together. Bidoraq replaces argument with a short chain of records:

1. The buyer locks the policy before suppliers are invited.
2. Each supplier submits a price and document hash behind a commitment.
3. The reveal step proves that the submitted fields reproduce the commitment.
4. A reviewer attests four evidence bits through a six-NAND eligibility circuit.
5. The approver can only finalize the lowest eligible quotation.
6. A redacted receipt exposes the hashes and outcome, not supplier names or document contents.

The interface is designed around this sequence. States that are not valid are shown as blocked, rejected, or unavailable instead of being simulated.

## Design goals and non-goals

### Goals

- Local-first operation with no required backend.
- User-created records only.
- Deterministic domain logic for hashes, eligibility, award selection, and lifecycle transitions.
- Clear separation between confidential bid data and public receipt evidence.
- Honest failure states for late bids, failed reveals, and non-compliant awards.
- Dense, tabular, professional interface with restrained visual language.
- Exportable audit ledger and receipt for external inspection.
- Playwright-driven visual verification of the full workflow.

### Non-goals

- Custody of funds, private keys, or seed phrases.
- On-chain transaction submission or settlement.
- Shared multi-user synchronization or server-side access control.
- Identity verification, KYC, or supplier onboarding registries.
- Long-term document storage.
- Legal advice or automated contract execution.
- Anonymous bidding; wallet addresses are part of the evidence chain.
- Fabricated demo records for presentation purposes.

Roles in the application are operational perspectives, not cryptographic authorization. A shared browser profile can switch roles for demonstration and local workflow testing. A production deployment would need real identity, access control, and transport architecture around this core.

## Roles and authority

| Role | Primary responsibility | What the role can do |
| --- | --- | --- |
| Buyer | Define and publish the tender | Create the RFQ, lock policy, close commitments, open evaluation. |
| Supplier | Submit and reveal a quotation | Commit price and document hash before deadline, then reproduce the commitment at reveal. |
| Reviewer | Attest evidence | Record four eligibility bits and produce a circuit trace for each bid. |
| Approver | Finalize the result | Review ranking and finalize only the computed compliant winner. |
| Auditor | Check the published outcome | Load a receipt and recompute policy, commitment, and award checks. |

## End-to-end workflow

```text
Buyer publishes RFQ
        |
        v
Policy hash locked
        |
        v
Supplier commits price + document hash + salt
        |
        v
Commitments close at deadline
        |
        v
Supplier reveals fields and verifies commitment
        |
        v
Reviewer attests eligibility bits
        |
        v
Six-NAND circuit produces result and trace
        |
        v
Approver sees computed ranking
        |
        v
Compliant award finalized
        |
        v
Redacted receipt exported
        |
        v
Auditor recomputes three checks
```

Tender lifecycle transitions are explicit:

```text
draft -> open -> closed -> evaluation -> awarded
  |       |        |          |
  +-------+--------+----------+-> cancelled

open -> expired
```

The state machine rejects invalid jumps. For example, a tender cannot move from `draft` directly to `evaluation`, and an `awarded` tender has no further transitions.

## Evidence model

The domain layer derives evidence from operator input. No tender records are embedded in the source.

### Policy lock

The policy hash is computed with Keccak-256 over ABI-encoded fields:

```text
chain id
verifier contract
bytes32 tender id
currency
commit deadline
reveal deadline
rule version code
tie rule
rule version string
```

This means the published rule is bound to the tender identity, deadlines, and evaluation method. Changing any of those fields changes the hash.

### Commitment and reveal

A supplier commitment is computed with Keccak-256 over:

```text
chain id
verifier contract
bytes32 tender id
bidder address
price in kobo
document hash
one-time salt
```

Uploaded documents are hashed in the browser with SHA-256. The original file bytes are not written to the workspace ledger.

During reveal, the supplier enters price, document hash, and salt. The application recomputes the commitment and compares it with the sealed value. A mismatch is rejected instead of being treated as a new bid.

### Eligibility circuit

Reviewers attest four bits:

| Bit | Meaning |
| --- | --- |
| A | Authorized supplier |
| B | Reviewer-attested completeness |
| C | Timely commitment |
| D | Technical compliance |

Bit D defaults to false, so a bid cannot pass by being left unreviewed. The four bits pass through six NAND gates:

```text
N1  = NAND(A, B)
AND1 = NAND(N1, N1)
N2  = NAND(C, D)
AND2 = NAND(N2, N2)
N3  = NAND(AND1, AND2)
E   = NAND(N3, N3)
```

The result is true only when all four inputs are true. Every gate, input pair, and output is stored in the trace.

### Award rule

The award rule is `lowest-eligible-v1`:

1. Consider only revealed bids with an eligibility result of true.
2. Rank by price in kobo, lowest first.
3. Break equal-price ties with the locked tie rule: `earliest-commit` or `supplier-id`.
4. Refuse finalization if the selected bid is not the computed winner.

### Receipt verification

The redacted receipt contains the policy, policy hash, winning bid reference, award price, local transaction reference, approver address, approval time, compliance note, and ranked revealed bids with commitments, prices, document hashes, salts, eligibility outcomes, and bidder addresses.

It omits supplier display names and uploaded document contents. The verifier recomputes:

- Policy hash from the receipt fields.
- Winning commitment from the revealed price, document hash, and salt.
- Award rule from the ranked eligible bids and the locked tie rule.

## Feature map

| Area | Features |
| --- | --- |
| Setup | Onboarding, role selection, injected wallet connection, manual address fallback, operator profile. |
| Tender publishing | RFQ brief, quantity, budget, location, deadlines, required documents, invited addresses, live policy hash. |
| Supplier workflow | Invitation check, commitment preview, file hashing, one-time salt, late-bid refusal, reveal verification. |
| Review | Per-bid evidence bits, provenance labels, six-NAND trace, eligibility result. |
| Award | Computed ranking, compliance gate, refusal path, approver address, finalization record. |
| Audit | Local ledger of writes, actor and role labels, record references, exportable JSON. |
| Verification | Receipt paste or upload, load latest receipt, three integrity checks. |
| Controls | Settings, identity, wallet, ledger export, receipt export, workspace clear. |
| Interface | Responsive layout, density, tabular records, no overflow, no uncaught browser errors. |
| Automation | Domain tests, typecheck, production build, Playwright screenshot and smoke flow, CodeQL, Dependabot. |

## Getting started

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The workspace begins with no tenders, commitments, awards, or receipts.

### Production build

```bash
npm run build
npm run preview -- --host 127.0.0.1 --port 4173 --strictPort
```

### Screenshot capture

Start the preview server on port `4173`, then run this in a second terminal:

```bash
npm run screenshots
```

The script clears local storage, creates a complete tender through the interface, commits two bids, reveals both, attests eligibility, finalizes the award, verifies the receipt, and captures every major view. It fails on horizontal overflow or uncaught browser errors.

Set `BIDORAQ_BASE_URL` if the preview server runs on another origin.

### HTTP smoke check

With the preview server running, verify routes and built assets with curl:

```bash
curl --fail --silent --show-error --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:4173/
curl --fail --silent --show-error --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:4173/onboarding
curl --fail --silent --show-error --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:4173/app
curl --fail --silent --show-error --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:4173/verify
curl --fail --silent --show-error --output /dev/null --write-out "%{http_code}\n" http://127.0.0.1:4173/settings
```

All routes should return `200`. Client-side interactions are verified by the Playwright flow, not by curl.

## Quality gates

| Command | Purpose |
| --- | --- |
| `npm test` | Runs domain tests for commitments, circuit behavior, award rule, and lifecycle transitions. |
| `npm run typecheck` | Runs strict TypeScript checking. |
| `npm run check:links` | Validates all repository markdown file links and heading anchors. |
| `npm run build` | Produces the optimized production bundle. |
| `npm run screenshots` | Drives the full workflow, captures the gallery, and asserts layout and runtime health. |
| `npm ci --dry-run --ignore-scripts` | Validates that the lockfile is installable in CI. |
| curl route check | Verifies the built preview server serves all SPA routes. |

Current verification status:

- 7 domain tests passed.
- Typecheck clean.
- Markdown link and anchor validation clean.
- Production build clean.
- `npm ci --dry-run --ignore-scripts` clean.
- 17 screenshots captured without horizontal overflow or browser errors.
- All SPA route and built asset curl checks returned `200`.

## Application tour

### Public and setup

| View | Screenshot | Description |
| --- | --- | --- |
| Landing | ![Landing page](docs/screenshots/01-landing.png) | Product overview, live ledger state, guardrail narrative, and receipt preview. |
| Onboarding role | ![Onboarding role](docs/screenshots/02-onboarding-role.png) | Role selection with the authority attached to each perspective. |
| Onboarding profile | ![Onboarding profile](docs/screenshots/03-onboarding-profile.png) | Wallet address and operator profile capture before entering the workspace. |
| Landing on mobile | ![Landing mobile](docs/screenshots/17-landing-mobile.png) | Responsive public page at 390 px width. |

### Workspace and tender publishing

| View | Screenshot | Description |
| --- | --- | --- |
| Overview, empty | ![Empty overview](docs/screenshots/04-overview-empty.png) | Empty ledger state with zero counters and a clear creation path. |
| New RFQ brief | ![RFQ brief](docs/screenshots/05-new-rfq-brief.png) | Buyer enters scope, quantity, budget, location, and description. |
| New RFQ policy | ![RFQ policy](docs/screenshots/06-new-rfq-policy.png) | Deadlines, required documents, and invited supplier addresses are set. |
| New RFQ review | ![RFQ review](docs/screenshots/07-new-rfq-review.png) | Final review shows the live policy hash before publication. |
| Tender detail | ![Tender detail](docs/screenshots/08-tender-detail.png) | Published tender with locked policy, invited wallets, and audit note. |

### Commitment and decision

| View | Screenshot | Description |
| --- | --- | --- |
| Overview, active | ![Active overview](docs/screenshots/09-overview-active.png) | Workspace after the first supplier commitment is recorded. |
| Submit bid | ![Submit bid](docs/screenshots/10-submit-bid.png) | Supplier commitment and reveal view with hash verification. |
| Evidence review | ![Evidence review](docs/screenshots/11-evidence-review.png) | Reviewer attests four bits and the NAND processor emits eligibility. |
| Award control | ![Award control](docs/screenshots/12-award-control.png) | Computed ranking and compliance gate before approver signature. |
| Award finalized | ![Award finalized](docs/screenshots/13-award-finalized.png) | Finalized winner and receipt card after the rule check passes. |

### Verification and controls

| View | Screenshot | Description |
| --- | --- | --- |
| Receipt verifier | ![Receipt verifier](docs/screenshots/14-receipt-verifier.png) | Three integrity checks recomputed from the published receipt. |
| Settings | ![Settings](docs/screenshots/15-settings.png) | Identity, wallet, export, clearance, and storage controls. |
| Overview, final | ![Final overview](docs/screenshots/16-overview-final.png) | Completed workspace state with award and audit activity. |

## Architecture

### Architecture diagram

```mermaid
flowchart LR
  subgraph ACTORS["Operators"]
    BUYER["Buyer"]
    SUPPLIER["Supplier"]
    REVIEWER["Reviewer"]
    APPROVER["Approver"]
    AUDITOR["Auditor"]
  end

  subgraph BROWSER["Browser runtime - no backend"]
    ROUTER["React Router and AppShell"]
    PAGES["Workflow pages"]
    STORE["Workspace store"]
    LS[("localStorage<br/>key: bidoraq:workspace:v2")]

    subgraph DOMAIN["Domain services"]
      CRYPTO["crypto.ts<br/>policy and commitment hashes"]
      FILEHASH["hashDocument<br/>SHA-256 file hashing"]
      CIRCUIT["circuit.ts<br/>six NAND eligibility"]
      AWARD["award.ts<br/>winner ranking"]
      STATE["stateMachine.ts<br/>lifecycle transitions"]
      RECEIPT["receipt.ts<br/>build, parse, verify"]
    end
  end

  subgraph EXTERNAL["External boundaries"]
    WALLET["Injected EIP-1193 wallet<br/>or manual address"]
    FILES["Local quotation files"]
    EXPORT["Ledger and receipt JSON exports"]
  end

  subgraph AUTOMATION["Repository automation"]
    SOURCE["Source tree"]
    TESTS["Vitest domain tests"]
    CI["GitHub Actions CI"]
    SHOTS["Playwright screenshot flow"]
    CODEQL["CodeQL analysis"]
  end

  BUYER --> ROUTER
  SUPPLIER --> ROUTER
  REVIEWER --> ROUTER
  APPROVER --> ROUTER
  AUDITOR --> ROUTER
  ROUTER --> PAGES

  WALLET --> STORE
  FILES --> PAGES
  PAGES --> STORE
  PAGES --> CRYPTO
  PAGES --> FILEHASH
  PAGES --> CIRCUIT
  PAGES --> AWARD
  PAGES --> STATE
  PAGES --> RECEIPT
  STORE --> LS
  RECEIPT --> EXPORT
  EXPORT --> AUDITOR

  CI --> SOURCE
  CI --> TESTS
  TESTS --> CRYPTO
  TESTS --> CIRCUIT
  TESTS --> AWARD
  TESTS --> STATE
  SHOTS --> PAGES
  CODEQL --> SOURCE
```

The diagram shows the current runtime boundary: all product logic executes in the browser. There is no application server, no remote database, and no on-chain write path.

| Boundary | Role |
| --- | --- |
| Operators | Create and review records through role-specific views. |
| Browser runtime | Owns routing, interface state, domain calculations, and local persistence. |
| Wallet boundary | Supplies an address only; it does not sign, fund, or settle anything. |
| File boundary | Uploaded files are hashed locally and are not stored as documents. |
| Export boundary | Ledger and receipt JSON files leave the browser only when a user exports them. |
| Repository automation | Validates source, domain logic, security, and the full visual workflow. |

### Evidence lifecycle diagram

```mermaid
sequenceDiagram
  participant B as Buyer
  participant S as Supplier
  participant R as Reviewer
  participant A as Approver
  participant V as Verifier
  participant D as Domain layer

  B->>D: Publish RFQ and policy
  D->>D: computePolicyHash
  S->>D: Commit price, document hash, and salt
  D->>D: computeCommitment
  S->>D: Reveal fields
  D->>D: verifyCommitment
  R->>D: Attest eligibility bits A B C D
  D->>D: evaluateEligibility with six NAND gates
  A->>D: Finalize selected bid
  D->>D: selectWinner and compliance gate
  D->>V: Redacted receipt
  V->>D: verifyReceipt
  D->>V: Policy, commitment, and award checks
```

```text
bidoraq/
├── .github/
│   ├── dependabot.yml
│   └── workflows/
│       ├── ci.yml
│       ├── codeql.yml
│       └── screenshots.yml
├── docs/
│   └── screenshots/
│       ├── 01-landing.png
│       ├── 02-onboarding-role.png
│       ├── 03-onboarding-profile.png
│       ├── 04-overview-empty.png
│       ├── 05-new-rfq-brief.png
│       ├── 06-new-rfq-policy.png
│       ├── 07-new-rfq-review.png
│       ├── 08-tender-detail.png
│       ├── 09-overview-active.png
│       ├── 10-submit-bid.png
│       ├── 11-evidence-review.png
│       ├── 12-award-control.png
│       ├── 13-award-finalized.png
│       ├── 14-receipt-verifier.png
│       ├── 15-settings.png
│       ├── 16-overview-final.png
│       └── 17-landing-mobile.png
├── scripts/
│   └── capture-screenshots.mjs
├── src/
│   ├── components/
│   │   ├── AppShell.tsx
│   │   ├── Brand.tsx
│   │   ├── Domain.tsx
│   │   └── ui.tsx
│   ├── lib/
│   │   ├── award.ts
│   │   ├── circuit.ts
│   │   ├── crypto.ts
│   │   ├── cx.ts
│   │   ├── domain.test.ts
│   │   ├── format.ts
│   │   ├── receipt.ts
│   │   ├── stateMachine.ts
│   │   └── workspace.ts
│   ├── pages/
│   │   ├── Award.tsx
│   │   ├── CreateTender.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Landing.tsx
│   │   ├── NotFound.tsx
│   │   ├── Onboarding.tsx
│   │   ├── ReviewQueue.tsx
│   │   ├── Settings.tsx
│   │   ├── SubmitBid.tsx
│   │   ├── TenderDetail.tsx
│   │   └── Verify.tsx
│   ├── state/
│   │   └── store.tsx
│   ├── styles/
│   │   └── tokens.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── PRIVACY.md
├── README.md
├── SECURITY.md
├── index.html
├── package-lock.json
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

### Architecture notes

- `src/lib` contains the domain logic that should remain deterministic and tested.
- `src/state/store.tsx` owns local persistence, wallet wiring, and audit logging.
- `src/pages` maps to the product workflow and is intentionally thin around domain calls.
- `src/components` contains the shell, brand, shared display components, and UI primitives.
- `scripts/capture-screenshots.mjs` is the end-to-end visual smoke harness.
- `.github/workflows` enforces the quality gates on pushes and pull requests.

## Design system

The visual system is called Evidence Ledger. It uses warm paper surfaces, ink teal structure, mint only for verified signals, and clay or amber for exceptions. Typography pairs Manrope for interface text with IBM Plex Mono for hashes, deadlines, labels, and machine output.

Layouts use hairline borders, sharp corners, strict spacing increments, and dense tabular information. Motion is limited to short state feedback. There are no decorative gradients, generic dashboard cards, excessive rounded containers, glassmorphism, or emoji icons.

The interface is organized around evidence density:

- Identifiers, hashes, and timestamps use monospaced text.
- Status is expressed with language and restrained color, not decoration.
- Actions are placed next to the record they affect.
- Invalid states are explicit and explain why they are blocked.
- Tables and rows are preferred over repeated card grids for comparable records.

## Data lifecycle and privacy

Workspace records are persisted in the browser under `bidoraq:workspace:v2`. The workspace can be exported or cleared from Settings. Uploaded document bytes are hashed locally and are not stored in the ledger. The published receipt omits supplier names and document contents while retaining the hashes and reveal values required for verification.

| Data class | Local workspace | Exported receipt | Notes |
| --- | --- | --- | --- |
| Operator profile | Yes | No | Name, organization, and email stay local. |
| Wallet address | Yes | Yes | Included because it is part of commitment and approval evidence. |
| Tender policy | Yes | Yes | Required for policy hash recomputation. |
| Document bytes | No | No | Only the SHA-256 hash is retained. |
| Document hash | Yes | Yes | Required for commitment verification. |
| Salt | Yes | Yes | Required to reproduce the winning commitment. |
| Supplier name | Yes | No | Kept in the local workspace, excluded from the receipt. |
| Eligibility trace | Yes | Outcomes only | Receipt records eligibility results without operator prose. |
| Audit ledger | Yes | Separate export | Exported independently from Settings. |

Bidoraq does not operate a server, submit on-chain transactions, collect analytics, or hold funds. Local hash references are used to tie audit entries to records. See [PRIVACY.md](PRIVACY.md) for the full policy.

## Security model

The security model is intentionally narrow and explicit:

- Hashes are derived locally with `viem` and browser cryptography.
- Reveals are accepted only when recomputation matches the commitment.
- Late commitment checks use the real clock.
- Awards are finalized only when the selected bid matches the computed winner.
- Receipt parsing validates the expected version and required fields.
- Receipt verification recomputes policy, winning commitment, and award rule.
- No secrets, API keys, or credentials are required by the application.
- CI runs CodeQL and dependency update automation.

The application does not protect against a compromised browser extension, a compromised local machine, users sharing exports indiscriminately, or social engineering. Role switching is not a replacement for production authentication and authorization.

Report vulnerabilities privately according to [SECURITY.md](SECURITY.md). Do not open public issues for security defects.

## Known limitations

These boundaries are deliberate in version 0.1.0. They should be treated as architecture constraints, not hidden defects.

| Limitation | Impact | Planned direction |
| --- | --- | --- |
| Local-only workspace | No shared state between users or devices. | Add a clearly bounded synchronization adapter later. |
| Role switching is not authentication | Anyone with browser access can change the active role. | Add identity and authorization for hosted deployments. |
| No on-chain anchoring | Receipts are independently recomputable but not timestamp-anchored externally. | Add optional anchoring or witness signatures. |
| No document storage | Only hashes are retained, so original files must be preserved separately. | Keep external document custody with the operator. |
| No storage migration automation | Changing the workspace schema requires an explicit release decision. | Add migration handling before schema changes ship. |
| No accessibility audit | Layout overflow and browser errors are checked, but assistive technology coverage is not certified. | Add automated accessibility checks to CI. |
| No formal legal validation | The evidence chain is technical, not a legal guarantee. | Obtain domain and legal review for deployment. |

## FAQ

### Where is data stored?

In the browser under `bidoraq:workspace:v2`. There is no server-side workspace.

### Why does the app start empty?

Because the product is built around real records. Seeded tenders and fabricated bids would hide lifecycle bugs and make the evidence chain meaningless.

### Does Bidoraq submit transactions on-chain?

No. It derives local hash references and computes evidence using hardcoded network and verifier constants. It does not broadcast or settle transactions.

### Can I use it without a wallet extension?

Yes. The Connect Wallet dialog accepts a manually entered `0x` address for local workflow testing. No signature is requested.

### Can a reviewer approve a bid without evidence?

No. Eligibility bits default to false. The circuit result is true only when all four bits are true.

### Can any bid be finalized?

No. The approver action checks the computed winner. A different selection is refused.

### What does the receipt reveal?

It reveals the rule, hashes, wallet addresses, prices, salts, eligibility outcomes, and award reference. It does not reveal supplier names or uploaded document contents.

### Can the receipt be forged?

The receipt can be edited like any JSON file, but the verifier recomputes the policy hash, winning commitment, and award rule. Inconsistent edits fail visibly.

### Is this ready for a real procurement deployment?

It is a strong local-first evidence prototype. Real deployment needs identity, access control, shared storage, timestamp anchoring, key management, and legal review around the workflow.

## Glossary

| Term | Meaning |
| --- | --- |
| Policy hash | A fixed hash of the tender rule, deadlines, chain, verifier, and tender identity. |
| Commitment | A sealed hash of bidder, price, document hash, salt, and tender identity. |
| Reveal | The step where the supplier submits the original fields for commitment verification. |
| Eligibility bit | One of four reviewer-attested inputs: A, B, C, or D. |
| Circuit trace | The recorded input and output of each NAND gate used to compute eligibility. |
| Award rule | The locked method for selecting the lowest eligible quotation and resolving ties. |
| Receipt | A redacted JSON artifact containing the evidence needed to verify an award. |
| Audit ledger | A local list of writes with actor, role, record, timestamp, and reference. |
| Transaction reference | A locally derived hash used to tie an audit entry to a record. |
| Evidence Ledger | The visual design system built around dense, tabular, restrained evidence display. |

## Open source

Bidoraq is released under the MIT License. Contributions are welcome, provided they preserve the local-first data model, empty-state behavior, and evidence guarantees described above.

| File | Purpose |
| --- | --- |
| [LICENSE](LICENSE) | MIT License terms. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development setup, branch workflow, and pull request checklist. |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Community standards and enforcement process. |
| [GOVERNANCE.md](GOVERNANCE.md) | Roles, decision making, release authority, and enforcement. |
| [PRIVACY.md](PRIVACY.md) | Local storage, wallet interaction, and export behavior. |
| [SECURITY.md](SECURITY.md) | Supported versions and vulnerability reporting process. |
| [SUPPORT.md](SUPPORT.md) | Support channels and response expectations. |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes by release. |
| [ROADMAP.md](ROADMAP.md) | Product direction and explicit non-goals. |
| [bug_report.yml](.github/ISSUE_TEMPLATE/bug_report.yml) | Structured bug reports. |
| [feature_request.yml](.github/ISSUE_TEMPLATE/feature_request.yml) | Structured feature requests. |
| [PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) | Pull request checklist and evidence model impact review. |
| [ci.yml](.github/workflows/ci.yml) | Tests, typechecking, link validation, and production build on Node 20 and 22. |
| [screenshots.yml](.github/workflows/screenshots.yml) | Full UI workflow capture with layout and runtime checks. |
| [codeql.yml](.github/workflows/codeql.yml) | Static security analysis for JavaScript and TypeScript. |
| [dependency-review.yml](.github/workflows/dependency-review.yml) | Pull request dependency vulnerability review. |
| [release.yml](.github/workflows/release.yml) | Tag validation, release checks, and GitHub release creation. |
| [scorecard.yml](.github/workflows/scorecard.yml) | OSSF Scorecard security analysis. |
| [dependabot.yml](.github/dependabot.yml) | Weekly npm and GitHub Actions dependency updates. |

Contributors should run every quality gate before opening a pull request and update the screenshot gallery whenever the interface changes.

### Release process

1. Update `CHANGELOG.md` with the changes included in the release.
2. Confirm `package.json` version matches the intended tag.
3. Tag the release commit with `vX.Y.Z` and push the tag.
4. The release workflow verifies the tag, runs tests, typechecking, link checks, and the production build.
5. The workflow creates a GitHub release with generated notes from the commit history.

### Support

Use [SUPPORT.md](SUPPORT.md) for questions, bug reports, feature requests, and documentation gaps. Security vulnerabilities must follow [SECURITY.md](SECURITY.md) and remain private.
