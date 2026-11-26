# Bidoraq — X Layer TapeOut Accelerate submission

## Entry snapshot

| Field | Answer |
| --- | --- |
| Product | Bidoraq — verifiable procurement evidence workspace. |
| Repository | `https://github.com/opeblow/bidoraq` |
| Deployment URL | Pending public hosting credentials. Local preview: `npm run build && npm run preview -- --host 127.0.0.1 --port 4173 --strictPort`. |
| Demo video | Not recorded in this sprint. Outline below. |
| Target user | Procurement teams, suppliers and auditors handling sealed quotations and disputed award decisions. |
| Network | X Layer mainnet, chain ID `196`. |
| Data model | Local-first; no backend, no custody of funds, no fabricated records. |

## What Bidoraq does

A buyer locks the tender rule before suppliers bid. Suppliers commit price and document hashes. At reveal, the commitment is recomputed. A reviewer records four eligibility bits through a six-NAND trace. The approver can finalize only the lowest eligible quotation. An auditor receives a redacted receipt that recomputes the policy hash, winning commitment and award rule without seeing supplier names or document contents.

## Explicit TapeOut usage

Bidoraq does **not** claim that its six-NAND eligibility circuit has been taped out. No processor address or circuit ID is fabricated.

- The app reads live X Layer facts from public RPCs: chain ID, latest block, RPC endpoint, and public processor bytecode.
- The public processor `0xA93E807fAB41431827EBBa57443Fb687a95E2AA3` is shown only as a reference contract, not as Bidoraq's circuit.
- The eligibility adapter implements the real TapeOut ABI `eval(uint256, bytes) view returns (bytes)` with LSB-first bit packing. It is used only when `VITE_TAPEOUT_PROCESSOR` and `VITE_TAPEOUT_CIRCUIT_ID` are configured.
- Without that configuration, the UI says “Circuit not yet taped out — local simulation” and the receipt verdict is `not-taped-out`.
- Tier A remains **BLOCKED(user action)**: tape-out requires the user's wallet, OKB on X Layer, and a signed action on `tapeout.net`.

See `docs/adr/0005-honest-onchain-integration.md` for the full decision.

## New work for this hackathon

- Replaced fabricated verifier constants with a bytes32 domain tag and deterministic local references.
- Added a real X Layer RPC adapter with honest online/offline states and Tier C chain facts.
- Added TapeOut `eval(uint256,bytes)` call support with real ABI, bit packing and caching.
- Added strict receipt verification: all three reveal fields required, and on-chain eligibility reported separately.
- Added workspace migration from `bidoraq:workspace:v2` to `v3` with `transactionHash` renamed to `localReference`.
- Added React error boundary, OG metadata, pricing page, robots file and environment example.
- Added tests for migration, deterministic references, strict receipt checks and tampered policy hashes.

## User value and commercial potential

- **Value:** procurement disputes are expensive because the rule, timing and evidence are rarely tied together. Bidoraq makes the decision path recomputable before an argument starts.
- **Buyer:** procurement and finance teams running repeatable RFQs who need an auditable award file.
- **Supplier:** bidders who need proof that a quotation was sealed before reveal.
- **Auditor:** third parties who can verify an outcome without opening confidential documents.
- **Revenue:** illustrative per-tender subscription tiers on `/pricing`: free pilot, team plan, and enterprise plan for dedicated circuits and private deployment. No payments are collected in this build.
- **Wedge:** start with redacted receipts and sealed RFQs, then expand to taped-out eligibility and DeWEB publication after a real circuit exists.

## Innovation

- Hash-locked policy: deadlines, rule version, tie behavior, currency and tender identity are bound before bids arrive.
- Sealed commitment: price, document hash and salt are hidden until reveal, then recomputed.
- Explainable eligibility: four reviewer bits through a six-NAND gate trace, with the on-chain path prepared but never faked.
- Award constraint: the approver cannot select a cheaper ineligible bid.
- Redacted receipt: enough evidence to audit, not enough to leak confidential bid packages.
- Honest chain tiers: live chain facts are displayed separately from procurement proof.

## Ecosystem integration

- Uses X Layer mainnet public RPCs and chain ID `196`.
- Uses viem for ABI encoding, Keccak-256 and contract reads.
- Implements the real TapeOut processor call shape documented by TapeKit/TapeSynth and public TapeOut contracts.
- Reports X Layer explorer links for the reference processor.
- DeWEB publication is **BLOCKED(user action)**: it requires a wallet, a circuit NFT container and signed file writes through HashPort/TapeKit.

## Product readiness and UX

- Empty-by-default workspace with onboarding, five roles, tender publishing, bid commitment, reveal, review, award and verification.
- Dense Evidence Ledger design: tabular records, monospaced hashes, explicit blocked states.
- Responsive layout; Playwright harness checks horizontal overflow and uncaught browser errors.
- Local audit ledger and JSON exports.
- Quality gates: `npm test`, `npm run typecheck`, `npm run check:links`, `npm run build`.

## Screenshot digest

The existing gallery is under `docs/screenshots/`:

- `01-landing.png` through `03-onboarding-profile.png`: public page and setup.
- `04-overview-empty.png` through `08-tender-detail.png`: workspace and tender publishing.
- `09-overview-active.png` through `13-award-finalized.png`: commitment, review and award.
- `14-receipt-verifier.png` through `18-pricing.png`: verification, settings, responsive landing and pricing.

The gallery must be recaptured after the Phase 0–2 UI changes with `npm run screenshots`.

## Demo script outline (≤3 minutes)

1. **0:00–0:20** — Landing page: locked rules, sealed bids, redacted receipts; show live X Layer Tier C panel.
2. **0:20–0:50** — Create an RFQ; point to the policy hash and explain the locked rule.
3. **0:50–1:20** — Switch to supplier; commit price and document hash; reveal and verify the commitment.
4. **1:20–1:45** — Reviewer role: attest A, B, C, D; show the six-NAND trace and the “local simulation” label.
5. **1:45–2:10** — Approver role: show computed ranking and finalize the compliant winner.
6. **2:10–2:35** — Export receipt; load it in the verifier; recompute three local checks and show honest on-chain status.
7. **2:35–2:55** — Pricing page and repository link; state what is blocked: real tape-out and DeWEB publication need user wallet actions.

## Blocked or cut

- **BLOCKED(user action):** real taped-out Bidoraq circuit; user wallet, OKB and signed tape-out action required.
- **BLOCKED(user action):** public deployment URL; hosting credentials required.
- **BLOCKED(user action):** Google Form submission at `https://forms.gle/EoDNbxQ65dev1wFd9`.
- **BLOCKED(user action):** demo video recording.
- **CUT:** backend, authentication, payments, document storage, multi-user sync and legal validation.
