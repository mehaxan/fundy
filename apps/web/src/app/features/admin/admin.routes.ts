import { Routes } from "@angular/router";
import { roleGuard } from "../../core/auth/role.guard";
import { UserRole } from "@fundy/shared";

export const ADMIN_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./admin-shell/admin-shell.component").then(
        (m) => m.AdminShellComponent,
      ),
    children: [
      { path: "", redirectTo: "withdrawals", pathMatch: "full" },
      {
        path: "withdrawals",
        loadComponent: () =>
          import("./admin-withdrawals/admin-withdrawals.component").then(
            (m) => m.AdminWithdrawalsComponent,
          ),
      },
      {
        path: "users",
        canActivate: [roleGuard([UserRole.ADMIN])],
        loadComponent: () =>
          import("./admin-users/admin-users.component").then(
            (m) => m.AdminUsersComponent,
          ),
      },
      {
        path: "wallets",
        loadComponent: () =>
          import("./admin-wallets/admin-wallets.component").then(
            (m) => m.AdminWalletsComponent,
          ),
      },
    ],
  },
];
