import { createActionGroup, props } from '@ngrx/store';
import { Product } from '../../core/models/product.model';

export const ProductsActions = createActionGroup({
  source: 'Products',
  events: {
    'Load Products': props<{ products: Product[] }>(),
    'Delete Product': props<{ id: string }>(),
    'Update Product': props<{ product: Product }>(),
  },
});
