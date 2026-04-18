import { Component, inject, computed, signal, OnInit, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { User } from '../../../core/models/user.model';
import { userStore } from '../../../store/users/user.store';
import {
  StaffFormModalComponent,
  StaffFormData,
} from './staff-form-modal/staff-form-modal.component';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';

@Component({
  selector: 'app-staff',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
    MatPaginatorModule,
  ],
  templateUrl: './staff.component.html',
  styleUrl: './staff.component.scss',
})
export class StaffComponent {
  userstore = inject(userStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);

  readonly adminCount = computed(
    () => this.userstore.users().filter((u) => u.roles.includes('superAdmin')).length,
  );

  readonly managerCount = computed(
    () => this.userstore.users().filter((u) => u.roles.includes('manager')).length,
  );

  readonly cashierCount = computed(
    () => this.userstore.users().filter((u) => u.roles.includes('cashier')).length,
  );

  readonly activeCount = computed(
    () => this.userstore.users().filter((u) => u.status === 'active').length,
  );

  readonly inactiveCount = computed(
    () => this.userstore.users().filter((u) => u.status === 'inactive').length,
  );

  readonly displayedColumns = ['avatar', 'name', 'email', 'roles', 'status', 'actions'];

  searchQuery = signal('');

  readonly filteredStaff = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.userstore
          .users()
          .filter(
            (u) =>
              u.firstName.toLowerCase().includes(q) ||
              u.lastName.toLowerCase().includes(q) ||
              u.email.toLowerCase().includes(q) ||
              u.roles.some((role) => role.toLowerCase().includes(q)),
          )
      : this.userstore.users();
  });

  // ── Pagination ────────────────────────────────────────────
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly pagedStaff = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredStaff().slice(start, start + this.PAGE_SIZE);
  });

  onSearch(value: string) {
    this.searchQuery.set(value);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  openAddDialog() {
    const ref = this.dialog.open<StaffFormModalComponent, StaffFormData, User>(
      StaffFormModalComponent,
      { data: {}, disableClose: false },
    );

    ref.afterClosed().subscribe((user) => {
      if (user) {
        // this.store.dispatch(StaffActions.addUser({ user }));
        this.userstore.addUser(user).subscribe({
          next: () => {
            this.sweetAlert.success(`${user.firstName} added successfully`);
          },
          error: (error) => {
            this.sweetAlert.error(
              `Failed to add ${user.firstName}: ${error.error ? error.error.error : error.message}`,
            );
          },
        });
      }
    });
  }

  openEditDialog(user: User) {
    const ref = this.dialog.open<StaffFormModalComponent, StaffFormData, User>(
      StaffFormModalComponent,
      { data: { user }, disableClose: false },
    );

    ref.afterClosed().subscribe((updated) => {
      if (updated) {
        this.userstore.updateUser(updated);
        this.sweetAlert.success(`${updated.firstName} updated successfully`);
      }
    });
  }

  confirmDelete(user: User) {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Delete Staff Member',
          message: `Are you sure you want to remove ${user.firstName} from your team? This action cannot be undone.`,
          confirmLabel: 'Delete',
          danger: true,
        },
        width: '380px',
      },
    );

    ref.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.userstore.deleteUser(user._id!);
        this.sweetAlert.success(`${user.firstName} removed`);
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    return role === 'superAdmin'
      ? 'role-badge--admin'
      : role === 'manager'
        ? 'role-badge--manager'
        : 'role-badge--cashier';
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active' ? 'status-badge--active' : 'status-badge--inactive';
  }

  getRoleLabel(role: string): string {
    return role === 'superAdmin' ? 'Super Admin' : role === 'manager' ? 'Manager' : 'Cashier';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Active' : 'Inactive';
  }
}
