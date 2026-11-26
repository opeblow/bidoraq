# Governance

This document explains how Bidoraq is maintained and how decisions are made.

## Roles

### Users

Users operate the application, report bugs, propose improvements, and share receipts for verification. Users do not need to be developers.

### Contributors

Contributors submit code, documentation, tests, design changes, screenshots, and issue triage. All contributors are expected to follow `CODE_OF_CONDUCT.md` and `CONTRIBUTING.md`.

### Maintainers

Maintainers review pull requests, merge changes, cut releases, manage repository settings, and enforce the code of conduct. Maintainers should keep decisions visible in issues, pull requests, and architecture decision records.

### Security reporters

Security reporters disclose vulnerabilities privately through the channel described in `SECURITY.md`. Security reports take priority over feature work.

## Decision making

1. Small, reversible changes can be proposed directly in a pull request.
2. Product direction changes should start with an issue describing the problem, options, and trade-offs.
3. Architecture changes should include an architecture decision record under `docs/adr/`.
4. Pull requests are approved on technical merit, evidence of testing, and alignment with the product thesis.
5. Maintainers merge changes when review concerns are resolved.
6. Disagreements should be resolved with written reasoning before merging.

## Release authority

A release is created from a tagged commit on `main` after the release workflow passes. Release notes are generated from repository history and should be reviewed for accuracy.

## Code of conduct enforcement

Code of conduct reports are handled privately and fairly. Maintainers may issue corrections, warnings, temporary bans, or permanent bans according to `CODE_OF_CONDUCT.md`.

## Changing this governance model

Changes to governance require a pull request that describes the reason for the change and its effect on contributors, maintainers, and users.
