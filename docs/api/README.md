# API Reference

Base URL (production): `https://api.fundy.workers.dev`
Base URL (local dev): `http://localhost:8787`

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

## Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — | Login with email + password |
| POST | `/auth/refresh` | cookie | Refresh access token |
| POST | `/auth/logout` | bearer | Logout (invalidate refresh token) |
| POST | `/auth/forgot-password` | — | Request password reset email |
| POST | `/auth/reset-password` | — | Set new password with reset token |

## Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | member+ | Get own profile |
| PATCH | `/users/me` | member+ | Update own profile |
| GET | `/admin/users` | admin | List all users |
| POST | `/admin/users/invite` | admin | Invite new member |
| PATCH | `/admin/users/:id/role` | admin | Update user role |
| DELETE | `/admin/users/:id` | admin | Deactivate user |

## Deposit Funds

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/funds` | member+ | List funds |
| POST | `/funds` | manager+ | Create fund |
| GET | `/funds/:id` | member+ | Fund detail |
| PATCH | `/funds/:id` | manager+ | Update fund |
| GET | `/funds/:id/members` | member+ | List members + shares |
| POST | `/funds/:id/shares` | manager+ | Record share purchase |
| PATCH | `/funds/:id/shares/:shareId` | manager+ | Confirm/reject share purchase |
| GET | `/funds/:id/transactions` | manager+ | Fund transaction list |

## Investments

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/funds/:fundId/investments` | member+ | List investments for fund |
| POST | `/funds/:fundId/investments` | manager+ | Create investment |
| GET | `/investments/:id` | member+ | Investment detail |
| PATCH | `/investments/:id` | manager+ | Update status / return amount |
| GET | `/investments/:id/distribution` | member+ | Profit distribution breakdown |

## Wallet

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/wallet` | member+ | My wallet balance |
| GET | `/wallet/transactions` | member+ | My transaction history |
| POST | `/wallet/withdrawals` | member+ | Request withdrawal |
| DELETE | `/wallet/withdrawals/:id` | member+ | Cancel pending withdrawal |
| GET | `/admin/wallets` | manager+ | All wallets overview |
| GET | `/admin/withdrawals` | manager+ | Pending withdrawals list |
| PATCH | `/admin/withdrawals/:id` | manager+ | Confirm or reject withdrawal |
| POST | `/admin/wallets/:userId/adjust` | admin | Manual balance adjustment |

## Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | member+ | Personal dashboard summary |
| GET | `/dashboard/manager-summary` | manager+ | Manager dashboard (pending actions) |

## Standard Response Format

```jsonc
// Success
{
  "data": { ... },
  "meta": { "page": 1, "total": 42 }   // pagination, where applicable
}

// Error
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "amount", "message": "must be positive" }]
}
```

## Pagination

List endpoints accept:
- `?page=1` (default: 1)
- `?limit=20` (default: 20, max: 100)

## Auth Roles

| Role | Code |
|---|---|
| Administrator | `admin` |
| Manager | `manager` |
| Member | `member` |

Notation in this doc: `member+` means member, manager, and admin. `manager+` means manager and admin. `admin` means admin only.
