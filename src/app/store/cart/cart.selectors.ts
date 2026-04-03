import { createSelector } from '@ngrx/store';
import { cartFeature } from './cart.reducer';

export const { selectItems: selectCartItems } = cartFeature;

export const selectCartTotal = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0)
);

export const selectCartCount = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);
