# Fundy 🏦

**Open-source shared fund management platform for friends & groups.**

Manage shared investment pools — track deposits, investments, profit distributions, and personal wallets. All transactions are handled in-person; the app manages statuses and records.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 + Angular Material |
| Backend | NestJS 11 + Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| Storage | Cloudflare R2 |
| Cache | Cloudflare KV |
| CI/CD | GitHub Actions |

## Core Concepts

- **Deposit Fund**: Members buy shares (e.g. $1000/share). A manager records in-person deposits.
- **Investment Fund**: Managers allocate fund money into investments and record outcomes.
- **Profit Distribution**: When an investment completes, profits are split by share % and credited to wallets.
- **Wallet**: Each member has a wallet. They can request withdrawals (in-person, manager confirms).

## Roles

| Role | Permissions |
|---|---|
| `admin` | Full access, manage users and roles |
| `manager` | Record transactions, update statuses, create investments |
| `member` | View own data, request withdrawals |

## Project Structure

```
fundy/
├── apps/
│   ├── api/          # NestJS backend (Cloudflare Workers)
│   └── web/          # Angular 21 frontend (Cloudflare Pages)
├── packages/
│   └── shared/       # Shared TypeScript types
├── .github/
│   └── workflows/    # GitHub Actions CI/CD
└── package.json      # pnpm workspace root
```

## Getting Started

### Prerequisites
- Node.js >= 20
- pnpm >= 9
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) >= 3

```bash
npm install -g pnpm wrangler
```

### Install dependencies

```bash
pnpm install
```

### Environment setup

Copy `.env.example` files in each app and fill in your values.

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### Cloudflare Resources Setup

```bash
# Create D1 database
wrangler d1 create fundy-db

# Create R2 bucket
wrangler r2 bucket create fundy-storage

# Create KV namespace
wrangler kv:namespace create CACHE
```

Update the IDs returned above into `apps/api/wrangler.toml`.

### Database migrations

```bash
# Local
pnpm db:migrate

# Remote (production)
pnpm --filter api db:migrate:remote
```

### Development

```bash
# Start API (Workers local dev)
pnpm dev:api

# Start Angular dev server
pnpm dev:web
```

### Deploy

```bash
pnpm deploy:api   # Deploy to Cloudflare Workers
pnpm deploy:web   # Deploy to Cloudflare Pages
```

## GitHub Actions

Auto-deploy is configured for pushes/merges to `main`:
- `.github/workflows/deploy-api.yml` → Cloudflare Workers
- `.github/workflows/deploy-web.yml` → Cloudflare Pages

**Required GitHub Secrets:**
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Workers & Pages permissions
- `CLOUDFLARE_ACCOUNT_ID` — Your Cloudflare account ID
- `JWT_SECRET` — Secret for signing JWT tokens (min 32 chars)

## Documentation

| Doc | Description |
|---|---|
| [docs/adr/](docs/adr/README.md) | Architecture Decision Records (why we chose what we chose) |
| [docs/features/](docs/features/README.md) | Feature specs with user stories and acceptance criteria |
| [docs/api/](docs/api/README.md) | Full API endpoint reference |
| [CHANGELOG.md](CHANGELOG.md) | Release notes and progress tracking |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute, branch/commit conventions, ADR process |

## License

MIT
