# 0001 - Local-first workspace

Status: Accepted

## Context

Bidoraq needs to demonstrate a complete procurement evidence workflow without depending on a backend service, account system, or database. A hosted multi-user service would introduce identity, authorization, synchronization, and infrastructure concerns that would obscure the evidence model.

## Decision

The workspace is stored in browser `localStorage` under `bidoraq:workspace:v3`. Version 2 records migrate on load. All records are created through interface actions. Uploaded document bytes are hashed locally and are not persisted. Exports are explicit user actions.

## Consequences

Positive:

- The application can be run and inspected immediately.
- There is no server-side state to trust or reconcile.
- Every visible record comes from a user action.
- Privacy behavior is easy to explain.

Negative:

- There is no built-in multi-user synchronization.
- Browser storage can be cleared by the user.
- Production access control must be added outside this core.
- Storage migration needs explicit version handling.
