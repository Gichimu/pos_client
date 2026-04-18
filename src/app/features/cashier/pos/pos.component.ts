import { Component, inject, computed, signal, Signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { authStore } from '../../../store/auth/auth.store';
import { User } from '../../../core/models/user.model';
import { productStore } from '../../../store/products/product.store';
import { cartStore } from '../../../store/cart/cart.store';
import { CartItem } from '../../../core/models/cart.model';
import { LineItem, SaleItem } from '../../../core/models/sale.model';
import { saleStore } from '../../../store/sales/sale.store';
import { shiftStore } from '../../../store/shifts/shift.store';
import { CategoryStore } from '../../../store/categories/category.store';
import { ReceiptService } from '../../../core/services/receipt.service';
import { SweetAlertService } from '../../../core/services/sweet-alert.service';

@Component({
  selector: 'app-pos',
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDividerModule,
  ],
  templateUrl: './pos.component.html',
  styleUrl: './pos.component.scss',
})
export class PosComponent implements OnInit {
  readonly store = inject(cartStore);
  readonly saleStore = inject(saleStore);
  readonly productStore = inject(productStore);
  readonly categoryStore = inject(CategoryStore);
  readonly shiftStore = inject(shiftStore);

  /** Reactive: the current open shift (null if store is closed). */
  readonly activeShift = computed(() => this.shiftStore.activeShift());
  cartItems = this.store.items as Signal<any[]>;
  cartTotal = this.store.total as Signal<number>;
  private readonly authStore = inject(authStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sweetAlert = inject(SweetAlertService);
  private readonly receiptService = inject(ReceiptService);

  readonly currentUser = this.authStore.user as Signal<User | null>;

  searchQuery = signal('');

  /** The currently selected category _id, or null for "All". */
  selectedCategory = signal<string | null>(null);

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const catId = this.selectedCategory();
    let products = this.productStore.products();
    if (catId) products = products.filter((p) => p.category === catId);
    if (q) products = products.filter((p) => p.name.toLowerCase().includes(q));
    return products;
  });

  readonly tax = computed(() => this.store.total() * 0.16);
  // readonly grandTotal = computed(() => this.store.total() + this.tax());
  readonly grandTotal = computed(() => this.store.total()); // Assuming tax is included in the product prices, so grand total is just the cart total

  ngOnInit() {
    this.productStore.setProducts(this.productStore.products());
  }
  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  setCategory(categoryId: string | null) {
    this.selectedCategory.set(categoryId);
  }

  addToCart(product: Product) {
    this.store.addToCart(product);
  }

  increment(productId: string) {
    this.store.incrementItem(productId);
  }

  decrement(productId: string) {
    this.store.decrementItem(productId);
  }

  removeItem(productId: string) {
    this.store.removeFromCart(productId);
  }

  clearCart() {
    this.store.clearCart();
  }

  processPayment() {
    if (this.store.items().length === 0) return;

    // Guard: no payment allowed without an active shift
    const shift = this.activeShift();
    if (!shift) {
      this.sweetAlert.warning(
        'Cannot process payment — no active shift. Please open a shift first.',
      );
      return;
    }

    const total = this.grandTotal();

    // Snapshot the cart before clearing — needed for stock adjustment after async success
    const cartSnapshot = [...this.cartItems()];

    const lineItems = cartSnapshot.map((item: CartItem) => {
      const subTotal = item.quantity * item.product.sellingPrice;
      return {
        productId: item.product._id!,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.product.sellingPrice,
        subTotal,
        confirmed: false,
      } as LineItem;
    });

    const saleTotalAmount = lineItems.reduce((sum, line) => sum + line.subTotal, 0);
    const sale: SaleItem = { items: lineItems, totalAmount: saleTotalAmount, shiftId: shift._id };

    this.saleStore.addSale(sale).subscribe({
      next: (newSale) => {
        // Decrement inventory for every item in the completed sale
        cartSnapshot.forEach((item: CartItem) => {
          this.productStore.adjustStock(item.product._id!, -item.quantity);
        });
        // Print receipt in duplicate (opens browser print dialog)
        this.receiptService.print({
          sale: newSale,
          cashier: this.currentUser(),
          shift: this.activeShift(),
          cartSnapshot,
          grandTotal: total,
        });
        this.store.clearCart();
        this.sweetAlert.success(`Payment of Ksh.${total.toFixed(2)} processed!`);
      },
      error: () => {
        this.sweetAlert.error('Payment failed. Please try again.');
      },
    });
  }

  goToManagement() {
    this.router.navigate(['/management']);
  }

  logout() {
    this.authStore.logout();
    this.router.navigate(['/login']);
  }

  formatCurrency(value: number): string {
    return `Ksh.${value.toFixed(2)}`;
  }

  getCartQuantity(productId: string): number {
    return this.store.items().find((i) => i.product._id === productId)?.quantity ?? 0;
  }

  /** Deterministic pastel background for a product tile based on its name. */
  getCardColor(name: string): string {
    const colors = [
      '#EFF6FF',
      '#F0FDF4',
      '#FFF7ED',
      '#FDF4FF',
      '#FEFCE8',
      '#F0FDFA',
      '#FFF1F2',
      '#F5F3FF',
      '#ECFDF5',
      '#FFFBEB',
      '#E0F2FE',
      '#FAE8FF',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  /** Matching darker accent color for the product name text. */
  getCardAccent(name: string): string {
    const accents = [
      '#1D4ED8',
      '#15803D',
      '#C2410C',
      '#7E22CE',
      '#A16207',
      '#0F766E',
      '#BE123C',
      '#6D28D9',
      '#065F46',
      '#92400E',
      '#0369A1',
      '#86198F',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return accents[Math.abs(hash) % accents.length];
  }

  /** Category image seeded from the category name. */
  getCategoryImage(name: string): string {
    return `https://picsum.photos/seed/${encodeURIComponent(name + '-cat')}/160/100`;
  }
}
