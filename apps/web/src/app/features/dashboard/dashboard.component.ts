import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatCardModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatChipsModule, RouterLink,
    CurrencyPipe, DatePipe,
  ],
  template: `
    <h1>Dashboard</h1>

    @if (summary()) {
      <div class="cards-grid">
        <!-- Wallet Balance -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>account_balance_wallet</mat-icon>
            <mat-card-title>Wallet Balance</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="balance">{{ summary()!.walletBalance / 100 | currency }}</p>
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/wallet">View Wallet</a>
          </mat-card-actions>
        </mat-card>

        <!-- My Funds -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>savings</mat-icon>
            <mat-card-title>My Funds</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (fund of summary()!.funds; track fund.fundId) {
              <div class="fund-item">
                <span class="fund-name">{{ fund.fundName }}</span>
                <span>{{ fund.shares }} shares · {{ fund.totalValue / 100 | currency }}</span>
                <mat-chip [class]="fund.status">{{ fund.status }}</mat-chip>
              </div>
              <mat-divider />
            }
            @if (!summary()!.funds.length) {
              <p class="muted">No shares yet.</p>
            }
          </mat-card-content>
          <mat-card-actions>
            <a mat-button routerLink="/funds">Browse Funds</a>
          </mat-card-actions>
        </mat-card>

        <!-- Recent Activity -->
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>history</mat-icon>
            <mat-card-title>Recent Activity</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (txn of summary()!.recentTransactions; track txn.id) {
              <div class="txn-item">
                <span [class]="txn.direction">{{ txn.direction === 'credit' ? '+' : '−' }}{{ txn.amount / 100 | currency }}</span>
                <span class="muted">{{ txn.type | titlecase }} · {{ txn.createdAt | date:'shortDate' }}</span>
                <mat-chip>{{ txn.status }}</mat-chip>
              </div>
              <mat-divider />
            }
            @if (!summary()!.recentTransactions.length) {
              <p class="muted">No recent transactions.</p>
            }
          </mat-card-content>
        </mat-card>

        <!-- Manager Panel -->
        @if (auth.isManager() && managerSummary()) {
          <mat-card class="manager-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
              <mat-card-title>Pending Actions</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="stat-row">
                <span>Pending withdrawals</span>
                <strong>{{ managerSummary()!.pendingWithdrawals }}</strong>
              </div>
              <div class="stat-row">
                <span>Pending deposits</span>
                <strong>{{ managerSummary()!.pendingDeposits }}</strong>
              </div>
              <div class="stat-row">
                <span>Active investments</span>
                <strong>{{ managerSummary()!.activeInvestments }}</strong>
              </div>
              <div class="stat-row">
                <span>Total deployed</span>
                <strong>{{ managerSummary()!.totalDeployed / 100 | currency }}</strong>
              </div>
            </mat-card-content>
            <mat-card-actions>
              <a mat-button routerLink="/admin">Go to Admin</a>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [`
    h1 { margin-bottom: 24px; }
    .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
    .balance { font-size: 2rem; font-weight: 700; margin: 8px 0; }
    .fund-item, .txn-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 0; }
    .fund-name { font-weight: 500; }
    .muted { color: #757575; font-size: 0.875rem; }
    .credit { color: #388e3c; font-weight: 600; }
    .debit { color: #d32f2f; font-weight: 600; }
    .stat-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
    .manager-card { grid-column: span 2; }
  `],
})
export class DashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);

  readonly summary = signal<any>(null);
  readonly managerSummary = signal<any>(null);

  ngOnInit() {
    this.http.get<any>('/api/dashboard/summary').subscribe((s) => this.summary.set(s));
    if (this.auth.isManager()) {
      this.http.get<any>('/api/dashboard/manager-summary').subscribe((s) => this.managerSummary.set(s));
    }
  }
}
