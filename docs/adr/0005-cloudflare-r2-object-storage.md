# ADR-0005: Tigris for Object Storage

- **Status**: accepted
- **Date**: 2026-04-29
- **Decision revised**: Moved from Cloudflare R2 to Tigris
- **Deciders**: project founders

## Context

With the backend on Railway (Node.js), we need S3-compatible object storage accessible via HTTP from any environment. Cloudflare R2 is only accessible via Workers `env` bindings in production — using it from a Railway Node.js service requires public bucket exposure or a custom domain proxy, adding complexity.

The app needs to store:
- Transaction receipt photos (uploaded by managers)
- Fund documents (optional)
- User avatars

## Decision

Use **Tigris** (fly.io global object storage) for object storage. Tigris is:
- Globally distributed S3-compatible object storage
- Accessible via the standard AWS SDK v3 (`@aws-sdk/client-s3`)
- Free tier: 5 GB storage, 10,000 PUT/month, 100,000 GET/month
- No egress fees within the Fly.io/Tigris network

### Configuration

Tigris provides standard S3 credentials:
```
AWS_ACCESS_KEY_ID=<tigris-key>
AWS_SECRET_ACCESS_KEY=<tigris-secret>
AWS_ENDPOINT_URL=https://fly.storage.tigris.dev
AWS_REGION=auto
TIGRIS_BUCKET=fundy-storage
```

### Path Convention

```
receipts/{transaction_id}/{filename}
documents/{fund_id}/{filename}
avatars/{user_id}/{filename}
```

Presigned URLs for private file access (expiry: 1 hour).

## Consequences

**Positive:**
- Standard AWS SDK v3 — same code works locally and in production.
- No egress fees within Tigris network.
- Globally distributed — low latency for file reads anywhere.
- Free tier sufficient for a small friend group.
- Presigned URLs keep files private without a proxy.
- No Cloudflare dependency for storage.

**Negative:**
- Free tier limits may require monitoring as usage grows.
- Tigris is newer than AWS S3 — smaller community documentation.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Cloudflare R2 | Workers-binding-only access in prod; needs proxy for Railway |
| AWS S3 | Egress fees; overkill for a friend group app |
| Supabase Storage | Adds another vendor; Tigris simpler with S3 SDK |
| Store files in PostgreSQL | Poor performance; DB not designed for binary blobs |
