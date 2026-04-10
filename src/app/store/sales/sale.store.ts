import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { PaymentMethod, SaleItem } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales-service';
import { Observable } from 'rxjs';

export type SaleConfirmStatus = 'pending' | 'confirmed';

interface SaleStoreState {
  items: SaleItem[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  isLoading: boolean;
}

const initialState: SaleStoreState = {
  items: [],
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  pageSize: 10,
  isLoading: false,
};

export const saleStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, salesService = inject(SalesService)) => ({
    setSales(sales: SaleItem[]) {
      patchState(store, { items: sales });
    },
    addSale(sale: SaleItem) {
      salesService.addSale(sale).subscribe({
        next: (newSale) => {
          patchState(store, { items: [...store.items(), newSale] });
        },
        error: () => {
          patchState(store, { items: [...store.items()] });
        },
      });
    },
    loadPage(page: number, cashierId?: string | null): void {
      patchState(store, { isLoading: true });
      salesService.getPage(page, store.pageSize(), cashierId).subscribe({
        next: (response) => {
          console.log('Sales page loaded:', response);
          patchState(store, {
            items: response.data,
            currentPage: response.page,
            totalPages: response.totalPages,
            totalItems: response.total,
            isLoading: false,
          });
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
  })),
  withHooks({
    onInit(store) {
      store.loadPage(1);
    },
  }),
);
