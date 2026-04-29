export enum FundStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  CLOSED = "closed",
}

export enum ShareStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  REJECTED = "rejected",
}

export interface DepositFund {
  id: string;
  name: string;
  description: string | null;
  sharePrice: number; // cents
  currency: string;
  status: FundStatus;
  createdBy: string;
  createdAt: string;
  closedAt: string | null;
}

export interface FundMember {
  userId: string;
  userName: string;
  userEmail: string;
  shares: number;
  sharePercent: number; // 0-100, 2 decimal places
  totalValue: number; // shares * sharePrice, cents
}

export interface FundDetail extends DepositFund {
  totalShares: number;
  totalValue: number; // cents
  members: FundMember[];
}

export interface Share {
  id: string;
  fundId: string;
  userId: string;
  quantity: number;
  unitPrice: number; // cents — snapshot at time of purchase
  status: ShareStatus;
  purchasedAt: string;
  confirmedBy: string | null;
  confirmedAt: string | null;
}

export interface CreateFundDto {
  name: string;
  description?: string;
  sharePrice: number; // cents
  currency?: string; // default 'USD'
}

export interface UpdateFundDto {
  name?: string;
  description?: string;
  status?: FundStatus;
}

export interface RecordSharePurchaseDto {
  userId: string;
  quantity: number;
  purchasedAt: string; // ISO date
}

export interface ConfirmShareDto {
  status: ShareStatus.CONFIRMED | ShareStatus.REJECTED;
  notes?: string;
}
