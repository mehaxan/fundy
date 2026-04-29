import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatTabsModule],
  template: `
    <h1>Admin</h1>
    <nav mat-tab-nav-bar>
      <a mat-tab-link routerLink="withdrawals" routerLinkActive #rla1="routerLinkActive" [active]="rla1.isActive">Withdrawals</a>
      <a mat-tab-link routerLink="wallets" routerLinkActive #rla2="routerLinkActive" [active]="rla2.isActive">Wallets</a>
      <a mat-tab-link routerLink="users" routerLinkActive #rla3="routerLinkActive" [active]="rla3.isActive">Users</a>
    </nav>
    <div class="tab-content">
      <router-outlet />
    </div>
  `,
  styles: ['.tab-content { padding-top: 24px; }'],
})
export class AdminShellComponent {}
