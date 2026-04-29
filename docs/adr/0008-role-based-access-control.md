# ADR-0008: Role-Based Access Control (RBAC)

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

Fundy has different classes of users with different permissions. We need a simple, auditable access control model.

## Decision

Use a flat **RBAC** model with three roles stored in the `users.role` column and embedded in the JWT payload:

| Role          | Code      | Description                                                   |
| ------------- | --------- | ------------------------------------------------------------- |
| Administrator | `admin`   | Full access; manage users, roles, all funds                   |
| Manager       | `manager` | Record and confirm transactions; create investments and funds |
| Member        | `member`  | View own data; request withdrawals                            |

### Permission Matrix

| Action                         | member | manager | admin |
| ------------------------------ | :----: | :-----: | :---: |
| View own wallet & transactions |   ✓    |    ✓    |   ✓   |
| View fund list                 |   ✓    |    ✓    |   ✓   |
| View fund detail & members     |   ✓    |    ✓    |   ✓   |
| Request withdrawal             |   ✓    |    ✓    |   ✓   |
| Record deposit/investment      |   ✗    |    ✓    |   ✓   |
| Confirm/reject transactions    |   ✗    |    ✓    |   ✓   |
| Create/close deposit fund      |   ✗    |    ✓    |   ✓   |
| Create/close investment        |   ✗    |    ✓    |   ✓   |
| Manage users & roles           |   ✗    |    ✗    |   ✓   |
| View all wallets               |   ✗    |    ✓    |   ✓   |
| System configuration           |   ✗    |    ✗    |   ✓   |

### Implementation

- NestJS: `@Roles()` decorator + `RolesGuard` checks JWT `role` claim.
- Angular: `AuthGuard` on routes + `*hasRole` structural directive hides UI elements.

## Consequences

**Positive:**

- Simple — three roles cover all use cases for a friend group.
- Role in JWT means no database hit per request.
- Easy to extend with more granular permissions if needed.

**Negative:**

- Flat RBAC; no per-fund role assignment (e.g. "manager of fund X only").
- Role changes require re-login (new JWT issued at next login).

## Future Consideration

If Fundy grows to support multiple independent friend groups, consider adding a `fund_managers` join table for per-fund role assignment (ADR-0008b when needed).

## Alternatives Considered

| Alternative            | Reason rejected                       |
| ---------------------- | ------------------------------------- |
| ABAC (attribute-based) | Overkill for three user types         |
| Per-fund roles         | Not needed at current scope; deferred |
| ACL lists              | Over-engineered for this use case     |
