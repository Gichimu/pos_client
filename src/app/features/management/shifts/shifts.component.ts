import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { interval } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { shiftStore } from '../../../store/shifts/shift.store';
import { userStore } from '../../../store/users/user.store';
import { saleStore } from '../../../store/sales/sale.store';
import {
  StartShiftDialogComponent,
  StartShiftDialogResult,
} from './start-shift-dialog/start-shift-dialog.component';
import {
  EndShiftDialogComponent,
  EndShiftDialogData,
  EndShiftDialogResult,
} from './end-shift-dialog/end-shift-dialog.component';
import { authStore } from '../../../store/auth/auth.store';
import { productStore } from '../../../store/products/product.store';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';
import { ShiftReportService } from '../../../core/services/shift-report.service';
import { requisitionStore } from '../../../store/requisitions/requisition.store';

type StatusFilter = 'all' | 'Open' | 'Closed';

@Component({
  selector: 'app-shifts',
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatPaginatorModule,
  ],
  templateUrl: './shifts.component.html',
  styleUrl: './shifts.component.scss',
})
export class ShiftsComponent implements OnInit {
  readonly store = inject(shiftStore);
  readonly authStore = inject(authStore);
  readonly userStore = inject(userStore);
  readonly productStore = inject(productStore);
  readonly salesStore = inject(saleStore);
  private readonly dialog = inject(MatDialog);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly shiftReportService = inject(ShiftReportService);
  private readonly reqStore = inject(requisitionStore);

  readonly today = new Date();

  // Tick every 30 seconds to refresh elapsed labels on active shift
  private readonly tick = toSignal(interval(30_000), { initialValue: 0 });

  // ── Current shift ──────────────────────────────────────────────────
  readonly activeShift = computed(() => this.store.activeShift());
  readonly isLoading = computed(() => this.store.isLoading());

  readonly elapsedLabel = computed(() => {
    this.tick(); // reactive dependency — recompute on each tick
    const shift = this.activeShift();
    if (!shift) return '';
    return this.formatElapsed(new Date(shift.startTime));
  });

  readonly revenueInCurrentShift = computed(() => {
    const shift = this.activeShift();
    if (!shift) return 0;
    const shiftStart = new Date(shift.startTime).getTime();
    return this.salesStore
      .items()
      .filter(
        (i) => i.confirmed && new Date((i as any).transactionDate ?? 0).getTime() >= shiftStart,
      )
      .flatMap((s) => s.items)
      .reduce((sum, i) => sum + i.subTotal, 0);
  });

  /** Number of unconfirmed sales belonging to the currently active shift. */
  readonly pendingSalesInShift = computed(() => {
    const shift = this.activeShift();
    if (!shift) return 0;
    const shiftStart = new Date(shift.startTime).getTime();
    return this.salesStore
      .items()
      .filter((s) => new Date((s as any).createdAt ?? 0).getTime() >= shiftStart)
      .filter((s) => !s.confirmed).length;
  });

  readonly activeCashiers = computed(
    () =>
      this.userStore.users().filter((u) => u.roles.includes('cashier') && u.status === 'active')
        .length,
  );

  // ── History table ──────────────────────────────────────────────────
  readonly filterStatus = signal<StatusFilter>('all');

  readonly filteredShifts = computed(() => {
    const status = this.filterStatus();
    const shifts = this.store.shifts();
    if (status === 'all') return shifts;
    return shifts.filter((s) => s.status === status);
  });

  // ── Pagination ────────────────────────────────────────────
  readonly pageIndex = signal(0);
  readonly PAGE_SIZE = 10;

  readonly pagedShifts = computed(() => {
    const start = this.pageIndex() * this.PAGE_SIZE;
    return this.filteredShifts().slice(start, start + this.PAGE_SIZE);
  });

  setFilterStatus(status: StatusFilter): void {
    this.filterStatus.set(status);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
  }

  readonly activeCount = computed(
    () => this.store.shifts().filter((s) => s.status === 'Open').length,
  );
  readonly closedCount = computed(
    () => this.store.shifts().filter((s) => s.status === 'Closed').length,
  );

  readonly displayedColumns = [
    'index',
    'date',
    'start',
    'end',
    'duration',
    'revenue',
    'openedBy',
    'closedBy',
    'status',
  ];

  /** Resolve a user _id to "FirstName LastName", or '—' if not found. */
  resolveUser(userId: string | null | undefined): string {
    if (!userId) return '—';
    const user = this.userStore.users().find((u) => u._id === userId);
    if (!user) return '—';
    return `${user.firstName} ${user.lastName}`;
  }

