import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { UserRole } from '@fundy/shared';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    MatTableModule, MatButtonModule, MatChipsModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    ReactiveFormsModule, MatIconModule,
  ],
  template: `
    <h2>Users</h2>
    <button mat-flat-button color="primary" (click)="showInvite.set(!showInvite())">
      <mat-icon>person_add</mat-icon> Invite User
    </button>

    @if (showInvite()) {
      <div class="invite-form">
        <form [formGroup]="inviteForm" (ngSubmit)="invite()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Email</mat-label>
            <input matInput type="email" formControlName="email" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Role</mat-label>
            <mat-select formControlName="role">
              <mat-option value="member">Member</mat-option>
              <mat-option value="manager">Manager</mat-option>
            </mat-select>
          </mat-form-field>
          <button mat-flat-button color="primary" type="submit" [disabled]="inviteForm.invalid">Send Invite</button>
          <button mat-button type="button" (click)="showInvite.set(false)">Cancel</button>
        </form>
      </div>
    }

    <table mat-table [dataSource]="users()" class="full-width">
      <ng-container matColumnDef="name">
        <th mat-header-cell *matHeaderCellDef>Name</th>
        <td mat-cell *matCellDef="let u">{{ u.name }}</td>
      </ng-container>
      <ng-container matColumnDef="email">
        <th mat-header-cell *matHeaderCellDef>Email</th>
        <td mat-cell *matCellDef="let u">{{ u.email }}</td>
      </ng-container>
      <ng-container matColumnDef="role">
        <th mat-header-cell *matHeaderCellDef>Role</th>
        <td mat-cell *matCellDef="let u"><mat-chip>{{ u.role }}</mat-chip></td>
      </ng-container>
      <ng-container matColumnDef="actions">
        <th mat-header-cell *matHeaderCellDef>Actions</th>
        <td mat-cell *matCellDef="let u">
          <button mat-icon-button (click)="deactivate(u.id)" title="Deactivate">
            <mat-icon>person_off</mat-icon>
          </button>
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr mat-row *matRowDef="let row; columns: columns;"></tr>
    </table>
  `,
  styles: [`
    .invite-form { max-width: 480px; margin: 16px 0; display: flex; flex-direction: column; gap: 8px; }
    mat-form-field { width: 100%; }
    .full-width { width: 100%; margin-top: 16px; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly users = signal<any[]>([]);
  readonly showInvite = signal(false);
  readonly columns = ['name', 'email', 'role', 'actions'];

  readonly inviteForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: [UserRole.MEMBER, Validators.required],
  });

  ngOnInit() { this.load(); }

  load() {
    this.http.get<any[]>('/api/admin/users').subscribe((u) => this.users.set(u));
  }

  invite() {
    if (this.inviteForm.invalid) return;
    this.http.post('/api/admin/users/invite', this.inviteForm.getRawValue()).subscribe(() => {
      this.showInvite.set(false);
      this.inviteForm.reset({ role: UserRole.MEMBER });
      this.load();
    });
  }

  deactivate(id: string) {
    this.http.delete(`/api/admin/users/${id}`).subscribe(() => this.load());
  }
}
