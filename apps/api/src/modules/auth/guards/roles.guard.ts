import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@fundy/shared";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const hierarchy: Record<UserRole, number> = {
      [UserRole.ADMIN]: 3,
      [UserRole.MANAGER]: 2,
      [UserRole.MEMBER]: 1,
    };

    const userLevel = hierarchy[user.role as UserRole] ?? 0;
    const minRequired = Math.min(...required.map((r) => hierarchy[r]));

    if (userLevel < minRequired) {
      throw new ForbiddenException("Insufficient permissions");
    }

    return true;
  }
}
