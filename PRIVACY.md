# Privacy Policy

Last updated: 2026-11-25

Bidoraq is a local-first application. This policy explains what the browser application stores, what it does not collect, and what is included when a user exports data.

## What the application stores

The application stores workspace records in browser `localStorage` under the key `bidoraq:workspace:v2`. This can include:

- selected role and operator profile details;
- manually entered wallet addresses or addresses exposed by an injected wallet provider;
- tender briefs, deadlines, rules, and invited wallet addresses;
- commitment hashes, reveal salts, prices, and document hashes;
- reviewer attestations and eligibility traces;
- award records, transaction references, and audit entries.

Uploaded document bytes are hashed in the browser. The original file bytes are not written to the workspace ledger.

## What the application does not collect

Bidoraq does not operate an application server, account system, analytics service, tracking pixel, advertising network, or remote database. It does not submit on-chain transactions and does not hold funds.

The application does not collect private keys, seed phrases, signatures, or provider secrets.

## Wallet interaction

The Connect Wallet control may request an account from an injected EIP-1193 provider. A wallet address can be identifying information, so treat exported ledgers and receipts accordingly. Manual address entry does not connect to a wallet or request a signature.

## Exports and receipts

Settings can export the local audit ledger and finalized receipts as JSON files. These files stay on the user's device unless the user shares them.

A receipt intentionally includes the tender policy, policy hash, wallet addresses, commitment values, prices, document hashes, salts, eligibility outcomes, award reference, approver address, and approval time. It omits supplier display names and uploaded document contents. Because salts and addresses are included for verification, share receipts only with parties that are entitled to see that evidence.

## Screenshot automation

The screenshot script launches a temporary Chromium profile, clears local storage, and creates deterministic test records through the interface. Screenshots are written to `docs/screenshots/`. The script does not upload data.

## GitHub workflows

Continuous integration installs dependencies and runs tests, typechecking, and builds. The screenshot workflow builds the application, captures the gallery, and uploads the generated images as a workflow artifact. CodeQL scans source code for security issues. No workspace `localStorage` data is sent to GitHub by these workflows.

## Clearing data

Use Settings to clear the workspace. Clearing browser site data for the application origin also removes the stored workspace.

## Third-party code

Dependencies and their licenses are resolved through npm. The project does not bundle third-party tracking scripts.

## Changes to this policy

Changes to this policy will be committed to the repository with the rest of the project history. Material changes should be called out in the pull request and release notes.
