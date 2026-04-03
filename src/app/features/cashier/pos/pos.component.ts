import { Component, inject, computed, signal } from '@angular/core';
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
import { selectProducts } from '../../../store/products/products.selectors';
import { selectCartItems, selectCartTotal, selectCartCount } from '../../../store/cart/cart.selectors';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { CartActions } from '../../../store/cart/cart.actions';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';

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
  private readonly store = inject(Store);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly allProducts = toSignal(this.store.select(selectProducts), { initialValue: [] });
  readonly cartItems = toSignal(this.store.select(selectCartItems), { initialValue: [] });
  readonly cartTotal = toSignal(this.store.select(selectCartTotal), { initialValue: 0 });
  readonly cartCount = toSignal(this.store.select(selectCartCount), { initialValue: 0 });
  readonly currentUser = toSignal(this.store.select(selectCurrentUser));

  searchQuery = signal('');

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.allProducts().filter((p) => p.name.toLowerCase().includes(q))
      : this.allProducts();
  });

  readonly tax = computed(() => this.cartTotal() * 0.1);
  readonly grandTotal = computed(() => this.cartTotal() + this.tax());

  onSearchChange(value: string) {
    this.searchQuery.set(value);
  }

  addToCart(product: Product) {
    this.store.dispatch(CartActions.addItem({ product }));
  }

  increment(productId: string) {
    this.store.dispatch(CartActions.incrementQuantity({ productId }));
  }

  decrement(productId: string) {
    this.store.dispatch(CartActions.decrementQuantity({ productId }));
  }

  removeItem(productId: string) {
    this.store.dispatch(CartActions.removeItem({ productId }));
  }

  clearCart() {
    this.store.dispatch(CartActions.clearCart());
  }

  processPayment() {
    if (this.cartItems().length === 0) return;
    const total = this.grandTotal();
    this.store.dispatch(CartActions.clearCart());
    this.snackBar.open(
      `Payment of $${total.toFixed(2)} processed successfully!`,
      'Done',
      { duration: 4000 }
    );
  }

  goToManagement() {
    this.router.navigate(['/management']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  getCartQuantity(productId: string): number {
    return this.cartItems().find((i) => i.product.id === productId)?.quantity ?? 0;
  }
}
