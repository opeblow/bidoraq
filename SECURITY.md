# Security Policy

## Supported versions

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |

## Reporting a vulnerability

Do not open a public issue for a security vulnerability.

Use the repository's private vulnerability reporting channel under the Security tab, or contact a maintainer privately through GitHub. Include:

- affected version or commit;
- impact and severity;
- reproduction steps;
- proof of concept, if available;
- suggested remediation, if available.

Please allow maintainers time to investigate and prepare a fix before public disclosure.

## Scope

Security reports are welcome for:

- commitment or policy hash derivation errors;
- reveal verification bypasses;
- award rule bypasses or incorrect winner selection;
- receipt leakage beyond the documented fields;
- authorization or role confusion in the interface;
- cross-site scripting, injection, or unsafe rendering;
- dependency vulnerabilities that affect the built application;
- workflow or repository configuration weaknesses.

## Out of scope

The following are outside the project's security scope:

- private keys or seed phrases given to an untrusted party;
- compromised browser extensions or injected wallet providers;
- compromise of the user's local machine or browser profile;
- loss of exported JSON files after a user shares them;
- social engineering of operators;
- expected behavior of locally derived transaction reference hashes.

## Security principles

- No secrets, API keys, or credentials belong in the repository.
- Uploaded documents are hashed locally and are not persisted as files.
- Receipts are redacted evidence artifacts, not full bid packages.
- Wallet addresses must be treated as sensitive operational data.
- Security-sensitive logic should remain covered by domain tests.
- Dependencies and workflows should use pinned or reviewed versions where practical.

## Disclosure

Maintainers will acknowledge private reports, confirm impact, coordinate a fix, and credit reporters if they wish to be named. If a report is declined, maintainers will explain why.
