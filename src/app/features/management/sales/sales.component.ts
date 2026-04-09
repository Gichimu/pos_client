import { Component, computed, OnInit, Signal, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { SaleItem } from '../../../core/models/sale.model';
import { saleStore } from '../../../store/sales/sale.store';
import { userStore } from '../../../store/users/user.store';
import { productStore } from '../../../store/products/product.store';

type FilterStatus = 'all' | 'pending' | 'confirmed';

const today = new Date();
const h = (hour: number, min: number) =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour, min);

const MOCK_SALES: any[] = [
  {
    _id: 's1',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 4,
    unitPrice: 3.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(8, 15),
    confirmed: false,
  },
  {
    _id: 's2',
    productId: '2',
    productName: 'Switch Sandwich',
    productSku: 'SAN-001',
    productImage: 'https://picsum.photos/seed/sandwich1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 3,
    unitPrice: 2.0,
    totalAmount: 6.0,
    subTotal: 6.0,
    transactionDate: h(8, 42),
    confirmed: false,
  },
  {
    _id: 's3',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 6,
    unitPrice: 3.0,
    totalAmount: 18.0,
    subTotal: 18.0,
    transactionDate: h(9, 10),
    confirmed: true,
  },
  {
    _id: 's4',
    productId: '8',
    productName: 'Latte Special',
    productSku: 'BEV-003',
    productImage: 'https://picsum.photos/seed/latte1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 2,
    unitPrice: 4.5,
    totalAmount: 9.0,
    subTotal: 9.0,
    transactionDate: h(9, 35),
    confirmed: true,
  },
  {
    _id: 's5',
    productId: '3',
    productName: 'Flowny Pastry',
    productSku: 'PAS-001',
    productImage: 'https://picsum.photos/seed/pastry1/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 5,
    unitPrice: 3.0,
    totalAmount: 15.0,
    subTotal: 15.0,
    transactionDate: h(10, 5),
    confirmed: false,
  },
  {
    _id: 's6',
    productId: '6',
    productName: 'Pastry Iclt',
    productSku: 'PAS-003',
    productImage: 'https://picsum.photos/seed/pastry3/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 7,
    unitPrice: 4.0,
    totalAmount: 28.0,
    subTotal: 28.0,
    transactionDate: h(10, 22),
    confirmed: false,
  },
  {
    _id: 's7',
    productId: '7',
    productName: 'Sandwicies',
    productSku: 'SAN-002',
    productImage: 'https://picsum.photos/seed/sandwich2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 3,
    unitPrice: 4.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(11, 0),
    confirmed: false,
  },
  {
    _id: 's8',
    productId: '1',
    productName: 'Coffee Bocat',
    productSku: 'COF-001',
    productImage: 'https://picsum.photos/seed/coffee1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 8,
    unitPrice: 3.0,
    totalAmount: 24.0,
    subTotal: 24.0,
    transactionDate: h(11, 30),
    confirmed: false,
  },
  {
    _id: 's9',
    productId: '4',
    productName: 'Pastry',
    productSku: 'PAS-002',
    productImage: 'https://picsum.photos/seed/pastry2/60/60',
    cashierId: '2',
    cashierName: 'John D.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=johnd',
    quantity: 4,
    unitPrice: 3.0,
    totalAmount: 12.0,
    subTotal: 12.0,
    transactionDate: h(12, 15),
    confirmed: false,
  },
  {
    _id: 's10',
    productId: '5',
    productName: 'Beat Buffein',
    productSku: 'BEV-002',
    productImage: 'https://picsum.photos/seed/beat1/60/60',
    cashierId: '4',
    cashierName: 'Mike T.',
    cashierAvatar: 'https://i.pravatar.cc/32?u=miket',
    quantity: 3,
    unitPrice: 3.0,
    totalAmount: 9.0,
    subTotal: 9.0,
    transactionDate: h(13, 0),
    confirmed: false,
  },
];

@Component({
  selector: 'app-sales',
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './sales.component.html',
  styleUrl: './sales.component.scss',
})
export class SalesComponent implements OnInit {
  readonly salesStore = inject(saleStore);
  readonly userStore = inject(userStore);
  readonly productStore = inject(productStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly today = new Date();

  /** Mutable list of sale items — confirmed state is toggled in-place. */
  // items = signal<any[]>(MOCK_SALES);

  // Assuming 'allSales' is your array of nested objects from Screenshot 1
  items = computed(() =>
    this.salesStore.items().flatMap((sale: any) =>
      sale.items.map((item: any) => ({
        _id: item._id, // Using the sub-item ID
        productId: item.productId,
        productName: this.getProduct(item.productId)?.name || 'Unknown Product', // Assuming you have this or need to look it up
        productSku: this.getProduct(item.productId)?.name || 'N/A',
        productImage: `https://picsum.photos/seed/${item.productId}/60/60`,
        cashierId: sale.cashierId._id,
        cashierName:
          this.getUser(sale.cashierId._id)?.firstName +
            ' ' +
            this.getUser(sale.cashierId._id)?.lastName || 'Unknown',
        cashierAvatar: `https://i.pravatar.cc/32?u=${sale.cashierId._id}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalAmount: item.subTotal,
        subTotal: item.subTotal,
        transactionDate: new Date(sale.createdAt),
        confirmed: item.confirmed,
      })),
    ),
  );

  /** Active status filter. */
  filterStatus = signal<FilterStatus>('all');

  // ── Computed summary stats ───────────────────────────────────────────────

  readonly totalRevenue = computed(() => this.items().reduce((sum, i) => sum + i.totalAmount, 0));

  readonly totalQty = computed(() => this.items().reduce((sum, i) => sum + i.quantity, 0));

  readonly confirmedCount = computed(() => this.items().filter((i) => i.confirmed).length);
  readonly pendingCount = computed(() => this.items().filter((i) => !i.confirmed).length);

  readonly allConfirmed = computed(() => this.items().every((i) => i.confirmed));

  // ── Filtered list for table ──────────────────────────────────────────────

  ngOnInit(): void {
    console.log('view items', this.items());
  }

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

  getUser(userId: String) {
    return this.userStore.users().find((user) => user._id === userId);
  }

  getProduct(productId: String) {
    return this.productStore.products().find((product) => product._id === productId);
  }

  toggleConfirm(item: any) {
    const wasConfirmed = item.confirmed;
    // this.items.update((list) =>
    //   list.map((i) => (i._id === item._id ? { ...i, confirmed: !i.confirmed } : i)),
    // );
    this.items().map((sale) => {
      sale._id === item._id ? { ...sale, confirmed: !sale.confirmed } : sale;
    });
    const msg = wasConfirmed
      ? `${item.productName} marked as pending`
      : `${item.productName} confirmed`;
    this.snackBar.open(msg, 'Dismiss', { duration: 2500 });
  }

  confirmAll() {
    // this.items.update((list) => list.map((i) => ({ ...i, confirmed: true })));
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
