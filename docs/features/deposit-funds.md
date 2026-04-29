# Feature: Deposit Funds

- **Status**: 🔲 Not started
- **Priority**: P0 — Core concept

## Overview

A deposit fund is the shared pool that members contribute to by purchasing shares. Managers create and close funds. Members can see fund details including total value, their share percentage, and all transactions.

## User Stories

| ID | As a… | I want to… | So that… |
|---|---|---|---|
| FUND-01 | manager | create a new deposit fund | members can start purchasing shares |
| FUND-02 | member | view the list of active funds | I know which funds I can join |
| FUND-03 | member | view fund details | I see total value, members, and my share % |
| FUND-04 | manager | record a member's share purchase (in-person) | the system reflects the real deposit |
| FUND-05 | manager | close a fund | no new shares can be purchased |
| FUND-06 | manager | view all funds including historical/closed ones | I have a full record |

## Fund States

```
DRAFT → ACTIVE → CLOSED
```

| State | Description |
|---|---|
| `DRAFT` | Created but not yet open for deposits |
| `ACTIVE` | Open for share purchases |
| `CLOSED` | No more share purchases; still tracks investments |

## Acceptance Criteria

### FUND-01: Create Fund
- Fields: name, description, share price (in cents), currency, start date
- Fund created in `DRAFT` state; manager explicitly activates it
- Share price is immutable once fund is `ACTIVE`

### FUND-02: Fund List
- Shows: name, status badge, share price, total shares sold, total value
- Filterable by status (active/closed)
- Members see only funds they have shares in + all active funds

### FUND-03: Fund Detail
- Total capital raised = share_price × total_shares
- Member share % = member_shares / total_shares × 100
- Transaction history tab (all deposits for this fund)
- Investments tab (list of investments made from this fund)

### FUND-04: Record Share Purchase
- Manager enters: member, number of shares, date of in-person payment
- Creates a `PENDING` transaction record
- Manager (or another manager) confirms → transaction `CONFIRMED`
- System updates share count; wallet not affected (shares ≠ wallet balance)

### FUND-05: Close Fund
- Only admin or fund creator can close
- Sets status to `CLOSED`; no new share purchases allowed
- Existing shares and investments continue

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/funds` | member+ | List funds |
| POST | `/funds` | manager+ | Create fund |
| GET | `/funds/:id` | member+ | Fund detail |
| PATCH | `/funds/:id` | manager+ | Update fund (name, status) |
| GET | `/funds/:id/members` | member+ | List fund members + shares |
| POST | `/funds/:id/shares` | manager+ | Record share purchase |
| GET | `/funds/:id/transactions` | manager+ | Fund transaction history |

## Data Model

```sql
deposit_funds: id, name, description, share_price, currency, status, created_by, created_at, closed_at
shares: id, fund_id, user_id, quantity, unit_price, purchased_at, confirmed_by, confirmed_at
```
