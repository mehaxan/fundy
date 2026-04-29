import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UserRole, JwtPayload } from "@fundy/shared";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  getMemberSummary(@CurrentUser() user: JwtPayload) {
    return this.dashboardService.getMemberSummary(user.sub);
  }

  @Get("manager-summary")
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  getManagerSummary() {
    return this.dashboardService.getManagerSummary();
  }
}
