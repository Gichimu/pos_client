import { inject } from '@angular/core';
import { signalStore, withState, withMethods, patchState, withHooks } from '@ngrx/signals';
import { PaymentMethod, SaleItem } from '../../core/models/sale.model';
import { SalesService } from '../../core/services/sales-service';
import { Observable, catchError, forkJoin, tap, throwError } from 'rxjs';

export type SaleConfirmStatus = 'pending' | 'confirmed';

interface SaleStoreState {
  /** Raw sale documents as returned by the API. */
  items: SaleItem[];
  pendingReturns: any[];
  isLoading: boolean;
}

const initialState: SaleStoreState = {
  items: [],
  pendingReturns: [],
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
      // return new Observable((observer) => {
      //   salesService.addSale(sale).subscribe({
      //     next: (newSale) => {
      //       patchState(store, { items: [...store.items(), newSale] });
      //       observer.next(newSale);
      //       observer.complete();
      //     },
      //     error: (err) => observer.error(err),
      //   });
      // });
      return salesService.addSale(sale).pipe(
        tap((newSale) => {
          patchState(store, { items: [...store.items(), newSale] });
        }),
        catchError((err) => {
          console.error('Error adding sale:', err);
          return throwError(() => err);
        }),
      );
    },

    /**
     * Fetch all sales from the API, optionally filtered by date range and/or cashier.
     * Replaces the full items list — no server-side pagination.
     */
    loadSales(options?: {
      cashierId?: string | null;
      startDate?: string | null;
      endDate?: string | null;
    }): void {
      patchState(store, { isLoading: true });
      salesService.getAll(options).subscribe({
        next: (response: any) => {
          console.log('API response for sales:', response);
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

    /** Permanently deletes an entire sale record. */
    deleteSale(saleId: string): Observable<void> {
      return new Observable((observer) => {
        salesService.deleteSale(saleId).subscribe({
          next: () => {
            patchState(store, { items: store.items().filter((s) => s._id !== saleId) });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    /** Confirms an entire sale with a payment method. */
    confirmSale(
      saleId: string,
      paymentMethod: PaymentMethod,
      splitAmounts?: { cashAmount: number; mpesaAmount: number },
      mpesaTransactionId?: string[],
    ): Observable<void> {
      return new Observable((observer) => {
        salesService
          .confirmSale(saleId, paymentMethod, splitAmounts, mpesaTransactionId)
          .subscribe({
            next: (updatedSale) => {
              patchState(store, {
                items: store
                  .items()
                  .map((s) =>
                    s._id === saleId
                      ? { ...s, confirmed: true, paymentMethod, mpesaTransactionId }
                      : s,
                  ),
              });
              observer.next();
              observer.complete();
            },
            error: (err) => observer.error(err),
          });
      });
    },

    /** Reverts a confirmed sale back to pending. */
    unconfirmSale(saleId: string): Observable<void> {
      return new Observable((observer) => {
        salesService.unconfirmSale(saleId).subscribe({
          next: () => {
            patchState(store, {
              items: store.items().map((s) => (s._id === saleId ? { ...s, confirmed: false } : s)),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    /** Confirms multiple pending sales in parallel with a single payment method. */
    confirmBulk(
      saleIds: string[],
      paymentMethod: PaymentMethod,
      splitAmounts?: { cashAmount: number; mpesaAmount: number },
      mpesaTransactionId?: string[],
    ): Observable<void> {
      return new Observable((observer) => {
        if (saleIds.length === 0) {
          observer.next();
          observer.complete();
          return;
        }

        const selectedSales = store.items().filter((s) => s._id && saleIds.includes(s._id));
        const totalBulkAmount = selectedSales.reduce((sum, s) => sum + s.totalAmount, 0);

        const calls = selectedSales.map((sale) => {
          let currentSplit = undefined;

          if (paymentMethod === 'Split' && splitAmounts) {
            // Distribute the split amounts proportionally based on the sale's total amount
            const ratio = sale.totalAmount / totalBulkAmount;
            currentSplit = {
              cashAmount: splitAmounts.cashAmount * ratio,
              mpesaAmount: splitAmounts.mpesaAmount * ratio,
            };
          }

          return salesService.confirmSale(
            sale._id!,
            paymentMethod,
            currentSplit,
            mpesaTransactionId,
          );
        });

        forkJoin(calls).subscribe({
          next: () => {
            patchState(store, {
              items: store.items().map((s) => {
                if (s._id && saleIds.includes(s._id)) {
                  let sSplit = undefined;
                  if (paymentMethod === 'Split' && splitAmounts) {
                    const ratio = s.totalAmount / totalBulkAmount;
                    sSplit = {
                      cashAmount: splitAmounts.cashAmount * ratio,
                      mpesaAmount: splitAmounts.mpesaAmount * ratio,
                    };
                  }
                  return {
                    ...s,
                    confirmed: true,
                    paymentMethod,
                    splitAmounts: sSplit,
                    mpesaTransactionId,
                  };
                }
                return s;
              }),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    /** Voids an entire sale — removes it from store after backend confirms. */
    voidSale(saleId: string): Observable<SaleItem> {
      return new Observable((observer) => {
        salesService.voidSale(saleId).subscribe({
          next: (voidedSale) => {
            patchState(store, { items: store.items().filter((s) => s._id !== saleId) });
            observer.next(voidedSale);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    loadPendingReturns(): void {
      patchState(store, { isLoading: true });
      salesService.getPendingReturns().subscribe({
        next: (returns) => {
          patchState(store, { pendingReturns: returns, isLoading: false });
        },
        error: () => {
          patchState(store, { isLoading: false });
        },
      });
    },

    returnItem(saleId: string, itemId: string): Observable<SaleItem> {
      return salesService.returnItem(saleId, itemId).pipe(
        tap((updatedSale) => {
          patchState(store, {
            items: store
              .items()
              .map((s) => (s._id === saleId ? updatedSale : s))
              .filter((s) => s.items.length > 0),
          });
          // Also reload returns to update the badge
          salesService.getPendingReturns().subscribe((returns) => {
            patchState(store, { pendingReturns: returns });
          });
        }),
      );
    },

    confirmReturn(returnId: string): Observable<SaleItem> {
      return salesService.confirmReturn(returnId).pipe(
        tap((updatedSale) => {
          patchState(store, {
            pendingReturns: store.pendingReturns().filter((r) => r._id !== returnId),
            items: store.items().map((s) => (s._id === updatedSale._id ? updatedSale : s)),
          });
        }),
      );
    },
  })),
  withHooks({
    onInit(store) {
      // Initial load with no filters; the report component will re-fetch with date params
      store.loadSales();
      store.loadPendingReturns();
    },
  }),
);
