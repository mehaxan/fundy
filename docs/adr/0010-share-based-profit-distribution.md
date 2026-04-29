# ADR-0010: Share-Based Profit Distribution Model

- **Status**: accepted
- **Date**: 2026-04-29
- **Deciders**: project founders

## Context

When an investment completes with a profit, the fund needs to distribute returns to members proportional to their ownership. We must define the distribution model precisely to ensure fairness and auditability.

## Decision

### Share Purchase

- Each **deposit fund** has a fixed **share price** (e.g. $1,000/share or any custom amount).
- Members may purchase any integer number of shares.
- Total shares outstanding = sum of all members' shares for that fund.

### Share Percentage

$$\text{member\_share\_pct} = \frac{\text{member\_shares}}{\text{total\_fund\_shares}} \times 100$$

### Profit Distribution

When a manager marks an investment as `COMPLETED` and enters the `return_amount`:

$$\text{profit} = \text{return\_amount} - \text{invested\_amount}$$

$$\text{member\_profit} = \text{profit} \times \frac{\text{member\_shares}}{\text{total\_fund\_shares}}$$

The system:
1. Calculates each member's profit amount.
2. Creates a `CREDIT` wallet transaction for each member (status: `CONFIRMED`).
3. Updates each member's wallet balance.
4. Records the distributing manager and timestamp.

### Example

| Member | Shares | % |
|---|---|---|
| Alice | 3 | 60% |
| Bob | 2 | 40% |

Investment: $5,000 in → $6,500 out → $1,500 profit

| Member | Profit credited |
|---|---|
| Alice | $900 (60%) |
| Bob | $600 (40%) |

### Loss Handling

If `return_amount < invested_amount`, the loss is recorded as a negative wallet adjustment distributed the same way. Wallet balances can go negative (debt tracking).

## Consequences

**Positive:**
- Simple, auditable, and mathematically transparent.
- Stored as integers (cents) to avoid floating-point errors.
- Every distribution is a traceable set of wallet transactions.
- Members can verify their share percentage at any time.

**Negative:**
- Rounding of cents is possible — remainder (dust) credited to the largest shareholder.
- No time-weighted returns — members who join mid-fund after first investment round get the same % going forward (by new share count).
- Loss handling (negative balance) requires UI clarity to avoid confusion.

## Implementation Notes

- All amounts stored as **integers in the smallest currency unit** (cents for USD).
- Distribution is atomic: all wallet credits succeed or all roll back (D1 transaction).
- Distribution audit log stored in `wallet_transactions` with `source_type: 'investment_distribution'` and `source_id: investment_id`.

## Alternatives Considered

| Alternative | Reason rejected |
|---|---|
| Time-weighted returns | Complex; excessive for a friend group |
| Equal split regardless of shares | Ignores different contribution levels |
| Manager-defined manual splits | Prone to error and disputes |
