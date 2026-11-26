# Support

Use the right channel so issues can be resolved quickly.

## Questions and product discussion

Open a GitHub Discussion or issue for questions about the product model, workflow, or documentation. Include the version or commit and the step where the question arose.

## Bug reports

Open a GitHub issue using the bug report template. Include:

- expected behavior;
- actual behavior;
- reproduction steps;
- browser and Node versions;
- console output or screenshots when useful;
- redacted records, never private keys or unreviewed confidential documents.

## Feature requests

Open a GitHub issue using the feature request template. Explain the problem before proposing the solution.

## Security vulnerabilities

Do not open a public issue. Follow `SECURITY.md` and use the repository's private vulnerability reporting channel.

## Documentation gaps

Open an issue or pull request for unclear documentation. Documentation changes are welcome and are checked by `npm run check:links`.

## Response expectations

This project is maintained on a best-effort basis. There is no guaranteed response time or service-level agreement. Security reports and build-breaking issues receive priority.

## Before asking

Run the quality gates and confirm the issue still happens:

```bash
npm test
npm run typecheck
npm run check:links
npm run build
```

If the issue involves the interface, regenerate the screenshot flow with `npm run screenshots` after starting the preview server on port `4173`.
