import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
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
  private readonly snackBar = inject(MatSnackBar);

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
      .flatMap((s) => s.items)
      .filter(
        (i) => i.confirmed && new Date((i as any).transactionDate ?? 0).getTime() >= shiftStart,
      )
      .reduce((sum, i) => sum + i.subTotal, 0);
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

  //create a shift report with tables for sales by product, payment method, and cashier for the current shift
  createShiftReport() {
    const shift = this.activeShift();
    if (!shift) return;

    const shiftStart = new Date(shift.startTime).getTime();
    const salesInShift = this.salesStore
      .items()
      .filter((s) => new Date(s.createdAt ?? 0).getTime() >= shiftStart);

    // Group sales by product, payment method, and cashier
    const salesByProduct: Record<string, number> = {};
    const salesByPayment: Record<string, number> = {};
    const salesByCashier: Record<string, number> = {};

    salesInShift.forEach((sale) => {
      const cashierId = (sale as any).cashierId ?? 'Unknown Cashier';
      salesByCashier[cashierId] = (salesByCashier[cashierId] || 0) + sale.totalAmount;

      sale.items.forEach((item) => {
        if (!item.confirmed) return;
        const productId = item.productId || 'Unknown Product';
        const productName =
          this.productStore.products().find((p) => p._id === productId)?.name || 'Unknown Product';
        const paymentMethod = item.paymentMethod || 'Unknown Payment';

        salesByProduct[productName] = (salesByProduct[productName] || 0) + item.subTotal;
        salesByPayment[paymentMethod] = (salesByPayment[paymentMethod] || 0) + item.subTotal;
      });
    });

    // Log the report data to the console (or format it as needed for display)
    console.log('Sales by Product:', salesByProduct);
    console.log('Sales by Payment Method:', salesByPayment);
    console.log('Sales by Cashier:', salesByCashier);

    // You can further format this data into tables or charts as needed for your application
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
      { width: '460px', disableClose: false, panelClass: 'pos-dialog' },
    );

    ref.afterClosed().subscribe((result) => {
      if (result === undefined) return; // cancelled
      this.store
        .openShift({
          openingNotes: result.openingNotes,
          openedBy: this.authStore.user()?._id || 'Unknown User', // user should always be defined here, but fallback just in case
        })
        .subscribe({
          next: () =>
            this.snackBar.open('Shift started successfully', 'Dismiss', { duration: 3000 }),
          error: () =>
            this.snackBar.open('Failed to start shift. Please try again.', 'Dismiss', {
              duration: 3000,
            }),
        });
    });
  }

  openEndDialog(): void {
    const shift = this.activeShift();
    if (!shift) return;

    // Count line items belonging to this shift that have not been confirmed
    const shiftStart = new Date(shift.startTime).getTime();
    const unconfirmedCount = this.salesStore
      .items()
      .filter((s) => {
        const d = new Date((s as any).createdAt ?? 0);
        return d.getTime() >= shiftStart;
      })
      .flatMap((s) => s.items)
      .filter((i) => !i.confirmed).length;

    const dialogData: EndShiftDialogData = {
      duration: this.formatElapsed(new Date(shift.startTime)),
      revenue: this.revenueInCurrentShift(),
      activeCashiers: this.activeCashiers(),
      unconfirmedCount,
    };

    const ref = this.dialog.open<EndShiftDialogComponent, EndShiftDialogData, EndShiftDialogResult>(
      EndShiftDialogComponent,
      { data: dialogData, width: '500px', disableClose: false, panelClass: 'pos-dialog' },
    );

    ref.afterClosed().subscribe((result) => {
      if (result === undefined) return; // cancelled
      this.store
        .closeShift(shift._id!, {
          closingNotes: result.closingNotes,
          closedBy: this.authStore.user()?._id || 'Unknown User',
        })
        .subscribe({
          next: () => {
            this.createShiftReport(); // Generate shift report on successful close
            this.snackBar.open('Shift ended successfully', 'Dismiss', { duration: 3000 });
          },
          error: () =>
            this.snackBar.open('Failed to end shift. Please try again.', 'Dismiss', {
              duration: 3000,
            }),
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
