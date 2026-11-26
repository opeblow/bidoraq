# Roadmap

Bidoraq is intentionally narrow. The roadmap focuses on making the evidence chain stronger before adding collaboration features.

## Now

- Keep all domain tests, typechecking, build, link checks, and screenshot flow green on every pull request.
- Maintain a no-demo-data policy across the interface and documentation.
- Improve clarity of failure states for late bids, failed reveals, and non-compliant awards.
- Expand tests around receipt parsing and malformed imported data.

## Next

- Add explicit version migration handling for stored workspace data.
- Add structured export manifests with checksums for ledger and receipt bundles.
- Add accessibility checks to the Playwright workflow.
- Add performance budgets for the production bundle.
- Add a documented threat model with trust boundaries and mitigations.

## Later

- Pluggable identity and authorization adapter for hosted deployments.
- Shared workspace synchronization behind a clearly defined server boundary.
- External timestamp anchoring for receipts.
- Multi-party export verification tooling.
- Localization for procurement teams operating across jurisdictions.

## Explicit non-goals

- Fund custody, wallet signing, or on-chain settlement.
- KYC or supplier identity registries.
- Long-term document storage.
- Generic project management or messaging features.
- Fabricated demo records for marketing screenshots.

The roadmap is a planning document, not a delivery guarantee. Changes should be proposed through issues and recorded in pull requests.
