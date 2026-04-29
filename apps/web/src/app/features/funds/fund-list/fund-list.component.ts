import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth.service';
import { DepositFund } from '@fundy/shared';

@Component({
  selector: 'app-fund-list',
  standalone: true,
  imports: [MatTableModule, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule, RouterLink, CurrencyPipe],
  template: `
    <div class="header-row">
      <h1>Funds</h1>
      @if (auth.isManager()) {
        <button mat-flat-button color="primary" routerLink="/funds/create">
          <mat-icon>add</mat-icon> New Fund
        </button>
      }
    </div>

    <mat-card>
      <table mat-table [dataSource]="funds()" class="full-width">
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let f">
            <a [routerLink]="['/funds', f.id]">{{ f.name }}</a>
          </td>
        </ng-container>
        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let f"><mat-chip [class]="f.status">{{ f.status }}</mat-chip></td>
        </ng-container>
        <ng-container matColumnDef="sharePrice">
          <th mat-header-cell *matHeaderCellDef>Share Price</th>
          <td mat-cell *matCellDef="let f">{{ f.sharePrice / 100 | currency:f.currency }}</td>
        </ng-container>
        <ng-container matColumnDef="currency">
          <th mat-header-cell *matHeaderCellDef>Currency</th>
          <td mat-cell *matCellDef="let f">{{ f.currency }}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>
    </mat-card>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .full-width { width: 100%; }
    a { color: inherit; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
  `],
})
export class FundListComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly auth = inject(AuthService);
  readonly funds = signal<DepositFund[]>([]);
  readonly columns = ['name', 'status', 'sharePrice', 'currency'];

  ngOnInit() {
    this.http.get<DepositFund[]>('/api/funds').subscribe((f) => this.funds.set(f));
  }
}
