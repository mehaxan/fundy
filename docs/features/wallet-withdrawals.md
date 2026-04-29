# Feature: Wallet & Withdrawals

- **Status**: 🔲 Not started
- **Priority**: P1

## Overview

Every member has a wallet. Wallets are credited when investment profits are distributed. Members can request in-person withdrawals; managers confirm after handing over cash/transfer.

## User Stories

| ID     | As a…   | I want to…                             | So that…                            |
| ------ | ------- | -------------------------------------- | ----------------------------------- |
| WAL-01 | member  | view my wallet balance                 | I know how much I can withdraw      |
| WAL-02 | member  | see my full wallet transaction history | I can verify every credit and debit |
| WAL-03 | member  | request a withdrawal                   | I can get my money in person        |
| WAL-04 | manager | see all pending withdrawal requests    | I can plan in-person payouts        |
| WAL-05 | manager | confirm a withdrawal                   | the wallet balance is updated       |
| WAL-06 | manager | reject a withdrawal                    | it is cancelled with a note         |
| WAL-07 | admin   | view all member wallets                | I have an overview of all balances  |

## Wallet Transaction Types

| Type                | Direction | Created by                                    |
| ------------------- | --------- | --------------------------------------------- |
| `INVESTMENT_PROFIT` | Credit    | System (auto on investment complete)          |
| `INVESTMENT_LOSS`   | Debit     | System (auto on investment complete, if loss) |
| `WITHDRAWAL`        | Debit     | Member request                                |
| `MANUAL_CREDIT`     | Credit    | Admin (manual correction)                     |
| `MANUAL_DEBIT`      | Debit     | Admin (manual correction)                     |

## Acceptance Criteria

### WAL-01: Balance View

- Shows current balance, last updated timestamp
- Balance = sum of all `CONFIRMED` credit transactions − sum of all `CONFIRMED` debit transactions
- Pending transactions shown separately with "pending" label

### WAL-02: History

- Paginated list (20/page), newest first
- Columns: date, type, amount, status, notes, confirmed by
- Filterable by type and date range
- Exportable to CSV (future)

### WAL-03: Request Withdrawal

- Member specifies amount (must be ≤ available balance)
- Optional notes (e.g. "meet on Friday")
- Creates `PENDING` wallet transaction of type `WITHDRAWAL`
- Member can cancel a `PENDING` withdrawal

### WAL-04 / WAL-05 / WAL-06: Manager Actions

- Manager sees list of all `PENDING` withdrawals across all members
- Confirm: sets status to `CONFIRMED`; balance deducted
- Reject: sets status to `REJECTED` with required reason note; balance unchanged

### WAL-07: Admin Overview

- Table of all members: name, balance, pending withdrawals, total withdrawn

## API Endpoints

| Method | Path                            | Auth     | Description                  |
| ------ | ------------------------------- | -------- | ---------------------------- |
| GET    | `/wallet`                       | member+  | My wallet balance            |
| GET    | `/wallet/transactions`          | member+  | My transaction history       |
| POST   | `/wallet/withdrawals`           | member+  | Request withdrawal           |
| DELETE | `/wallet/withdrawals/:id`       | member+  | Cancel pending withdrawal    |
| GET    | `/admin/wallets`                | manager+ | All member wallets           |
| GET    | `/admin/withdrawals`            | manager+ | All pending withdrawals      |
| PATCH  | `/admin/withdrawals/:id`        | manager+ | Confirm or reject withdrawal |
| POST   | `/admin/wallets/:userId/adjust` | admin    | Manual balance adjustment    |

## Data Model

```sql
wallets: id, user_id, balance (integer cents), updated_at
wallet_transactions: id, wallet_id, type, amount, status, notes,
                     source_type, source_id, requested_by, confirmed_by,
                     confirmed_at, created_at
```
