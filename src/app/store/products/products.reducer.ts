import { createFeature, createReducer, on } from '@ngrx/store';
import { Product } from '../../core/models/product.model';
import { ProductsActions } from './products.actions';
import { MOCK_PRODUCTS } from '../mock-data';

export interface ProductsState {
  products: Product[];
}

const initialState: ProductsState = {
  products: MOCK_PRODUCTS,
};

export const productsFeature = createFeature({
  name: 'products',
  reducer: createReducer(
    initialState,
    on(ProductsActions.loadProducts, (state, { products }) => ({
      ...state,
      products,
    })),
    on(ProductsActions.deleteProduct, (state, { id }) => ({
      ...state,
      products: state.products.filter((p) => p.id !== id),
    })),
    on(ProductsActions.updateProduct, (state, { product }) => ({
      ...state,
      products: state.products.map((p) => (p.id === product.id ? product : p)),
    }))
  ),
});

export const productsReducer = productsFeature.reducer;
