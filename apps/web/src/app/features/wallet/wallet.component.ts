import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogModule, MatDialog } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatChipsModule } from "@angular/material/chips";
import { MatIconModule } from "@angular/material/icon";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { Wallet, WalletTransaction } from "@fundy/shared";

@Component({
  selector: "app-wallet",
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatIconModule,
    ReactiveFormsModule,
    CurrencyPipe,
    DatePipe,
  ],
  template: `
    <h1>My Wallet</h1>

    @if (wallet()) {
      <div class="wallet-header">
        <mat-card class="balance-card">
          <mat-card-content>
            <p class="label">Available Balance</p>
            <p class="balance">
              {{
                (wallet()!.balance - wallet()!.pendingDebits) / 100 | currency
              }}
            </p>
            <p class="muted">
              Total: {{ wallet()!.balance / 100 | currency }} · Pending out:
              {{ wallet()!.pendingDebits / 100 | currency }}
            </p>
          </mat-card-content>
          <mat-card-actions>
            <button
              mat-flat-button
              color="primary"
              (click)="openWithdrawDialog()"
            >
              <mat-icon>arrow_upward</mat-icon> Request Withdrawal
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      @if (showWithdrawForm()) {
        <mat-card class="withdraw-form">
          <mat-card-header
            ><mat-card-title
              >Request Withdrawal</mat-card-title
            ></mat-card-header
          >
          <mat-card-content>
            <form [formGroup]="withdrawForm" (ngSubmit)="submitWithdrawal()">
              <mat-form-field appearance="outline">
                <mat-label
                  >Amount (in
                  {{
                    wallet()!.balance | currency: "USD" : "symbol" : "1.0-0"
                  }}
                  — enter cents)</mat-label
                >
                <input
                  matInput
                  type="number"
                  formControlName="amount"
                  placeholder="e.g. 10000 = $100"
                />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Notes (optional)</mat-label>
                <input matInput formControlName="notes" />
              </mat-form-field>
              <div class="form-actions">
                <button
                  mat-button
                  type="button"
                  (click)="showWithdrawForm.set(false)"
                >
                  Cancel
                </button>
                <button
                  mat-flat-button
                  color="primary"
                  type="submit"
                  [disabled]="withdrawForm.invalid"
                >
                  Submit
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      }

      <mat-card>
        <mat-card-header
          ><mat-card-title>Transaction History</mat-card-title></mat-card-header
        >
        <mat-card-content>
          <table mat-table [dataSource]="transactions()" class="full-width">
            <ng-container matColumnDef="date">
              <th mat-header-cell *matHeaderCellDef>Date</th>
              <td mat-cell *matCellDef="let t">
                {{ t.createdAt | date: "shortDate" }}
              </td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let t">{{ t.type | titlecase }}</td>
            </ng-container>
            <ng-container matColumnDef="amount">
              <th mat-header-cell *matHeaderCellDef>Amount</th>
              <td mat-cell *matCellDef="let t" [class]="t.direction">
                {{ t.direction === "credit" ? "+" : "−"
                }}{{ t.amount / 100 | currency }}
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let t">
                <mat-chip [class]="t.status">{{ t.status }}</mat-chip>
              </td>
            </ng-container>
            <ng-container matColumnDef="notes">
              <th mat-header-cell *matHeaderCellDef>Notes</th>
              <td mat-cell *matCellDef="let t">{{ t.notes ?? "—" }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns"></tr>
          </table>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [
    `
      .wallet-header {
        margin-bottom: 24px;
      }
      .balance-card {
        max-width: 400px;
      }
      .label {
        color: #757575;
        margin: 0 0 4px;
      }
      .balance {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
      }
      .muted {
        color: #757575;
        font-size: 0.875rem;
        margin: 4px 0 0;
      }
      .withdraw-form {
        max-width: 480px;
        margin-bottom: 24px;
      }
      mat-form-field {
        width: 100%;
        margin-bottom: 12px;
      }
      .form-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
      .full-width {
        width: 100%;
      }
      .credit {
        color: #388e3c;
        font-weight: 600;
      }
      .debit {
        color: #d32f2f;
        font-weight: 600;
      }
    `,
  ],
})
export class WalletComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly wallet = signal<Wallet | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly showWithdrawForm = signal(false);
  readonly columns = ["date", "type", "amount", "status", "notes"];

  readonly withdrawForm = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(1)]],
    notes: [""],
  });

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<Wallet>("/api/wallet").subscribe((w) => this.wallet.set(w));
    this.http
      .get<WalletTransaction[]>("/api/wallet/transactions")
      .subscribe((t) => this.transactions.set(t));
  }

  openWithdrawDialog() {
    this.showWithdrawForm.set(true);
  }

  submitWithdrawal() {
    if (this.withdrawForm.invalid) return;
    const { amount, notes } = this.withdrawForm.getRawValue();
    this.http
      .post("/api/wallet/withdrawals", { amount, notes })
      .subscribe(() => {
        this.showWithdrawForm.set(false);
        this.withdrawForm.reset();
        this.load();
      });
  }
}
