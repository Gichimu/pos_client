import { Component, inject, computed, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { authStore } from '../../../store/auth/auth.store';
import { User } from '../../../core/models/user.model';
import { productStore } from '../../../store/products/product.store';
import { cartStore } from '../../../store/cart/cart.store';
import { CartItem } from '../../../core/models/cart.model';
import { LineItem, SaleItem } from '../../../core/models/sale.model';
import { saleStore } from '../../../store/sales/sale.store';

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
export class PosComponent {
  readonly store = inject(cartStore);
  readonly saleStore = inject(saleStore);
  readonly productStore = inject(productStore);
  cartItems = this.store.items as Signal<any[]>;
  cartTotal = this.store.total as Signal<number>;
  private readonly authStore = inject(authStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentUser = this.authStore.user as Signal<User | null>;

  searchQuery = signal('');

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.productStore.products().filter((p) => p.name.toLowerCase().includes(q))
      : this.productStore.products();
  });

  readonly tax = computed(() => this.store.total() * 0.16);
  readonly grandTotal = computed(() => this.store.total() + this.tax());

  onSearchChange(value: string) {
    this.searchQuery.set(value);
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
    const total = this.grandTotal();
    // this.store.clearCart();
    // send to receipt printer or backend API here
    const lineItems = this.cartItems().map((item: CartItem) => {
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
    const sale: SaleItem = {
      items: lineItems,
      totalAmount: saleTotalAmount,
    };
    console.log('check cartItems', sale);
    this.saleStore.addSale(sale);
    this.store.clearCart();
    this.snackBar.open(`Payment of $${total.toFixed(2)} processed successfully!`, 'Done', {
      duration: 4000,
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
}
