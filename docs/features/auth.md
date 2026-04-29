# Feature: Authentication

- **Status**: 🔲 Not started
- **Priority**: P0 — Prerequisite for all other features

## Overview

Members log in with email + password. The system issues JWTs for API access. Admins can invite new members.

## User Stories

| ID      | As a…   | I want to…                   | So that…                                   |
| ------- | ------- | ---------------------------- | ------------------------------------------ |
| AUTH-01 | visitor | log in with email + password | I can access my fund data                  |
| AUTH-02 | member  | my session auto-refreshes    | I don't get logged out while using the app |
| AUTH-03 | member  | log out                      | my session is invalidated on all devices   |
| AUTH-04 | admin   | invite a new member by email | they can register an account               |
| AUTH-05 | member  | reset my password via email  | I can regain access if I forget it         |

## Acceptance Criteria

### AUTH-01: Login

- Email + password form with validation
- Returns `access_token` (15 min) and sets `refresh_token` cookie (7 days, HttpOnly)
- Wrong credentials: 401 with generic message (no user enumeration)
- Account locked after 5 failed attempts for 15 minutes

### AUTH-02: Token Refresh

- Angular interceptor automatically calls `POST /auth/refresh` on 401
- Refreshed access token replaces old one in memory
- If refresh token is invalid/expired, redirect to login

### AUTH-03: Logout

- `POST /auth/logout` blocks refresh token in KV
- Clears cookie
- Angular clears in-memory access token and redirects to login

### AUTH-04: Invite

- Admin sends invite via `POST /admin/users/invite`
- System creates a pending user record with one-time token (24 hr expiry)
- Invitee receives email with registration link
- On registration: sets name + password, activates account

### AUTH-05: Password Reset

- `POST /auth/forgot-password` sends reset email (rate-limited: 3/hour)
- Reset token valid for 1 hour, single-use
- New password must be min 8 chars, bcrypt hashed (cost 12)

## API Endpoints

| Method | Path                    | Auth   | Description            |
| ------ | ----------------------- | ------ | ---------------------- |
| POST   | `/auth/login`           | none   | Login                  |
| POST   | `/auth/refresh`         | cookie | Refresh access token   |
| POST   | `/auth/logout`          | bearer | Logout                 |
| POST   | `/auth/forgot-password` | none   | Request password reset |
| POST   | `/auth/reset-password`  | none   | Submit new password    |

## Security Notes

- Passwords hashed with `bcrypt` (cost factor 12)
- No password hint or visible validation detail on failure
- All auth endpoints rate-limited at Cloudflare WAF level
- `Secure`, `HttpOnly`, `SameSite=Strict` on refresh cookie
