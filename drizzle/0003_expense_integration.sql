-- Add 'expense' to the transaction type enum
ALTER TYPE txn_type ADD VALUE IF NOT EXISTS 'expense';

-- Add total_expenses column to monthly_snapshots for tracking approved expenses per period
ALTER TABLE monthly_snapshots ADD COLUMN IF NOT EXISTS total_expenses integer NOT NULL DEFAULT 0;
