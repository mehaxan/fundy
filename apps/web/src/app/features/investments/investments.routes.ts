import { Routes } from '@angular/router';

export const INVESTMENTS_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./investment-detail/investment-detail.component').then(
        (m) => m.InvestmentDetailComponent,
      ),
  },
];