  /** Avatar URL for a user _id. */
  resolveAvatar(userId: string | null | undefined): string {
    return `https://i.pravatar.cc/28?u=${userId ?? 'unknown'}`;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────
  ngOnInit(): void {
    // Re-fetch every time the route is entered.
    // The store is a root singleton — its own onInit only fires once at app
    // startup, so we call loadShifts() here for every navigation event.
    this.filterStatus.set('all');
    this.store.loadShifts();
  }

  // ── Actions ────────────────────────────────────────────────────────
  openStartDialog(): void {
    const ref = this.dialog.open<StartShiftDialogComponent, void, StartShiftDialogResult>(
      StartShiftDialogComponent,
      { width: '460px', maxWidth: '95vw', disableClose: false, panelClass: 'pos-dialog' },
    );

    ref.afterClosed().subscribe((result) => {
      if (result === undefined) return; // cancelled
      this.store
        .openShift({
          openingNotes: result.openingNotes,
          openedBy: this.authStore.user()?._id || 'Unknown User', // user should always be defined here, but fallback just in case
        })
        .subscribe({
          next: () => this.sweetAlert.success('Shift started successfully'),
          error: () => this.sweetAlert.error('Failed to start shift. Please try again.'),
        });
    });
  }

  openEndDialog(): void {
    const shift = this.activeShift();
    if (!shift) return;

    const shiftStart = new Date(shift.startTime).getTime();
    const unconfirmedCount = this.salesStore
      .items()
      .filter((s) => new Date((s as any).createdAt ?? 0).getTime() >= shiftStart)
      .filter((i) => !i.confirmed).length;

    const dialogData: EndShiftDialogData = {
      duration: this.formatElapsed(new Date(shift.startTime)),
      revenue: this.revenueInCurrentShift(),
      activeCashiers: this.activeCashiers(),
      unconfirmedCount,
    };

    const ref = this.dialog.open<EndShiftDialogComponent, EndShiftDialogData, EndShiftDialogResult>(
      EndShiftDialogComponent,
      { data: dialogData, width: '500px', maxWidth: '95vw', disableClose: false, panelClass: 'pos-dialog' },
    );

    ref.afterClosed().subscribe((result) => {
      if (result === undefined) return; // cancelled

      const closedByUserId = this.authStore.user()?._id ?? '';
      const closedByName = this.resolveUser(closedByUserId);
      const openedByName = this.resolveUser(shift.openedBy);

      // Snapshot sales data NOW (before the async close removes the active shift)
      const salesInShift = [
        ...this.salesStore
          .items()
          .filter(
            (s) =>
              s.shiftId === shift._id ||
              new Date((s as any).createdAt ?? 0).getTime() >= shiftStart,
          ),
      ];

      // Build a userId → "First Last" lookup map
      const userMap: Record<string, string> = {};
      this.userStore.users().forEach((u) => {
        if (u._id) userMap[u._id] = u.firstName;
      });

      // Snapshot requisitions before the store clears
      const requisitions = [...this.reqStore.items()];

      this.store
        .closeShift(shift._id!, {
          closingNotes: result.closingNotes,
          closedBy: closedByUserId || 'Unknown User',
          requisitions,
        })
        .subscribe({
          next: () => {
            // Clear requisitions now that the shift is closed
            this.reqStore.clearRequisitions();
            // Print shift report with the snapshotted data
            this.shiftReportService.print({
              shift: { ...shift, endTime: new Date(), closedBy: closedByUserId },
              openedByName,
              closedByName,
              sales: salesInShift,
              userMap,
              requisitions,
            });
            this.sweetAlert.success('Shift ended successfully');
          },
          error: () => this.sweetAlert.error('Failed to end shift. Please try again.'),
        });
    });
  }

  // ── Formatters ─────────────────────────────────────────────────────
  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  formatDate(d: Date | string): string {
    const date = new Date(d);
    const todayStr = new Date().toDateString();
    if (date.toDateString() === todayStr) return 'Today';
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  }

  formatTime(d: Date | string): string {
    return new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDuration(start: Date | string, end?: Date | string | null): string {
    const from = new Date(start).getTime();
    const to = end ? new Date(end).getTime() : Date.now();
    return this.formatElapsed(new Date(from), to);
  }

  private formatElapsed(from: Date, toMs: number = Date.now()): string {
    const ms = toMs - from.getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
}
