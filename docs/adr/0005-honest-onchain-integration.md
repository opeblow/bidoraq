# 0005 - Honest X Layer TapeOut integration

Status: Accepted

## Context

The X Layer TapeOut Accelerate hackathon rewards real ecosystem integration. Bidoraq's eligibility logic is currently a local six-NAND simulation. Publishing a fabricated processor address, circuit ID, or transaction hash would make the product look integrated while producing false evidence.

Research established a real ABI:

```text
function eval(uint256, bytes) view returns (bytes)
```

Input bits are packed LSB-first into a byte, and the result is the first bit of the returned bytes. A public processor exists on X Layer mainnet at `0xA93E807fAB41431827EBBa57443Fb687a95E2AA3`, but it belongs to a documented 320-input circuit, not Bidoraq's four-bit circuit.

## Decision

Bidoraq reports three tiers:

| Tier | Behavior |
| --- | --- |
| A | A configured real Bidoraq processor and circuit ID are called with `eval(uint256,bytes)` and the verdict is stored in the receipt. |
| B | Reserved for a real processor that cannot yet be reproduced; the UI reports `unavailable`. |
| C | Default. Public RPCs provide chain ID, latest block, RPC endpoint, and public processor bytecode. This is clearly labeled as chain facts only, not an eligibility proof. |

The app never invents identifiers. It reads `VITE_TAPEOUT_PROCESSOR` and `VITE_TAPEOUT_CIRCUIT_ID` from deployment configuration, and when they are absent the local simulation is labeled “Circuit not yet taped out — local simulation”.

## Consequences

Positive:

- Live X Layer integration works without a wallet or signed transaction.
- Judges can verify chain ID `196`, real block height, and real bytecode.
- No fake processor, circuit, or transaction is presented as evidence.
- A real tape-out can be added later through configuration alone.

Negative:

- Tier C cannot prove eligibility.
- Tier A remains blocked on a user-controlled wallet, OKB, and a signed tape-out action.
- DeWEB publishing also requires wallet signatures and a circuit NFT container, so it is reported as blocked rather than silently skipped.
