import { createFeature, createReducer, on } from '@ngrx/store';
import { CartItem } from '../../core/models/cart.model';
import { CartActions } from './cart.actions';

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = { items: [] };

export const cartFeature = createFeature({
  name: 'cart',
  reducer: createReducer(
    initialState,
    on(CartActions.addItem, (state, { product }) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i
          ),
        };
      }
      return { items: [...state.items, { product, quantity: 1 }] };
    }),
    on(CartActions.removeItem, (state, { productId }) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
    on(CartActions.incrementQuantity, (state, { productId }) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: i.quantity + 1 } : i
      ),
    })),
    on(CartActions.decrementQuantity, (state, { productId }) => ({
      items: state.items
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: i.quantity - 1 } : i
        )
        .filter((i) => i.quantity > 0),
    })),
    on(CartActions.clearCart, () => initialState)
  ),
});

export const cartReducer = cartFeature.reducer;
