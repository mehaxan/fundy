export enum WalletTxnType {
  INVESTMENT_PROFIT = "investment_profit",
  INVESTMENT_LOSS = "investment_loss",
  WITHDRAWAL = "withdrawal",
  MANUAL_CREDIT = "manual_credit",
  MANUAL_DEBIT = "manual_debit",
}

export enum WalletTxnDirection {
  CREDIT = "credit",
  DEBIT = "debit",
}

export enum WalletTxnStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface Wallet {
  id: string;
  userId: string;
  balance: number; // cents — sum of confirmed txns
  pendingDebits: number; // cents
  updatedAt: string;
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTxnType;
  direction: WalletTxnDirection;
  amount: number; // cents, always positive
  status: WalletTxnStatus;
  sourceType:
    | "investment_distribution"
    | "withdrawal_request"
    | "manual"
    | null;
  sourceId: string | null;
  notes: string | null;
  requestedBy: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

export interface RequestWithdrawalDto {
  amount: number; // cents
  notes?: string;
}

export interface ConfirmWithdrawalDto {
  status: WalletTxnStatus.CONFIRMED | WalletTxnStatus.REJECTED;
  notes?: string;
}

export interface ManualAdjustmentDto {
  direction: WalletTxnDirection;
  amount: number; // cents
  notes: string;
}

export interface AdminWalletSummary {
  userId: string;
  userName: string;
  userEmail: string;
  balance: number; // cents
  pendingWithdrawals: number; // count
  pendingWithdrawalAmount: number; // cents
  totalWithdrawn: number; // cents
}
