export enum InvestmentStatus {
  PLANNED = 'planned',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Investment {
  id: string;
  fundId: string;
  name: string;
  description: string | null;
  investedAmount: number; // cents
  expectedReturn: number | null; // cents
  returnAmount: number | null; // cents — set on completion
  status: InvestmentStatus;
  startDate: string | null;
  endDate: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentDistribution {
  investmentId: string;
  profit: number; // cents — negative = loss
  distributions: {
    userId: string;
    userName: string;
    shares: number;
    sharePercent: number;
    amount: number; // cents
  }[];
}

export interface CreateInvestmentDto {
  name: string;
  description?: string;
  investedAmount: number; // cents
  expectedReturn?: number; // cents
  startDate?: string; // ISO date
}

export interface UpdateInvestmentDto {
  name?: string;
  description?: string;
  status?: InvestmentStatus;
  returnAmount?: number; // cents — required when status = COMPLETED
  startDate?: string;
  endDate?: string;
  notes?: string;
}
