# Contributing to Fundy

Thank you for your interest in contributing!

## Development Workflow

1. **Fork** the repository and create a branch from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Install dependencies:**

   ```bash
   pnpm install
   ```

3. **Make changes** following the conventions below.

4. **Run checks locally** before pushing:

   ```bash
   pnpm lint
   pnpm --filter api type-check
   pnpm --filter web build
   ```

5. **Open a Pull Request** targeting `main`. Fill in the PR template.

## Conventions

### Branch Naming

- `feat/<name>` — new feature
- `fix/<name>` — bug fix
- `docs/<name>` — documentation only
- `refactor/<name>` — code change without behavior change
- `chore/<name>` — tooling, deps, config

### Commit Messages (Conventional Commits)

```
feat(wallet): add withdrawal request endpoint
fix(auth): correct refresh token expiry header
docs(adr): add ADR-0011 for email provider
```

### Code Style

- TypeScript strict mode — no `any`
- Prettier formats automatically on commit (configured in `.prettierrc`)
- NestJS: keep controllers thin; business logic in services
- Angular: prefer signals over `BehaviorSubject`; standalone components only

## Architecture Decisions

If your contribution involves a significant architectural decision, **create an ADR** first:

1. Copy `docs/adr/0001-monorepo-pnpm-workspaces.md` as a template.
2. Number it sequentially (`0011-...`).
3. Set status to `proposed`.
4. Open a PR for discussion before implementing.
5. Update `docs/adr/README.md` index.

## Adding a Feature

1. Check `docs/features/README.md` to see if the feature is already specced.
2. If not, create `docs/features/<feature-name>.md` with user stories and acceptance criteria.
3. Update `docs/features/README.md` status to 🔄 when you start.
4. Update status to 🧪 when PR is open for review.
5. Update status to ✅ after merge.

## Tracking Progress

The `CHANGELOG.md` at the repo root tracks what has been completed. Add an entry under `[Unreleased]` when your PR is merged.
