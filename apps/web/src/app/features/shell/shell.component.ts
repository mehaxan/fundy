import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule,
    MatIconModule, MatButtonModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon>account_balance</mat-icon>
          <span>Fundy</span>
        </div>
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/funds" routerLinkActive="active">
            <mat-icon matListItemIcon>savings</mat-icon>
            <span matListItemTitle>Funds</span>
          </a>
          <a mat-list-item routerLink="/wallet" routerLinkActive="active">
            <mat-icon matListItemIcon>account_balance_wallet</mat-icon>
            <span matListItemTitle>My Wallet</span>
          </a>
          @if (auth.isManager()) {
            <a mat-list-item routerLink="/admin" routerLinkActive="active">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Admin</span>
            </a>
          }
        </mat-nav-list>
        <div class="sidenav-footer">
          <button mat-button (click)="logout()">
            <mat-icon>logout</mat-icon> Logout
          </button>
        </div>
      </mat-sidenav>
      <mat-sidenav-content class="content">
        <mat-toolbar color="primary">
          <span>{{ auth.user()?.email }}</span>
          <span class="role-badge">{{ auth.user()?.role }}</span>
        </mat-toolbar>
        <div class="page-content">
          <router-outlet />
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav { width: 220px; display: flex; flex-direction: column; padding: 0; }
    .brand { display: flex; align-items: center; gap: 8px; padding: 16px; font-size: 1.25rem; font-weight: 700; }
    .sidenav-footer { margin-top: auto; padding: 8px; }
    .content { display: flex; flex-direction: column; }
    .page-content { padding: 24px; flex: 1; overflow: auto; }
    .role-badge { margin-left: 8px; font-size: 0.75rem; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; }
    mat-toolbar { justify-content: flex-end; }
    a.active { background: rgba(0,0,0,0.08); }
  `],
})
export class ShellComponent {
  readonly auth = inject(AuthService);

  logout() {
    this.auth.logout().subscribe();
  }
}
