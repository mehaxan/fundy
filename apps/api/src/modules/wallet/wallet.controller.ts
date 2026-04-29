import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload, WalletTxnStatus } from "@fundy/shared";
import { WalletService } from "./wallet.service";
import { IsInt, Min, IsString, IsOptional } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class RequestWithdrawalDto {
  @ApiProperty({ description: "Amount in cents" })
  @IsInt()
  @Min(1)
  amount: number;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

@ApiTags("wallet")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@CurrentUser() user: JwtPayload) {
    return this.walletService.getWallet(user.sub);
  }

  @Get("transactions")
  getTransactions(@CurrentUser() user: JwtPayload) {
    return this.walletService.getTransactions(user.sub);
  }

  @Post("withdrawals")
  requestWithdrawal(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.walletService.requestWithdrawal(user.sub, dto);
  }

  @Delete("withdrawals/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  cancelWithdrawal(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.walletService.cancelWithdrawal(id, user.sub);
  }
}
