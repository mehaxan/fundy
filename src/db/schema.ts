import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────
export const roleEnum = pgEnum("role", ["admin", "member"]);
export const fundStatusEnum = pgEnum("fund_status", ["active", "closed", "paused"]);
export const shareStatusEnum = pgEnum("share_status", ["pending", "approved", "rejected"]);
export const investmentStatusEnum = pgEnum("investment_status", [
  "planned", "active", "completed", "cancelled",
]);
export const assetStatusEnum = pgEnum("asset_status", [
  "active", "disposed", "under_maintenance",
]);
export const meetingStatusEnum = pgEnum("meeting_status", [
  "scheduled", "completed", "cancelled",
]);
export const meetingTypeEnum = pgEnum("meeting_type", [
  "general", "emergency", "annual", "special",
]);
export const voteStatusEnum = pgEnum("vote_status", ["draft", "open", "closed"]);
export const fineStatusEnum = pgEnum("fine_status", ["pending", "paid", "waived"]);
export const txnTypeEnum = pgEnum("txn_type", [
  "deposit", "withdrawal", "fine", "dividend", "investment_return", "manual",
]);
export const txnStatusEnum = pgEnum("txn_status", ["pending", "completed", "cancelled"]);

// ─── Users ───────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("member"),
  isActive: boolean("is_active").notNull().default(true),
  address: text("address"),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Wallets ─────────────────────────────────────────────────────────────────
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => users.id),
  balance: integer("balance").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Wallet Transactions ─────────────────────────────────────────────────────
export const walletTransactions = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletId: uuid("wallet_id").notNull().references(() => wallets.id),
  type: txnTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  direction: text("direction", { enum: ["credit", "debit"] }).notNull(),
  description: text("description").notNull(),
  status: txnStatusEnum("status").notNull().default("completed"),
  referenceId: text("reference_id"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Funds ───────────────────────────────────────────────────────────────────
export const funds = pgTable("funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  sharePrice: integer("share_price").notNull(),
  status: fundStatusEnum("status").notNull().default("active"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

// ─── Shares ──────────────────────────────────────────────────────────────────
export const shares = pgTable("shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => funds.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: shareStatusEnum("status").notNull().default("pending"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  processedBy: uuid("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  notes: text("notes"),
});

// ─── Investments ─────────────────────────────────────────────────────────────
export const investments = pgTable("investments", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull().default("general"),
  investedAmount: integer("invested_amount").notNull(),
  expectedReturn: integer("expected_return"),
  actualReturn: integer("actual_return"),
  status: investmentStatusEnum("status").notNull().default("planned"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  fundId: uuid("fund_id").references(() => funds.id),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Assets ──────────────────────────────────────────────────────────────────
export const assets = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  purchaseValue: integer("purchase_value").notNull(),
  currentValue: integer("current_value").notNull(),
  purchaseDate: timestamp("purchase_date").notNull(),
  location: text("location"),
  status: assetStatusEnum("status").notNull().default("active"),
  fundId: uuid("fund_id").references(() => funds.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Meetings ────────────────────────────────────────────────────────────────
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  type: meetingTypeEnum("type").notNull().default("general"),
  scheduledAt: timestamp("scheduled_at").notNull(),
  location: text("location"),
  agenda: text("agenda"),
  minutes: text("minutes"),
  status: meetingStatusEnum("status").notNull().default("scheduled"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Meeting Attendees ────────────────────────────────────────────────────────
export const meetingAttendees = pgTable("meeting_attendees", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").notNull().references(() => meetings.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  attended: boolean("attended").notNull().default(false),
});

// ─── Votes ───────────────────────────────────────────────────────────────────
export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id),
  title: text("title").notNull(),
  description: text("description"),
  options: jsonb("options").notNull().$type<string[]>(),
  status: voteStatusEnum("status").notNull().default("draft"),
  startAt: timestamp("start_at"),
  endAt: timestamp("end_at"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Vote Responses ───────────────────────────────────────────────────────────
export const voteResponses = pgTable("vote_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  voteId: uuid("vote_id").notNull().references(() => votes.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  response: text("response", { enum: ["yes", "no", "abstain"] }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Fines ───────────────────────────────────────────────────────────────────
export const fines = pgTable("fines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  reason: text("reason").notNull(),
  amount: integer("amount").notNull(),
  status: fineStatusEnum("status").notNull().default("pending"),
  issuedBy: uuid("issued_by").notNull().references(() => users.id),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
});

// ─── Monthly Snapshots (growth tracking & projections) ────────────────────────
export const monthlySnapshots = pgTable("monthly_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  totalMembers: integer("total_members").notNull().default(0),
  totalFundValue: integer("total_fund_value").notNull().default(0),
  totalInvested: integer("total_invested").notNull().default(0),
  totalReturns: integer("total_returns").notNull().default(0),
  totalAssets: integer("total_assets").notNull().default(0),
  totalWalletBalance: integer("total_wallet_balance").notNull().default(0),
  netWorth: integer("net_worth").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
