# ADR-0009: GitHub Actions for CI/CD

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

We need automated deployment when code is merged to `main`. The project is hosted on GitHub.

## Decision

Use **GitHub Actions** with two separate workflows, both deploying to **Railway** via the Railway CLI:

| Workflow | Trigger | Action |
|---|---|---|
| `deploy-api.yml` | Push/merge to `main` (paths: `apps/api/**`, `packages/shared/**`) | Build NestJS → run DB migrations → deploy to Railway |
| `deploy-web.yml` | Push/merge to `main` (paths: `apps/web/**`, `packages/shared/**`) | Build Angular → deploy static files to Railway |

Both workflows also run on PRs (build + lint only, no deploy) for pre-merge validation.

DNS is managed on Cloudflare — no Cloudflare deployment tooling needed.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `RAILWAY_TOKEN` | Railway API token (from Railway account settings) |
| `RAILWAY_API_SERVICE_ID` | Railway service ID for the API service |
| `RAILWAY_WEB_SERVICE_ID` | Railway service ID for the web service |
| `JWT_SECRET` | Production JWT signing secret |

### Pipeline Steps

**API (`deploy-api.yml`):**
1. `pnpm install`
2. Type-check `@fundy/shared` + `api` packages
3. `pnpm --filter api build` (compiles TypeScript)
4. Run Drizzle migrations against production DB (`drizzle-kit migrate`)
5. Deploy to Railway via `railway up --service $RAILWAY_API_SERVICE_ID`

**Web (`deploy-web.yml`):**
1. `pnpm install`
2. `pnpm --filter web build` (`ng build --configuration=production`)
3. Deploy `dist/` to Railway static service via `railway up --service $RAILWAY_WEB_SERVICE_ID`

## Consequences

**Positive:**
- Free for public open-source repositories.
- Native GitHub integration — triggered on PR and push.
- Path filters prevent unnecessary deployments.
- Single platform (Railway) for both services — one dashboard, one billing account.
- Cloudflare DNS provides CDN, HTTPS, and DDoS protection without Cloudflare hosting.
- Railway CLI is simple; no platform-specific adapters needed.

**Negative:**
- Secrets must be configured manually per repository.
- Railway service IDs must be obtained after initial Railway project setup.
- DB migration step in CI is irreversible — must be tested locally first.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Railway auto-deploy from GitHub (built-in) | Less control; can't run migrations before deploy |
| Cloudflare Pages for web | Added complexity; decided to keep everything on Railway |
| CircleCI / Travis | Extra account/config; GitHub Actions is already available |
| Manual `railway up` | Error-prone; not repeatable |
