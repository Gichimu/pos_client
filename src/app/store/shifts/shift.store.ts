import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Observable } from 'rxjs';
import { CloseShiftDto, OpenShiftDto, Shift } from '../../core/models/shift.model';
import { ShiftService } from '../../core/services/shift-service';

interface ShiftStoreState {
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShiftStoreState = {
  shifts: [],
  isLoading: false,
  error: null,
};

export const shiftStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    /** The single currently active shift, or null. */
    activeShift: computed(() => store.shifts().find((s) => s.status === 'Open') ?? null),
  })),
  withMethods((store, shiftService = inject(ShiftService)) => ({
    loadShifts(): void {
      patchState(store, { isLoading: true, error: null });
      shiftService.getAll().subscribe({
        next: (shifts: any) => {
          shifts = shifts.map((s: any) => ({
            ...s,
            totalSales: s.systemSales ? s.systemSales.cash + s.systemSales['m-pesa'] : 0,
          }));
          patchState(store, { shifts, isLoading: false });
        },
        error: (err) =>
          patchState(store, { isLoading: false, error: err.message ?? 'Failed to load shifts' }),
      });
    },

    openShift(dto: OpenShiftDto): Observable<Shift> {
      return new Observable((observer) => {
        shiftService.openShift(dto).subscribe({
          next: (shift) => {
            patchState(store, { shifts: [shift, ...store.shifts()] });
            observer.next(shift);
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    closeShift(shiftId: string, dto: CloseShiftDto): Observable<void> {
      return new Observable((observer) => {
        shiftService.closeShift(shiftId, dto).subscribe({
          next: (updated) => {
            patchState(store, {
              shifts: store.shifts().map((s) => (s._id === shiftId ? updated : s)),
            });
            observer.next();
            observer.complete();
          },
          error: (err) => observer.error(err),
        });
      });
    },

    deleteShift(shiftId: string): Observable<void> {
      return new Observable((observer) => {
        shiftService.deleteShift(shiftId).subscribe({
          next: () => {
            patchState(store, { shifts: store.shifts().filter((s) => s._id !== shiftId) });
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
      store.loadShifts();
    },
  }),
);
