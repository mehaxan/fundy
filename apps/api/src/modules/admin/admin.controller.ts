import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, JwtPayload, WalletTxnStatus, WalletTxnDirection } from '@fundy/shared';
import { AdminService } from './admin.service';
import { IsEmail, IsEnum, IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class InviteUserDto {
  @ApiProperty() @IsEmail() email: string;
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}

class UpdateRoleDto {
  @ApiProperty({ enum: UserRole }) @IsEnum(UserRole) role: UserRole;
}

class ConfirmWithdrawalDto {
  @ApiProperty({ enum: [WalletTxnStatus.CONFIRMED, WalletTxnStatus.REJECTED] })
  @IsEnum([WalletTxnStatus.CONFIRMED, WalletTxnStatus.REJECTED])
  status: WalletTxnStatus.CONFIRMED | WalletTxnStatus.REJECTED;

  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

class ManualAdjustDto {
  @ApiProperty({ enum: WalletTxnDirection }) @IsEnum(WalletTxnDirection) direction: WalletTxnDirection;
  @ApiProperty() @IsInt() @Min(1) amount: number;
  @ApiProperty() @IsString() notes: string;
}

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles(UserRole.ADMIN)
  listUsers() {
    return this.adminService.listUsers();
  }

  @Post('users/invite')
  @Roles(UserRole.ADMIN)
  inviteUser(@Body() dto: InviteUserDto) {
    return this.adminService.inviteUser(dto.email, dto.name, dto.role);
  }

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  updateRole(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.adminService.updateUserRole(id, dto);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.ADMIN)
  deactivateUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deactivateUser(id);
  }

  @Get('wallets')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  getAllWallets() {
    return this.adminService.getAllWallets();
  }

  @Get('withdrawals')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  getPendingWithdrawals() {
    return this.adminService.getAllPendingWithdrawals();
  }

  @Patch('withdrawals/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  confirmWithdrawal(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmWithdrawalDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.confirmWithdrawal(id, dto, user.sub);
  }

  @Post('wallets/:userId/adjust')
  @Roles(UserRole.ADMIN)
  manualAdjust(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: ManualAdjustDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.adminService.manualAdjust(userId, dto, user.sub);
  }
}
