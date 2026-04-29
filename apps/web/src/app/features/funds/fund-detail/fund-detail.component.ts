import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, PercentPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FundDetail } from '@fundy/shared';

@Component({
  selector: 'app-fund-detail',
  standalone: true,
  imports: [
    MatCardModule, MatTableModule, MatTabsModule,
    MatChipsModule, MatButtonModule, MatIconModule,
    CurrencyPipe, PercentPipe, RouterLink,
  ],
  template: `
    @if (fund()) {
      <div class="header-row">
        <div>
          <h1>{{ fund()!.name }}</h1>
          <mat-chip [class]="fund()!.status">{{ fund()!.status }}</mat-chip>
        </div>
        <a mat-stroked-button routerLink="/funds">← Back to Funds</a>
      </div>

      <div class="stats-row">
        <mat-card>
          <mat-card-content>
            <p class="stat-label">Share Price</p>
            <p class="stat-value">{{ fund()!.sharePrice / 100 | currency:fund()!.currency }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <p class="stat-label">Total Shares</p>
            <p class="stat-value">{{ fund()!.totalShares }}</p>
          </mat-card-content>
        </mat-card>
        <mat-card>
          <mat-card-content>
            <p class="stat-label">Total Value</p>
            <p class="stat-value">{{ fund()!.totalValue / 100 | currency:fund()!.currency }}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-tab-group>
        <mat-tab label="Members ({{ fund()!.members.length }})">
          <table mat-table [dataSource]="fund()!.members" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Member</th>
              <td mat-cell *matCellDef="let m">{{ m.userName }}</td>
            </ng-container>
            <ng-container matColumnDef="shares">
              <th mat-header-cell *matHeaderCellDef>Shares</th>
              <td mat-cell *matCellDef="let m">{{ m.shares }}</td>
            </ng-container>
            <ng-container matColumnDef="percent">
              <th mat-header-cell *matHeaderCellDef>Share %</th>
              <td mat-cell *matCellDef="let m">{{ m.sharePercent | number:'1.2-2' }}%</td>
            </ng-container>
            <ng-container matColumnDef="value">
              <th mat-header-cell *matHeaderCellDef>Value</th>
              <td mat-cell *matCellDef="let m">{{ m.totalValue / 100 | currency:fund()!.currency }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="memberCols"></tr>
            <tr mat-row *matRowDef="let row; columns: memberCols;"></tr>
          </table>
        </mat-tab>
        <mat-tab label="Investments">
          <table mat-table [dataSource]="investments()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Investment</th>
              <td mat-cell *matCellDef="let i">{{ i.name }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let i">{{ i.investedAmount / 100 | currency }}</td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let i"><mat-chip [class]="i.status">{{ i.status }}</mat-chip></td>
            </ng-container>
            <ng-container matColumnDef="return">
              <th mat-header-cell *matHeaderCellDef>Return</th>
              <td mat-cell *matCellDef="let i">{{ i.returnAmount != null ? (i.returnAmount / 100 | currency) : '—' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="investmentCols"></tr>
            <tr mat-row *matRowDef="let row; columns: investmentCols;"></tr>
          </table>
        </mat-tab>
      </mat-tab-group>
    }
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-label { color: #757575; margin: 0 0 4px; font-size: 0.875rem; }
    .stat-value { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .full-width { width: 100%; }
  `],
})
export class FundDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly id = input.required<string>();

  readonly fund = signal<FundDetail | null>(null);
  readonly investments = signal<any[]>([]);

  readonly memberCols = ['name', 'shares', 'percent', 'value'];
  readonly investmentCols = ['name', 'amount', 'status', 'return'];

  ngOnInit() {
    this.http.get<FundDetail>(`/api/funds/${this.id()}`).subscribe((f) => this.fund.set(f));
    this.http.get<any[]>(`/api/funds/${this.id()}/investments`).subscribe((i) => this.investments.set(i));
  }
}
