export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  MEMBER = "member",
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface UserProfile extends User {
  walletBalance: number; // cents
}

export interface InviteUserDto {
  email: string;
  name: string;
  role: UserRole;
}

export interface UpdateUserRoleDto {
  role: UserRole;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
