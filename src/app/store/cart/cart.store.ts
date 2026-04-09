import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { CartItem } from '../../core/models/cart.model';
import { Product } from '../../core/models/product.model';
import { SaleItem } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales-service';
import { inject } from '@angular/core';

export type CartState = {
  items: CartItem[];
  total: number;
};

const initialState: CartState = {
  items: [],
  total: 0,
};

const calculateTotal = (items: CartItem[]) =>
  items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

export const cartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, salesService = inject(SalesService)) => ({
    addToCart(product: Product, quantity: number = 1) {
      const currentItems = store.items() as CartItem[];
      const existingItemIndex = currentItems.findIndex((item) => item.product._id === product._id);
      const updatedItems = [...currentItems];

      if (existingItemIndex >= 0) {
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
      } else {
        updatedItems.push({ product, quantity });
      }

      patchState(store, {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      });
    },

    incrementItem(productId: string) {
      const currentItems = store.items() as CartItem[];
      const updatedItems = currentItems.map((item) =>
        item.product._id === productId ? { ...item, quantity: item.quantity + 1 } : item,
      );
      patchState(store, {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      });
    },

    decrementItem(productId: string) {
      const currentItems = store.items() as CartItem[];
      const updatedItems = currentItems
        .map((item) =>
          item.product._id === productId ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0);
      patchState(store, {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      });
    },

    removeFromCart(productId: string) {
      const currentItems = store.items() as CartItem[];
      const updatedItems = currentItems.filter((item) => item.product._id !== productId);
      patchState(store, {
        items: updatedItems,
        total: calculateTotal(updatedItems),
      });
    },

    clearCart() {
      patchState(store, { items: [], total: 0 });
    },

    setItems(items: CartItem[]) {
      patchState(store, { items, total: calculateTotal(items) });
    },
  })),
);
