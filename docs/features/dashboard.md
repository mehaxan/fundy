# Feature: Dashboard

- **Status**: 🔲 Not started
- **Priority**: P1

## Overview

The dashboard is the landing page after login. It gives each user a quick summary of their financial position and recent activity.

## User Stories

| ID      | As a…   | I want to…                                | So that…                              |
| ------- | ------- | ----------------------------------------- | ------------------------------------- |
| DASH-01 | member  | see my total wallet balance on login      | I know my position at a glance        |
| DASH-02 | member  | see my total share value across all funds | I understand my total investment      |
| DASH-03 | member  | see recent transactions (last 5)          | I can quickly verify activity         |
| DASH-04 | member  | see active investments I am part of       | I know what's happening with my money |
| DASH-05 | manager | see a summary of all pending actions      | I know what needs my attention        |

## Manager Dashboard Additions

When the logged-in user is `manager` or `admin`, the dashboard additionally shows:

- **Pending actions counter**: pending deposits + pending withdrawals
- **Active investments**: count + total deployed capital
- **Quick action buttons**: "Record deposit", "Confirm withdrawal"

## Admin Dashboard Additions

- **All members**: count, total balances
- **System health**: total fund capital, total invested, total distributed

## Widget Specs

### My Wallet Balance

- Large number showing balance in local currency
- Trend: change since last month (green/red)

### My Funds

- Card per fund: name, shares held, share %, current value (shares × share_price)

### Recent Activity

- Last 5 wallet transactions (type, amount, date, status)
- Link to full history

### Active Investments

- Fund name, investment name, amount, status, expected close date

## API Endpoints

| Method | Path                         | Auth     | Description                       |
| ------ | ---------------------------- | -------- | --------------------------------- |
| GET    | `/dashboard/summary`         | member+  | Personalized dashboard data       |
| GET    | `/dashboard/manager-summary` | manager+ | Pending actions + system overview |

## Notes

- Dashboard data is a single aggregated endpoint (not multiple calls) for performance.
- Cloudflare KV caches manager summary for 30 seconds (invalidated on any write).
