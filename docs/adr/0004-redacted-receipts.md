# 0004 - Redacted receipts

Status: Accepted

## Context

An audit artifact must prove the rule and outcome, but publishing full bid packages would expose supplier identities and confidential documents.

## Decision

Version 2 receipts include policy fields, hashes, wallet addresses, prices, salts, eligibility outcomes, ranked bid commitments, award metadata, a deterministic local reference, and an optional on-chain eligibility verdict. They omit supplier display names and document contents. Verification requires all revealed fields and reports on-chain status separately from the three local integrity checks.

## Consequences

Positive:

- Auditors can recompute policy, commitment, and award checks.
- Confidential document contents are never included.
- The receipt has a compact, explainable schema.
- Verification can be implemented without access to the workspace.

Negative:

- Wallet addresses and salts are still sensitive and must be shared carefully.
- Receipts expose prices to anyone who receives them.
- Schema changes require versioned parser support.
- A local reference looks like a hash but is not a transaction hash and must be labeled accordingly.
