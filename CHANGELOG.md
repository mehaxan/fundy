# Changelog

All notable changes to Fundy are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions follow [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Project Setup
- Initialized pnpm workspace monorepo (`apps/api`, `apps/web`, `packages/shared`)
- Added Architecture Decision Records (ADRs 0001–0010)
- Added feature specification docs for all core features
- Configured `.gitignore`, `pnpm-workspace.yaml`, root `package.json`

### Planned for v0.1.0 (MVP)
- [ ] `@fundy/shared` — shared TypeScript types (users, funds, investments, wallet)
- [ ] API scaffold — NestJS + Cloudflare Workers adapter + Drizzle ORM
- [ ] Database schema + initial D1 migrations
- [ ] Auth module — login, refresh, logout, JWT guards
- [ ] Users module — list, invite, role management
- [ ] Deposit Funds module — CRUD + share purchase recording
- [ ] Investments module — CRUD + status transitions
- [ ] Wallet module — balance, history, withdrawal request/confirm
- [ ] Dashboard aggregation endpoint
- [ ] Angular 21 app scaffold (standalone components, Material, signals)
- [ ] Angular auth flow (login, guards, token refresh interceptor)
- [ ] Angular pages: dashboard, funds, fund detail, investments, wallet
- [ ] Angular admin pages: users, pending transactions
- [ ] Cloudflare wrangler.toml for Workers
- [ ] GitHub Actions: deploy-api.yml + deploy-web.yml

---

## [0.1.0] — TBD (MVP)

_Not yet released._

---

[Unreleased]: https://github.com/mehaxan/fundy/compare/HEAD
