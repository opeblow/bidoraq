# 0002 - Commitment and reveal evidence

Status: Accepted

## Context

A supplier quotation must not be changeable after submission, but the award decision needs readable prices and document hashes. Simple timestamps and stored values do not prove that the later values match what was originally submitted.

## Decision

Each supplier seals price, document hash, and a one-time salt into a Keccak-256 commitment. The reveal step recomputes the commitment from user-entered fields and accepts the bid only when the values match.

## Consequences

Positive:

- Late or altered values fail verification.
- The document hash proves which file bytes were referenced without storing the file.
- The salt prevents trivial guessing of low-price commitments.
- Receipt verification can reproduce the winning commitment.

Negative:

- Suppliers must preserve reveal inputs.
- Lost salts prevent successful reveal.
- The browser implementation is not a zero-knowledge proof.
- Legal admissibility still depends on the surrounding process.
