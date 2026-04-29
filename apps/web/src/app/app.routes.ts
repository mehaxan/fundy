import { Routes } from "@angular/router";
import { authGuard } from "./core/auth/auth.guard";
import { roleGuard } from "./core/auth/role.guard";
import { UserRole } from "@fundy/shared";

export const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/shell/shell.component").then((m) => m.ShellComponent),
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.component").then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: "funds",
        loadChildren: () =>
          import("./features/funds/funds.routes").then((m) => m.FUNDS_ROUTES),
      },
      {
        path: "investments",
        loadChildren: () =>
          import("./features/investments/investments.routes").then(
            (m) => m.INVESTMENTS_ROUTES,
          ),
      },
      {
        path: "wallet",
        loadComponent: () =>
          import("./features/wallet/wallet.component").then(
            (m) => m.WalletComponent,
          ),
      },
      {
        path: "admin",
        canActivate: [roleGuard([UserRole.ADMIN, UserRole.MANAGER])],
        loadChildren: () =>
          import("./features/admin/admin.routes").then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
