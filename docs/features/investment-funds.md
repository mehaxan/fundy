# Feature: Investment Funds

- **Status**: 🔲 Not started
- **Priority**: P1

## Overview

Managers can allocate money from a deposit fund into an investment (e.g. buying property, a business stake, or any agreed venture). When the investment concludes, the manager records the return and the system distributes profits.

## User Stories

| ID     | As a…   | I want to…                                       | So that…                                       |
| ------ | ------- | ------------------------------------------------ | ---------------------------------------------- |
| INV-01 | manager | create an investment linked to a deposit fund    | we can track where fund money is deployed      |
| INV-02 | member  | see all investments for a fund                   | I know how my money is being used              |
| INV-03 | manager | update investment status                         | the record reflects reality                    |
| INV-04 | manager | record the return amount when done               | the system can calculate and distribute profit |
| INV-05 | member  | see my projected profit for an active investment | I know what to expect                          |

## Investment States

```
PLANNED → ACTIVE → COMPLETED
                 ↘ CANCELLED
```

| State       | Description                               |
| ----------- | ----------------------------------------- |
| `PLANNED`   | Approved but money not deployed yet       |
| `ACTIVE`    | Money deployed; investment ongoing        |
| `COMPLETED` | Return received; profit distributed       |
| `CANCELLED` | Did not proceed; capital returned to fund |

## Acceptance Criteria

### INV-01: Create Investment

- Fields: name, description, fund_id, invested_amount, expected_return (optional), start_date
- `invested_amount` must be ≤ available fund capital (total deposits − previous investments)
- Created in `PLANNED` state

### INV-02: Investment List

- Per-fund investment list sorted by start_date desc
- Shows: name, amount, status, return (if complete), profit %

### INV-03: Status Update

- Manager moves investment through states
- `ACTIVE`: records actual start date
- `COMPLETED`: requires `return_amount` input → triggers profit distribution
- `CANCELLED`: records cancellation notes

### INV-04: Profit Distribution (see also [profit-distribution.md](profit-distribution.md))

- Triggered automatically when status set to `COMPLETED`
- System calculates per-member profit based on share %
- Creates wallet credit transactions for each member
- All credits atomic (D1 transaction)

### INV-05: Projected Profit

- If `expected_return` is set on an `ACTIVE` investment, show each member their projected profit
- Clearly labeled as "projected" — not guaranteed

## API Endpoints

| Method | Path                            | Auth     | Description                       |
| ------ | ------------------------------- | -------- | --------------------------------- |
| GET    | `/funds/:fundId/investments`    | member+  | List investments                  |
| POST   | `/funds/:fundId/investments`    | manager+ | Create investment                 |
| GET    | `/investments/:id`              | member+  | Investment detail                 |
| PATCH  | `/investments/:id`              | manager+ | Update status / return amount     |
| GET    | `/investments/:id/distribution` | member+  | See profit distribution breakdown |

## Data Model

```sql
investments: id, fund_id, name, description, invested_amount, expected_return,
             return_amount, status, start_date, end_date, created_by, created_at, updated_at
```
