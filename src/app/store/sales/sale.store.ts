import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { PaymentMethod, SaleItem } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales-service';
import { Observable } from 'rxjs';

export type SaleConfirmStatus = 'pending' | 'confirmed';

interface SaleStoreState {
  /** Raw sale documents as returned by the API. */
  items: SaleItem[];
  isLoading: boolean;
}

const initialState: SaleStoreState = {
  items: [],
  isLoading: false,
};

export const saleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, salesService = inject(SalesService)) => ({
    setSales(sales: SaleItem[]) {
      patchState(store, { items: sales });
    },

    addSale(sale: SaleItem): Observable<SaleItem> {
      return new Observable((observer) => {
        salesService.addSale(sale).subscribe({
          next: (newSale) => {
            patchState(store, { items: [...store.items(), newSale] });
            observer.next(newSale);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    /**
     * Fetch all sales from the API, optionally filtered by cashier.
     * Replaces the full items list — no server-side pagination.
     */
    loadSales(cashierId?: string | null): void {
      patchState(store, { isLoading: true });
      salesService.getAll(cashierId).subscribe({
        next: (response: any) => {
          // Guard: server may return either SaleItem[] or a paginated envelope { data, total, … }
          const sales: SaleItem[] = Array.isArray(response) ? response : (response?.data ?? []);
          patchState(store, { items: sales, isLoading: false });
        },
        error: () => {
          patchState(store, { isLoading: false });
        },
      });
    },

    confirmItem(itemId: string, saleId: string, paymentMethod: PaymentMethod): Observable<void> {
      return new Observable((observer) => {
        salesService.confirmItem(itemId, saleId, paymentMethod).subscribe({
          next: () => {
            patchState(store, {
              items: store.items().map((sale) => ({
                ...sale,
                items: sale.items.map((item) =>
                  item._id === itemId ? { ...item, confirmed: true, paymentMethod } : item,
                ),
              })),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    unconfirmItem(itemId: string, saleId: string): Observable<void> {
      return new Observable((observer) => {
        salesService.unconfirmItem(itemId, saleId).subscribe({
          next: () => {
            patchState(store, {
              items: store.items().map((sale) => ({
                ...sale,
                items: sale.items.map((item) =>
                  item._id === itemId ? { ...item, confirmed: false, paymentMethod: null } : item,
                ),
              })),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    deleteLineItem(itemId: string, saleId: string): Observable<void> {
      return new Observable((observer) => {
        salesService.deleteLineItem(saleId, itemId).subscribe({
          next: () => {
            patchState(store, {
              items: store
                .items()
                .map((sale) =>
                  sale._id === saleId
                    ? { ...sale, items: sale.items.filter((i) => i._id !== itemId) }
                    : sale,
                )
                .filter((sale) => sale.items.length > 0),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadSales();
    },
  }),
);
