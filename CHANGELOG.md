# Changelog

All notable changes to this project are documented in this file.

The format follows Keep a Changelog, and versions follow Semantic Versioning where applicable.

## Unreleased

### Added

- Open-source governance: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `GOVERNANCE.md`, `PRIVACY.md`, `SECURITY.md`, `SUPPORT.md`, and MIT `LICENSE`.
- Architecture documentation, architecture decision records, roadmap, and this changelog.
- GitHub issue templates, pull request template, CI, CodeQL, screenshot, dependency review, release, and OSSF Scorecard workflows.
- Markdown link validation through `npm run check:links`.
- Mermaid architecture and evidence lifecycle diagrams in the README.
- Complete screenshot gallery generated through a real UI workflow.

### Changed

- README restructured around product rationale, problem statement, solution, evidence model, architecture, security, support, and governance.
- Repository file structure documented as a full tree.

## 0.1.0 - 2026-11-25

### Added

- Local-first React, TypeScript, Vite, and Tailwind application.
- Empty workspace with no seeded tenders, bids, awards, or receipts.
- Onboarding for role, injected wallet, manual address, and operator profile.
- Buyer workflow for creating and publishing RFQs with locked policy hashes.
- Supplier workflow for commitment, deadline enforcement, file hashing, and reveal verification.
- Reviewer workflow with four eligibility bits and a six-NAND circuit trace.
- Approver workflow with computed ranking and compliant award gate.
- Auditor receipt verifier with policy, commitment, and award rule checks.
- Local audit ledger with ledger and receipt JSON exports.
- Evidence Ledger design system with responsive public and workspace views.
- Vitest domain tests, strict typechecking, production build, and Playwright screenshot automation.
