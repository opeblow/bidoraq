# 0004 - Redacted receipts

Status: Accepted

## Context

An audit artifact must prove the rule and outcome, but publishing full bid packages would expose supplier identities and confidential documents.

## Decision

Receipts include policy fields, hashes, wallet addresses, prices, salts, eligibility outcomes, ranked bid commitments, and award metadata. They omit supplier display names and document contents.

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
