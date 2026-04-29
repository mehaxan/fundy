import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Inject } from "@nestjs/common";
import { eq, and, gt, isNull } from "drizzle-orm";
import * as bcrypt from "bcrypt";
import { DB, DrizzleDB } from "../../database/database.module";
import {
  users,
  refreshTokens,
  passwordResetTokens,
} from "../../database/schema";
import { LoginDto, JwtPayload } from "@fundy/shared";
import { nanoid } from "nanoid";
import { createHash } from "crypto";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: DrizzleDB,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, res: { cookie: Function }) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email.toLowerCase()))
      .limit(1);

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = nanoid(64);
    const tokenHash = this.hashToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: this.config.get("NODE_ENV") === "production",
      sameSite: "strict",
      expires: expiresAt,
      path: "/auth",
    });

    return { accessToken };
  }

  async refresh(rawToken: string | undefined) {
    if (!rawToken) throw new UnauthorizedException("No refresh token");

    const tokenHash = this.hashToken(rawToken);
    const now = new Date();

    const [stored] = await this.db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.tokenHash, tokenHash),
          isNull(refreshTokens.revokedAt),
          gt(refreshTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!stored)
      throw new UnauthorizedException("Invalid or expired refresh token");

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, stored.userId))
      .limit(1);

    if (!user || !user.isActive) throw new ForbiddenException("User inactive");

    // Rotate: revoke old token
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, stored.id));

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }

  async logout(rawToken: string | undefined) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await this.db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.tokenHash, tokenHash));
  }

  async forgotPassword(email: string) {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    // Always return success (prevent user enumeration)
    if (!user) return;

    const token = nanoid(64);
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    // TODO: send email with reset link containing `token`
    // EmailService.send(user.email, token)
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = this.hashToken(token);
    const now = new Date();

    const [stored] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .limit(1);

    if (!stored)
      throw new BadRequestException("Invalid or expired reset token");

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await Promise.all([
      this.db
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, stored.userId)),
      this.db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(eq(passwordResetTokens.id, stored.id)),
      // Revoke all refresh tokens on password change
      this.db
        .update(refreshTokens)
        .set({ revokedAt: now })
        .where(
          and(
            eq(refreshTokens.userId, stored.userId),
            isNull(refreshTokens.revokedAt),
          ),
        ),
    ]);
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }
}
