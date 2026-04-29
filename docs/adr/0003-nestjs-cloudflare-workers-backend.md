# ADR-0003: NestJS on Railway for Backend

- **Status**: accepted
- **Date**: 2026-04-29
- **Decision revised**: Moved from Cloudflare Workers to Railway
- **Deciders**: project founders

## Context

We need a backend API that is maintainable, well-structured, and cost-efficient. Cloudflare Workers was the initial target, but has significant blockers for NestJS:

- NestJS relies on Node.js reflection metadata (`reflect-metadata`) which conflicts with the Workers runtime.
- Workers ban most Node.js built-ins (`fs`, `net`, `crypto`) that NestJS dependencies use internally.
- NestJS + all dependencies approach the 10 MB compressed Worker bundle limit.
- Cloudflare D1 and R2 are only accessible via Worker `env` bindings — not from external HTTP clients.
- Local development diverges from production (`wrangler dev` vs `node`).

## Decision

Deploy **NestJS 11** as a standard Node.js application on **Railway**.

Railway provides managed Node.js runtime, managed PostgreSQL, automatic HTTPS, and zero-config deploys from GitHub. It is the simplest path to a production-grade NestJS API without managing infrastructure.

### Stack

| Component      | Technology                              |
| -------------- | --------------------------------------- |
| Runtime        | Node.js 20 on Railway                   |
| Framework      | NestJS 11                               |
| Database       | PostgreSQL 16 (Railway managed)         |
| ORM            | Drizzle ORM + drizzle-kit               |
| Object storage | Tigris (S3-compatible, fly.io)          |
| Auth           | JWT via `@nestjs/jwt` + `passport-jwt`  |
| Validation     | `class-validator` + `class-transformer` |

## Consequences

**Positive:**

- Standard Node.js — zero runtime quirks; every npm package works.
- PostgreSQL is more capable than D1 (full SQL, concurrency, indexing, row-level locking).
- Local dev is plain `nest start:dev` — no wrangler or adapter needed.
- Tigris accessed via standard AWS SDK v3 (S3-compatible) — widely documented.
- Railway auto-deploys from `main` via GitHub Actions.
- Free tier sufficient for a small friend group.

**Negative:**

- Railway has a cost after the free tier.
- API is not edge-distributed (single region); acceptable for a small group.
- Requires DATABASE_URL connection string management across environments.

## Alternatives Considered

| Alternative                 | Reason rejected                                                |
| --------------------------- | -------------------------------------------------------------- |
| Cloudflare Workers + NestJS | Runtime incompatibilities; bundle size; binding-only D1 access |
| Hono on Cloudflare Workers  | Loses NestJS DI/guards/interceptors structure                  |
| Fly.io                      | Similar to Railway; Railway has simpler DX                     |
| Render                      | Similar; Railway preferred for this use case                   |
