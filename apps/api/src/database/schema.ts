import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "member"]);
export const fundStatusEnum = pgEnum("fund_status", [
  "draft",
  "active",
  "closed",
]);
export const shareStatusEnum = pgEnum("share_status", [
  "pending",
  "confirmed",
  "rejected",
]);
export const investmentStatusEnum = pgEnum("investment_status", [
  "planned",
  "active",
  "completed",
  "cancelled",
]);
export const walletTxnTypeEnum = pgEnum("wallet_txn_type", [
  "investment_profit",
  "investment_loss",
  "withdrawal",
  "manual_credit",
  "manual_debit",
]);
export const walletTxnDirectionEnum = pgEnum("wallet_txn_direction", [
  "credit",
  "debit",
]);
export const walletTxnStatusEnum = pgEnum("wallet_txn_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

// ─── Tables ───────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const depositFunds = pgTable("deposit_funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  sharePrice: integer("share_price").notNull(), // cents
  currency: text("currency").notNull().default("USD"),
  status: fundStatusEnum("status").notNull().default("draft"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => depositFunds.id),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // cents — snapshot at purchase time
  status: shareStatusEnum("status").notNull().default("pending"),
  purchasedAt: timestamp("purchased_at").notNull(),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  notes: text("notes"),
});

export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id")
    .notNull()
    .references(() => depositFunds.id),
  name: text("name").notNull(),
  description: text("description"),
  investedAmount: integer("invested_amount").notNull(), // cents
  expectedReturn: integer("expected_return"), // cents, optional
  returnAmount: integer("return_amount"), // cents, set on completion
  status: investmentStatusEnum("status").notNull().default("planned"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  notes: text("notes"),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id),
  balance: integer("balance").notNull().default(0), // cents, confirmed only
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id")
    .notNull()
    .references(() => wallets.id),
  type: walletTxnTypeEnum("type").notNull(),
  direction: walletTxnDirectionEnum("direction").notNull(),
  amount: integer("amount").notNull(), // cents, always positive
  status: walletTxnStatusEnum("status").notNull().default("pending"),
  sourceType: text("source_type"), // 'investment_distribution' | 'withdrawal_request' | 'manual'
  sourceId: uuid("source_id"),
  notes: text("notes"),
  requestedBy: uuid("requested_by")
    .notNull()
    .references(() => users.id),
  confirmedBy: uuid("confirmed_by").references(() => users.id),
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
