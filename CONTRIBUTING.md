# Contributing to Bidoraq

Thank you for helping improve Bidoraq. This project is open source and contributions are welcome from operators, engineers, designers, security researchers, and procurement practitioners.

## Ground rules

- Keep the application local-first and honest by default.
- Do not add seeded tenders, fabricated bids, sample awards, or demo clock controls.
- Do not log wallet addresses, secrets, or document contents.
- Do not introduce telemetry, analytics, or remote persistence without an explicit product decision and a privacy update.
- Preserve the Evidence Ledger design language: restrained typography, hairline structure, sharp corners, and no decorative gradients.
- Treat wallet addresses as potentially identifying information.

## Development setup

Requirements: Node.js 20 or newer and npm.

```bash
git clone <repository-url>
cd bidoraq
npm install
npm run dev
```

Open the local URL printed by Vite. The workspace starts empty. Create all records through the interface while testing.

## Branch and change workflow

1. Open an issue first for substantial changes so the approach can be agreed before implementation.
2. Create a focused branch from `main`, such as `fix/reveal-parsing` or `feat/receipt-schema`.
3. Keep commits small and explain why the change is needed.
4. Update tests and documentation when behavior changes.
5. Open a pull request with a clear problem statement, implementation summary, and verification notes.

Commit messages should be concise and imperative, for example:

```text
Fix kobo conversion in reveal verification
Add receipt schema validation
Document local storage behavior
```

## Quality gates

Run all commands before opening a pull request:

```bash
npm test
npm run typecheck
npm run build
```

If the change affects layout, navigation, or any page flow, update and run the screenshot gallery:

```bash
npm run build
npm run preview -- --port 4173
```

In a second terminal:

```bash
npm run screenshots
```

The screenshot script drives a full procurement workflow and fails on horizontal overflow or uncaught browser errors. Commit updated screenshots under `docs/screenshots/` when the UI changes.

## Pull request checklist

- The change solves one clear problem.
- No demo or hardcoded records were introduced.
- New behavior is covered by tests where practical.
- Typecheck, tests, and build pass locally.
- Screenshots are refreshed if the interface changed.
- Privacy or security implications are documented.
- Related issues are linked.

## Reporting bugs

Open a GitHub issue with reproduction steps, expected behavior, actual behavior, browser and Node versions, and any console output. Redact wallet addresses and document contents before pasting logs.

## Security

Do not report vulnerabilities in a public issue. Follow `SECURITY.md` and use the repository's private reporting channel.

## Code of conduct

Participation is governed by `CODE_OF_CONDUCT.md`. Be direct, respectful, and constructive.

## License

By contributing, you agree that your contributions are licensed under the MIT License in `LICENSE`.
