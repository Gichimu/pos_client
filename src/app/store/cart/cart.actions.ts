import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Product } from '../../core/models/product.model';

export const CartActions = createActionGroup({
  source: 'Cart',
  events: {
    'Add Item': props<{ product: Product }>(),
    'Remove Item': props<{ productId: string }>(),
    'Increment Quantity': props<{ productId: string }>(),
    'Decrement Quantity': props<{ productId: string }>(),
    'Clear Cart': emptyProps(),
  },
});
