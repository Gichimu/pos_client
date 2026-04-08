import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { SaleItem } from '../../../core/models/sale.model';

type FilterStatus = 'all' | 'pending' | 'confirmed';

const today = new Date();
const h = (hour: number, min: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, min);

const MOCK_SALES: SaleItem[] = [
  {
    id: 's1',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantitySold: 4,
    unitPrice: 3.0,
    total: 12.0,
    soldAt: h(8, 15),
    confirmed: false,
  },
  {
    id: 's2',
    productId: '2',
    productName: 'Switch Sandwich',
    productSku: 'SAN-001',
    productImage: 'https://picsum.photos/seed/sandwich1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantitySold: 3,
    unitPrice: 2.0,
    total: 6.0,
    soldAt: h(8, 42),
    confirmed: false,
  },
  {
    id: 's3',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantitySold: 6,
    unitPrice: 3.0,
    total: 18.0,
    soldAt: h(9, 10),
    confirmed: true,
  },
  {
    id: 's4',
    productId: '8',
    productName: 'Latte Special',
    productSku: 'BEV-003',
    productImage: 'https://picsum.photos/seed/latte1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantitySold: 2,
    unitPrice: 4.5,
    total: 9.0,
    soldAt: h(9, 35),
    confirmed: true,
  },
  {
    id: 's5',
    productId: '3',
    productName: 'Flowny Pastry',
    productSku: 'PAS-001',
    productImage: 'https://picsum.photos/seed/pastry1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantitySold: 5,
    unitPrice: 3.0,
    total: 15.0,
    soldAt: h(10, 5),
    confirmed: false,
  },
  {
    id: 's6',
    productId: '6',
    productName: 'Pastry Iclt',
    productSku: 'PAS-003',
    productImage: 'https://picsum.photos/seed/pastry3/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantitySold: 7,
    unitPrice: 4.0,
    total: 28.0,
    soldAt: h(10, 22),
    confirmed: false,
  },
  {
    id: 's7',
    productId: '7',
    productName: 'Sandwicies',
    productSku: 'SAN-002',
    productImage: 'https://picsum.photos/seed/sandwich2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantitySold: 3,
    unitPrice: 4.0,
    total: 12.0,
    soldAt: h(11, 0),
    confirmed: false,
  },
  {
    id: 's8',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantitySold: 8,
    unitPrice: 3.0,
    total: 24.0,
    soldAt: h(11, 30),
    confirmed: false,
  },
  {
    id: 's9',
    productId: '4',
    productName: 'Pastry',
    productSku: 'PAS-002',
    productImage: 'https://picsum.photos/seed/pastry2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantitySold: 4,
    unitPrice: 3.0,
    total: 12.0,
    soldAt: h(12, 15),
    confirmed: false,
  },
  {
    id: 's10',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantitySold: 3,
    unitPrice: 3.0,
    total: 9.0,
    soldAt: h(13, 0),
    confirmed: false,
  },
];

@Component({
  selector: 'app-sales',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly today = new Date();

  /** Mutable list of sale items — confirmed state is toggled in-place. */
  items = signal<SaleItem[]>(MOCK_SALES);

  /** Active status filter. */
  filterStatus = signal<FilterStatus>('all');

  // ── Computed summary stats ───────────────────────────────────────────────

  readonly totalRevenue = computed(() => this.items().reduce((sum, i) => sum + i.total, 0));

  readonly totalQty = computed(() => this.items().reduce((sum, i) => sum + i.quantitySold, 0));

  readonly confirmedCount = computed(() => this.items().filter((i) => i.confirmed).length);
  readonly pendingCount = computed(() => this.items().filter((i) => !i.confirmed).length);

  readonly allConfirmed = computed(() => this.items().every((i) => i.confirmed));

  // ── Filtered list for table ──────────────────────────────────────────────

  readonly filteredItems = computed(() => {
    const status = this.filterStatus();
    if (status === 'confirmed') return this.items().filter((i) => i.confirmed);
    if (status === 'pending') return this.items().filter((i) => !i.confirmed);
    return this.items();
  });

  readonly displayedColumns = [
    'image',
    'product',
    'cashier',
    'qty',
    'unitPrice',
    'total',
    'time',
    'status',
    'actions',
  ];

  // ── Actions ─────────────────────────────────────────────────────────────

  setFilter(status: FilterStatus) {
    this.filterStatus.set(status);
  }

  toggleConfirm(item: SaleItem) {
    const wasConfirmed = item.confirmed;
    this.items.update((list) =>
      list.map((i) => (i.id === item.id ? { ...i, confirmed: !i.confirmed } : i)),
    );
    const msg = wasConfirmed
      ? `${item.productName} marked as pending`
      : `${item.productName} confirmed`;
    this.snackBar.open(msg, 'Dismiss', { duration: 2500 });
  }

  confirmAll() {
    this.items.update((list) => list.map((i) => ({ ...i, confirmed: true })));
    this.snackBar.open('All line items confirmed', 'Dismiss', { duration: 2500 });
  }

  // ── Formatters ───────────────────────────────────────────────────────────

  formatCurrency(v: number): string {
    return `Ksh.${v.toFixed(2)}`;
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}
