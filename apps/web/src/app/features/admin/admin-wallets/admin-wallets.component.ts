import { Component, inject, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { CurrencyPipe } from "@angular/common";

@Component({
  selector: "app-admin-wallets",
  standalone: true,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    CurrencyPipe,
  ],
  template: `
    <h2>All Wallets</h2>
    <table mat-table [dataSource]="wallets()" class="full-width">
      <ng-container matColumnDef="user">
        <th mat-header-cell *matHeaderCellDef>User</th>
        <td mat-cell *matCellDef="let w">{{ w.userEmail }}</td>
      </ng-container>
      <ng-container matColumnDef="balance">
        <th mat-header-cell *matHeaderCellDef>Balance</th>
        <td mat-cell *matCellDef="let w">{{ w.balance / 100 | currency }}</td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Adjust</th>
        <td mat-cell *matCellDef="let w">
          <button mat-icon-button (click)="selectUser(w.userId)">
            <mat-icon>edit</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns"></tr>
    </table>

    @if (selectedUserId()) {
      <div class="adjust-form">
        <h3>Manual Adjustment for {{ selectedUserId() }}</h3>
        <form [formGroup]="adjustForm" (ngSubmit)="submitAdjust()">
          <mat-form-field appearance="outline">
            <mat-label>Amount (cents, negative = debit)</mat-label>
            <input matInput type="number" formControlName="amount" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Notes</mat-label>
            <input matInput formControlName="notes" />
          </mat-form-field>
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="adjustForm.invalid"
          >
            Apply
          </button>
          <button mat-button type="button" (click)="selectedUserId.set(null)">
            Cancel
          </button>
        </form>
      </div>
    }
  `,
  styles: [
    `
      .full-width {
        width: 100%;
      }
      .adjust-form {
        margin-top: 24px;
        max-width: 480px;
      }
      mat-form-field {
        width: 100%;
        margin-bottom: 12px;
      }
    `,
  ],
})
export class AdminWalletsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly wallets = signal<any[]>([]);
  readonly selectedUserId = signal<string | null>(null);
  readonly columns = ["user", "balance", "actions"];

  readonly adjustForm = this.fb.group({
    amount: [null as number | null, [Validators.required]],
    notes: ["", Validators.required],
  });

  ngOnInit() {
    this.http
      .get<any[]>("/api/admin/wallets")
      .subscribe((w) => this.wallets.set(w));
  }

  selectUser(id: string) {
    this.selectedUserId.set(id);
    this.adjustForm.reset();
  }

  submitAdjust() {
    if (this.adjustForm.invalid) return;
    const { amount, notes } = this.adjustForm.getRawValue();
    this.http
      .post(`/api/admin/wallets/${this.selectedUserId()}/adjust`, {
        amount,
        notes,
      })
      .subscribe(() => {
        this.selectedUserId.set(null);
      });
  }
}
