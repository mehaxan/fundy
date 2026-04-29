import { Routes } from "@angular/router";

export const FUNDS_ROUTES: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./fund-list/fund-list.component").then(
        (m) => m.FundListComponent,
      ),
  },
  {
    path: ":id",
    loadComponent: () =>
      import("./fund-detail/fund-detail.component").then(
        (m) => m.FundDetailComponent,
      ),
  },
];
