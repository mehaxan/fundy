import { Injectable, Inject } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { DB, DrizzleDB } from "../../database/database.module";
import { users, wallets, walletTransactions } from "../../database/schema";
import {
  WalletTxnDirection,
  WalletTxnStatus,
  ManualAdjustmentDto,
  UpdateUserRoleDto,
  UserRole,
} from "@fundy/shared";
import { UsersService } from "../users/users.service";
import { WalletService } from "../wallet/wallet.service";
import * as bcrypt from "bcrypt";
import { nanoid } from "nanoid";

@Injectable()
export class AdminService {
  constructor(
    @Inject(DB) private readonly db: DrizzleDB,
    private readonly usersService: UsersService,
    private readonly walletService: WalletService,
  ) {}

  async listUsers() {
    return this.usersService.findAll();
  }

  async updateUserRole(userId: string, dto: UpdateUserRoleDto) {
    await this.db
      .update(users)
      .set({ role: dto.role })
      .where(eq(users.id, userId));
    return this.usersService.findById(userId);
  }

  async deactivateUser(userId: string) {
    await this.db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
  }

  async inviteUser(email: string, name: string, role: UserRole) {
    // Create user with a random password — they reset on first login
    const tempPassword = nanoid(16);
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const [user] = await this.db
      .insert(users)
      .values({ email: email.toLowerCase(), passwordHash, name, role })
      .returning();

    // TODO: send invite email with temp password / reset link
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  }

  async getAllWallets() {
    const rows = await this.db
      .select({
        userId: wallets.userId,
        balance: wallets.balance,
        userName: users.name,
        userEmail: users.email,
      })
      .from(wallets)
      .innerJoin(users, eq(wallets.userId, users.id));

    return rows;
  }

  async getAllPendingWithdrawals() {
    return this.walletService.getAllPendingWithdrawals();
  }

  async confirmWithdrawal(
    txnId: string,
    dto: {
      status: WalletTxnStatus.CONFIRMED | WalletTxnStatus.REJECTED;
      notes?: string;
    },
    actorId: string,
  ) {
    return this.walletService.confirmWithdrawal(txnId, dto, actorId);
  }

  async manualAdjust(
    userId: string,
    dto: ManualAdjustmentDto,
    actorId: string,
  ) {
    return this.walletService.manualAdjust(userId, dto, actorId);
  }
}
