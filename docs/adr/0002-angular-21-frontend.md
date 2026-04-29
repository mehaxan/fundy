# ADR-0002: Angular 21 for Frontend

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

We need a frontend framework for a data-heavy financial management application with forms, tables, real-time status updates, and role-gated views. The app targets desktop and mobile browsers.

## Decision

Use **Angular 21** as the frontend framework with:
- Angular Material for UI components
- Angular Signals for reactive state management
- Standalone components (no `NgModule`)
- `@angular/router` with lazy-loaded feature routes
- Deployed to **Railway** (static files served by `serve` / nginx); DNS managed via Cloudflare

## Consequences

**Positive:**
- Angular's opinionated structure accelerates team onboarding.
- Built-in form validation (Reactive Forms) suits financial input requirements.
- Angular Material provides accessible, production-ready UI components (tables, dialogs, datepickers).
- Signals (stable in v17+) provide fine-grained reactivity without NgRx boilerplate.
- Everything on Railway — single platform to manage; no split between Cloudflare Pages and Railway.
- Cloudflare DNS provides CDN, DDoS protection, and custom domain without hosting on Cloudflare.
- Strong TypeScript integration — aligns with shared types from `@fundy/shared`.

**Negative:**
- Larger initial learning curve compared to Vue or Svelte.
- Bundle size larger than lighter frameworks.
- Angular 21 is cutting-edge; some community plugins may lag.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| React (Next.js) | Less opinionated; forms and tables require more third-party libs |
| Vue 3 + Nuxt | Smaller ecosystem for enterprise-grade financial UIs |
| SvelteKit | Great DX but immature component ecosystem for this use case |
