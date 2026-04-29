import { Component, inject, input, OnInit, signal } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { MatCardModule } from "@angular/material/card";
import { MatChipsModule } from "@angular/material/chips";
import { MatTableModule } from "@angular/material/table";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CurrencyPipe, DatePipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Investment, InvestmentDistribution } from "@fundy/shared";

@Component({
  selector: "app-investment-detail",
  standalone: true,
  imports: [
    MatCardModule,
    MatChipsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    CurrencyPipe,
    DatePipe,
    RouterLink,
  ],
  template: `
    @if (investment()) {
      <div class="header-row">
        <h1>{{ investment()!.name }}</h1>
        <mat-chip [class]="investment()!.status">{{
          investment()!.status
        }}</mat-chip>
      </div>

      <div class="detail-grid">
        <mat-card>
          <mat-card-header
            ><mat-card-title>Details</mat-card-title></mat-card-header
          >
          <mat-card-content>
            <div class="row">
              <span>Invested</span
              ><strong>{{
                investment()!.investedAmount / 100 | currency
              }}</strong>
            </div>
            <div class="row">
              <span>Expected Return</span
              ><strong>{{
                investment()!.expectedReturn != null
                  ? (investment()!.expectedReturn! / 100 | currency)
                  : "—"
              }}</strong>
            </div>
            <div class="row">
              <span>Actual Return</span
              ><strong>{{
                investment()!.returnAmount != null
                  ? (investment()!.returnAmount! / 100 | currency)
                  : "—"
              }}</strong>
            </div>
            <div class="row">
              <span>Started</span
              ><strong>{{
                investment()!.startDate
                  ? (investment()!.startDate! | date)
                  : "—"
              }}</strong>
            </div>
            <div class="row">
              <span>Ended</span
              ><strong>{{
                investment()!.endDate ? (investment()!.endDate! | date) : "—"
              }}</strong>
            </div>
          </mat-card-content>
        </mat-card>

        @if (distribution()) {
          <mat-card>
            <mat-card-header
              ><mat-card-title
                >Profit Distribution</mat-card-title
              ></mat-card-header
            >
            <mat-card-content>
              <p class="profit" [class.loss]="distribution()!.profit < 0">
                {{ distribution()!.profit >= 0 ? "+" : ""
                }}{{ distribution()!.profit / 100 | currency }}
              </p>
              <table
                mat-table
                [dataSource]="distribution()!.distributions"
                class="full-width"
              >
                <ng-container matColumnDef="member">
                  <th mat-header-cell *matHeaderCellDef>Member</th>
                  <td mat-cell *matCellDef="let d">{{ d.userId }}</td>
                </ng-container>
                <ng-container matColumnDef="shares">
                  <th mat-header-cell *matHeaderCellDef>Shares</th>
                  <td mat-cell *matCellDef="let d">{{ d.shares }}</td>
                </ng-container>
                <ng-container matColumnDef="amount">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let d" [class.loss]="d.amount < 0">
                    {{ d.amount / 100 | currency }}
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="distrCols"></tr>
                <tr mat-row *matRowDef="let row; columns: distrCols"></tr>
              </table>
            </mat-card-content>
          </mat-card>
        }
      </div>
    }
  `,
  styles: [
    `
      .header-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
      }
      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        padding: 8px 0;
        border-bottom: 1px solid #eee;
      }
      .profit {
        font-size: 1.5rem;
        font-weight: 700;
        color: #388e3c;
        margin-bottom: 12px;
      }
      .profit.loss {
        color: #d32f2f;
      }
      .loss {
        color: #d32f2f;
      }
      .full-width {
        width: 100%;
      }
    `,
  ],
})
export class InvestmentDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly id = input.required<string>();

  readonly investment = signal<Investment | null>(null);
  readonly distribution = signal<InvestmentDistribution | null>(null);
  readonly distrCols = ["member", "shares", "amount"];

  ngOnInit() {
    this.http
      .get<Investment>(`/api/investments/${this.id()}`)
      .subscribe((i) => {
        this.investment.set(i);
        this.http
          .get<InvestmentDistribution>(
            `/api/investments/${this.id()}/distribution`,
          )
          .subscribe((d) => this.distribution.set(d));
      });
  }
}
