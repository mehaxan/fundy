# ADR-0004: PostgreSQL on Railway as Primary Database

- **Status**: accepted
- **Date**: 2026-04-29
- **Decision revised**: Moved from Cloudflare D1 to Railway PostgreSQL
- **Deciders**: project founders

## Context

With the backend moving from Cloudflare Workers to Railway (see ADR-0003), Cloudflare D1 is no longer accessible — D1 is only available via the Workers `env` binding and has no stable external HTTP API suitable for production use from a Node.js process.

## Decision

Use **PostgreSQL 16** managed by Railway as the primary database. Railway provisions a PostgreSQL instance alongside the API service and injects a `DATABASE_URL` environment variable automatically.

ORM: **Drizzle ORM** with the `postgres` npm driver.

### Schema Overview

```
users           → id, email, password_hash, name, role, is_active, created_at
deposit_funds   → id, name, description, share_price, currency, status, created_by, created_at
shares          → id, fund_id, user_id, quantity, unit_price, status, purchased_at, confirmed_by
investments     → id, fund_id, name, description, invested_amount, return_amount, status, dates
wallets         → id, user_id, balance (integer cents)
wallet_txns     → id, wallet_id, type, direction, amount, status, source_type, source_id, notes, by, at
refresh_tokens  → id, user_id, token_hash, expires_at, revoked_at
```

## Consequences

**Positive:**

- Full SQL feature set: joins, window functions, CTEs, row-level locking (critical for atomic wallet updates).
- ACID-compliant — financial records require strong consistency.
- `DATABASE_URL` is standard; works with all PostgreSQL tooling.
- Drizzle-kit generates and applies versioned SQL migrations via `drizzle-kit migrate`.
- All amounts stored as **integers in cents** — no floating-point errors.
- Railway free tier: 1 GB storage; sufficient for a small friend group.

**Negative:**

- Requires connection pooling in production (handled by `postgres` library's built-in pool).
- Migrations are applied in CI/CD pipeline — must test locally first to avoid destructive mistakes.

## Alternatives Considered

| Alternative                  | Reason rejected                                                        |
| ---------------------------- | ---------------------------------------------------------------------- |
| Cloudflare D1                | Only accessible via Workers binding; incompatible with Railway Node.js |
| Neon (serverless PostgreSQL) | Extra provider; Railway PG simpler when already on Railway             |
| PlanetScale (MySQL)          | Different SQL dialect; not PostgreSQL                                  |
| SQLite on Railway volume     | Not suitable for concurrent writes in production                       |
