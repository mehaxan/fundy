import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole, JwtPayload, InvestmentStatus } from "@fundy/shared";
import { InvestmentsService } from "./investments.service";
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsISO8601,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class CreateInvestmentDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiProperty({ description: "Amount in cents" })
  @IsInt()
  @Min(1)
  investedAmount: number;
  @ApiPropertyOptional() @IsInt() @Min(1) @IsOptional() expectedReturn?: number;
  @ApiPropertyOptional() @IsISO8601() @IsOptional() startDate?: string;
}

class UpdateInvestmentDto {
  @ApiPropertyOptional() @IsString() @IsOptional() name?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() description?: string;
  @ApiPropertyOptional({ enum: InvestmentStatus })
  @IsEnum(InvestmentStatus)
  @IsOptional()
  status?: InvestmentStatus;
  @ApiPropertyOptional() @IsInt() @Min(0) @IsOptional() returnAmount?: number;
  @ApiPropertyOptional() @IsISO8601() @IsOptional() startDate?: string;
  @ApiPropertyOptional() @IsISO8601() @IsOptional() endDate?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

@ApiTags("investments")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get("funds/:fundId/investments")
  findByFund(@Param("fundId", ParseUUIDPipe) fundId: string) {
    return this.investmentsService.findByFund(fundId);
  }

  @Post("funds/:fundId/investments")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  create(
    @Param("fundId", ParseUUIDPipe) fundId: string,
    @Body() dto: CreateInvestmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.investmentsService.create(fundId, dto, user.sub);
  }

  @Get("investments/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.investmentsService.findOne(id);
  }

  @Patch("investments/:id")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateInvestmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.investmentsService.update(id, dto, user.sub);
  }

  @Get("investments/:id/distribution")
  getDistribution(@Param("id", ParseUUIDPipe) id: string) {
    return this.investmentsService.getDistribution(id);
  }
}
