# 0003 - Six-NAND eligibility circuit

Status: Accepted

## Context

Eligibility decisions need to be deterministic and explainable. A simple boolean flag would hide how the reviewer reached the result and would make every decision look identical.

## Decision

Reviewers attest four evidence bits, and a six-gate NAND circuit computes eligibility. The full trace of gate inputs and outputs is stored with the result. Bit D defaults to false so unreviewed bids do not pass.

## Consequences

Positive:

- The decision path is visible and testable.
- All sixteen input vectors can be verified in tests.
- The processor identity and circuit identifier are recorded.
- Missing review cannot silently produce eligibility.

Negative:

- The circuit intentionally simplifies real procurement compliance.
- Reviewers still control the truthfulness of input bits.
- More complex policies require a new circuit version.
