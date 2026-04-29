# ADR-0006: In-Person Transaction Model

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

Fundy is designed for a small group of friends managing a shared fund. Integrating a payment gateway (Stripe, PayPal, bank API) adds:
- Regulatory and compliance overhead
- KYC/AML requirements
- Transaction fees
- Significant development complexity

For a trust-based friend group, real money moves in person (cash, bank transfer among friends).

## Decision

**All financial transactions are handled in-person.** The app only records and tracks transaction statuses — it does not move money.

### Transaction Lifecycle

```
PENDING → CONFIRMED → SETTLED
           ↓
         REJECTED
```

- A **member** can request a withdrawal (creates a `PENDING` wallet transaction).
- A **manager** records a deposit (creates a `PENDING` fund transaction).
- A **manager** or **admin** confirms/rejects transactions after in-person verification.
- Status changes trigger wallet balance recalculation.

### What the app does

- Record transaction amounts and types
- Track who requested and who confirmed
- Maintain running balances in wallets
- Distribute investment profits by share percentage
- Provide audit log for all status changes

### What the app does NOT do

- Move real money
- Connect to bank APIs
- Process cards or crypto

## Consequences

**Positive:**
- Zero regulatory requirements (not a financial institution).
- No payment processor fees.
- Works in any jurisdiction — no banking partnerships needed.
- Simpler codebase — no webhook handling, refund flows, or PCI compliance.
- Members must trust each other — appropriate for friend groups.

**Negative:**
- Requires trust between participants.
- Manager must be available to confirm transactions.
- No automated settlement — human bottleneck.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Stripe integration | Compliance overhead; fees; overkill for friends |
| Crypto smart contracts | High complexity; gas fees; UX barrier |
| Bank Open Banking API | Country-specific; complex OAuth flows |
