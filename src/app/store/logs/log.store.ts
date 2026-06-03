import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { ActivityLog, LogCategory } from '../../core/models/log.model';
import { LogService } from '../../core/services/log.service';

type LogState = {
  logs: ActivityLog[];
  loading: boolean;
  error: string | null;
};

const initialState: LogState = {
  logs: [],
  loading: false,
  error: null,
};

export const logStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, logService = inject(LogService)) => ({
    fetchLogs(type: LogCategory, from: string, to: string) {
      patchState(store, { loading: true, error: null });
      return logService.fetchLogs(type, from, to).pipe(
        tap((logs: any) => patchState(store, { logs, loading: false })),
        catchError((error) => {
          patchState(store, { loading: false, error: 'Failed to fetch logs. Please try again.' });
          return throwError(() => error);
        }),
      );
    },
    clearLogs() {
      patchState(store, { logs: [], error: null });
    },
  })),
);
