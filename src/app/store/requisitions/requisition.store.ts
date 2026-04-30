import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { RequisitionItem } from '../../core/models/shift.model';

interface RequisitionStoreState {
  items: RequisitionItem[];
}

const initialState: RequisitionStoreState = {
  items: [],
};

/**
 * Lightweight store that accumulates stock-addition (requisition) events
 * during the current shift. Cleared when a shift is closed.
 */
export const requisitionStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store) => ({
    addRequisition(item: RequisitionItem): void {
      // Merge with an existing entry for the same product if one exists
      const existing = store.items().find((r) => r.productId === item.productId);
      if (existing) {
        patchState(store, {
          items: store
            .items()
            .map((r) =>
              r.productId === item.productId
                ? { ...r, quantity: r.quantity + item.quantity, addedAt: item.addedAt }
                : r,
            ),
        });
      } else {
        patchState(store, { items: [...store.items(), item] });
      }
    },

    clearRequisitions(): void {
      patchState(store, { items: [] });
    },
  })),
);
