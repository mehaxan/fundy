import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-withdrawals',
  standalone: true,
  imports: [MatTableModule, MatButtonModule, MatChipsModule, MatIconModule, CurrencyPipe, DatePipe],
  template: `
    <h2>Pending Withdrawals</h2>
    <table mat-table [dataSource]="withdrawals()" class="full-width">
      <ng-container matColumnDef="user">
        <th mat-header-cell *matHeaderCellDef>User</th>
        <td mat-cell *matCellDef="let w">{{ w.userEmail }}</td>
      </ng-container>
      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef>Amount</th>
        <td mat-cell *matCellDef="let w">{{ w.amount / 100 | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="date">
        <th mat-header-cell *matHeaderCellDef>Requested</th>
        <td mat-cell *matCellDef="let w">{{ w.createdAt | date:'short' }}</td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>Status</th>
        <td mat-cell *matCellDef="let w"><mat-chip>{{ w.status }}</mat-chip></td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let w">
          <button mat-stroked-button color="primary" (click)="confirm(w.id)">Confirm</button>
          &nbsp;
          <button mat-stroked-button color="warn" (click)="reject(w.id)">Reject</button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  `,
  styles: ['.full-width { width: 100%; }'],
})
export class AdminWithdrawalsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly withdrawals = signal<any[]>([]);
  readonly columns = ['user', 'amount', 'date', 'status', 'actions'];

  ngOnInit() { this.load(); }

  load() {
    this.http.get<any[]>('/api/admin/withdrawals').subscribe((w) => this.withdrawals.set(w));
  }

  confirm(id: string) {
    this.http.patch(`/api/admin/withdrawals/${id}`, { status: 'confirmed' }).subscribe(() => this.load());
  }

  reject(id: string) {
    this.http.patch(`/api/admin/withdrawals/${id}`, { status: 'rejected' }).subscribe(() => this.load());
  }
}
