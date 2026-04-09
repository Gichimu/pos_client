import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { ProductService } from '../../core/services/product-service';
import { Product } from '../../core/models/product.model';

export type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
};

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

export const productStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, productService = inject(ProductService)) => ({
    setProducts(products: Product[]) {
      patchState(store, { products });
    },
    addProduct(product: Product) {
      productService.addProduct(product).subscribe({
        next: (newProduct: any) => {
          const currentProducts = store.products() as Product[];
          patchState(store, { products: [...currentProducts, newProduct] });
        },
        error: (error) => {
          patchState(store, { error: error.message });
        },
      });
    },
    updateProduct(product: Product) {
      productService.updateProduct(product).subscribe({
        next: (updatedProduct: any) => {
          const currentProducts = store.products() as Product[];
          patchState(store, {
            products: currentProducts.map((p) =>
              p._id === updatedProduct._id ? updatedProduct : p,
            ),
          });
        },
        error: (error) => {
          patchState(store, { error: error.message });
        },
      });
    },
    deleteProduct(id: string) {
      productService.deleteProduct(id).subscribe({
        next: () => {
          const currentProducts = store.products() as Product[];
          patchState(store, { products: currentProducts.filter((p) => p._id !== id) });
        },
        error: (error) => {
          patchState(store, { error: error.message });
        },
      });
    },
  })),
  withHooks({
    onInit(store, productService = inject(ProductService)) {
      productService.getAll().subscribe({
        next: (products) => {
          patchState(store, { products: products as Product[] });
        },
        error: (error) => {
          patchState(store, { error: error.message });
        },
      });
    },
  }),
);
