# ADR-0001: Monorepo with pnpm Workspaces

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

Fundy consists of two applications (API and web frontend) and shared TypeScript types. We need to decide how to organize the codebase — separate repos or a monorepo.

## Decision

Use a single Git repository (`git@github.com:mehaxan/fundy.git`) organized as a **pnpm workspace monorepo** with the following layout:

```
fundy/
├── apps/
│   ├── api/      # NestJS backend
│   └── web/      # Angular frontend
├── packages/
│   └── shared/   # Shared TS types
└── pnpm-workspace.yaml
```

## Consequences

**Positive:**

- Shared TypeScript types (e.g. `UserRole`, `FundStatus`) are imported directly without publishing to npm.
- Single PR covers changes across both apps — keeps API and frontend in sync.
- One CI pipeline, one place to run lint/format/type-check.
- Easier for open-source contributors to understand the full project.

**Negative:**

- `pnpm` required as package manager (not `npm` or `yarn`).
- Slightly more complex workspace configuration.
- Cloning the repo always downloads both apps.

## Alternatives Considered

| Alternative        | Reason rejected                                             |
| ------------------ | ----------------------------------------------------------- |
| Two separate repos | Cross-app type changes need two PRs; harder to keep in sync |
| Nx monorepo        | Added complexity; pnpm workspaces sufficient for two apps   |
| Turborepo          | Another layer of tooling; not needed at this scale          |
