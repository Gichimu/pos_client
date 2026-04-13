import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { ProductService } from '../../core/services/product-service';
import { Product, StockReorderStatus } from '../../core/models/product.model';

export type ProductState = {
  products: Product[];
  loading: boolean;
  error: string | null;
};

export const calculateReorderStatusValue = (
  currentStock: number,
  reorderLevel: number,
): StockReorderStatus => {
  if (currentStock <= reorderLevel * 0.2) {
    return 'critical';
  } else if (currentStock <= reorderLevel) {
    return 'low';
  } else {
    return 'good';
  }
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
        next: (newProduct: Product) => {
          const currentProducts = store.products() as Product[];
          newProduct.stockReorderStatus = calculateReorderStatusValue(
            newProduct.currentStock,
            newProduct.stockReorderLevel,
          );
          patchState(store, { products: [...currentProducts, newProduct] });
        },
        error: (error) => {
          patchState(store, { error: error.message });
        },
      });
    },

    loadProducts() {
      patchState(store, { loading: true });
      productService.getAll().subscribe({
        next: (products: Product[]) => {
          products = products.map((p) => ({
            ...p,
            stockReorderStatus: calculateReorderStatusValue(p.currentStock, p.stockReorderLevel),
          }));
          patchState(store, { products: products as Product[], loading: false });
        },
        error: (error) => {
          patchState(store, { error: error.message, loading: false });
        },
      });
    },

    updateProduct(product: Product) {
      productService.updateProduct(product).subscribe({
        next: (updatedProduct: Product) => {
          const currentProducts = store.products() as Product[];
          updatedProduct.stockReorderStatus = calculateReorderStatusValue(
            updatedProduct.currentStock,
            updatedProduct.stockReorderLevel,
          );
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
    /**
     * Optimistically adjusts the currentStock of a product by `delta`.
     * Pass a negative delta for sales (stock consumed) and a positive delta
     * for deletions / reversals (stock restored).
     */
    adjustStock(productId: string, delta: number) {
      patchState(store, {
        products: store.products().map((p) => {
          if (p._id !== productId) return p;
          const newStock = Math.max(0, p.currentStock + delta);
          return {
            ...p,
            currentStock: newStock,
            stockReorderStatus: calculateReorderStatusValue(newStock, p.stockReorderLevel),
          };
        }),
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
      // productService.getAll().subscribe({
      //   next: (products: Product[]) => {
      //     products = products.map((p) => ({
      //       ...p,
      //       stockReorderStatus: calculateReorderStatusValue(p.currentStock, p.stockReorderLevel),
      //     }));
      //     patchState(store, { products: products as Product[] });
      //   },
      //   error: (error) => {
      //     patchState(store, { error: error.message });
      //   },
      // });
      store.loadProducts();
    },
  }),
);
