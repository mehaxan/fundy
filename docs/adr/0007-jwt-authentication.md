# ADR-0007: JWT-Based Authentication

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

Cloudflare Workers are stateless — no traditional session store. We need an authentication strategy compatible with this constraint.

## Decision

Use **JWT (JSON Web Tokens)** for authentication:
- Access token: short-lived (15 minutes), stored in memory (Angular service)
- Refresh token: long-lived (7 days), stored in `HttpOnly` cookie
- Tokens signed with `HS256` using a `JWT_SECRET` environment variable (min 32 chars)
- Refresh endpoint: `POST /auth/refresh`

**Token payload:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "manager",
  "iat": 1714000000,
  "exp": 1714000900
}
```

Cloudflare KV stores a **refresh token blocklist** for logout invalidation (TTL = 7 days).

## Consequences

**Positive:**
- Stateless — works natively on Cloudflare Workers.
- Access token in memory prevents XSS token theft.
- Refresh token in `HttpOnly` cookie is inaccessible to JavaScript (mitigates XSS).
- Role embedded in token — no database lookup on every request.
- KV blocklist handles logout without session store.

**Negative:**
- Access tokens cannot be immediately invalidated until they expire (15 min window).
- Refresh token rotation must be implemented carefully to prevent replay attacks.
- `JWT_SECRET` rotation requires re-login for all users.

## Security Measures

- CSRF protection via `SameSite=Strict` cookie attribute.
- `Authorization: Bearer <token>` for API requests.
- Angular HTTP interceptor auto-refreshes expired access tokens.
- Guard on every protected route in both Angular and NestJS.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Session cookies + KV | Requires KV lookup on every request; adds latency |
| Cloudflare Access | Great for internal tools; too opinionated for custom auth flows |
| Paseto | Less ecosystem support; same security properties as JWT |
