import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { SaleItem } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales-service';

export type SaleConfirmStatus = 'pending' | 'confirmed';

const initialState: { items: SaleItem[] } = { items: [] };

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
        error: (error) => {
          patchState(store, { items: [...store.items()] }); // Optionally handle error state
        },
      });
    },
  })),
  withHooks({
    onInit(store, salesService = inject(SalesService)) {
      salesService.getAll().subscribe({
        next: (sales: SaleItem[]) => {
          console.log('fetched sales', sales);
          patchState(store, { items: sales });
        },
        error: (error) => {
          // Handle error as needed, e.g., patchState to set an error message
          patchState(store, { items: [] }); // Clear items on error or set an error state
        },
      });
    },
  }),
);
