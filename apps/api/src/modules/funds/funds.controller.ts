import {
  Controller, Get, Post, Patch, Param, Body, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, JwtPayload } from '@fundy/shared';
import { FundsService } from './funds.service';
import { IsString, IsInt, Min, IsOptional, IsISO8601, IsEnum, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FundStatus, ShareStatus } from '@fundy/shared';

class CreateFundDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ description: 'Share price in cents' }) @IsInt() @Min(1) sharePrice: number;
  @ApiPropertyOptional({ default: 'USD' }) @IsString() @IsOptional() currency?: string;
}

class UpdateFundDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ enum: FundStatus }) @IsEnum(FundStatus) @IsOptional() status?: FundStatus;
}

class RecordShareDto {
  @ApiProperty() @IsUUID() userId: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
  @ApiProperty() @IsISO8601() purchasedAt: string;
}

class ConfirmShareDto {
  @ApiProperty({ enum: [ShareStatus.CONFIRMED, ShareStatus.REJECTED] })
  @IsEnum([ShareStatus.CONFIRMED, ShareStatus.REJECTED])
  status: ShareStatus.CONFIRMED | ShareStatus.REJECTED;

  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

@ApiTags('funds')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('funds')
export class FundsController {
  constructor(private readonly fundsService: FundsService) {}

  @Get()
  findAll() {
    return this.fundsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fundsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  create(@Body() dto: CreateFundDto, @CurrentUser() user: JwtPayload) {
    return this.fundsService.create(dto, user.sub);
  }

  @Patch(':id')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFundDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fundsService.update(id, dto, user.sub);
  }

  @Post(':id/shares')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  recordShare(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RecordShareDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fundsService.recordSharePurchase(id, dto, user.sub);
  }

  @Patch(':fundId/shares/:shareId')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  confirmShare(
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() dto: ConfirmShareDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.fundsService.confirmShare(shareId, dto, user.sub);
  }
}
