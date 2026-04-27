import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { User } from '../../core/models/user.model';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  /** Populated when the logged-in user has status === 'pending'. */
  pendingUser: User | null;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  pendingUser: null,
};

export const authStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authService = inject(AuthService)) => ({
    login(user: User) {
      return authService.login(user).pipe(
        tap((response) => {
          const authenticatedUser: User = response.user;
          if (authenticatedUser.status === 'pending') {
            // Store pending user — they must set a new password before accessing the app
            patchState(store, { pendingUser: authenticatedUser, isAuthenticated: false });
          } else {
            localStorage.setItem('token', response.token);
            localStorage.setItem('refreshToken', response.refreshToken);
            patchState(store, {
              user: authenticatedUser,
              isAuthenticated: true,
              pendingUser: null,
            });
          }
        }),
        catchError((error) => {
          console.error('Login failed', error);
          return throwError(() => error);
        }),
      );
    },
    confirmAccount(newPassword: string) {
      const pendingUser = store.pendingUser();
      if (!pendingUser?._id) return throwError(() => new Error('No pending user'));
      return authService.confirmAccount(pendingUser._id, newPassword).pipe(
        tap((response) => {
          const activatedUser: User = response.user ?? { ...pendingUser, status: 'active' };
          localStorage.setItem('token', response.token ?? '');
          localStorage.setItem('refreshToken', response.refreshToken ?? '');
          patchState(store, { pendingUser: null, user: null, isAuthenticated: false });
        }),
        catchError((error) => {
          console.error('Confirm account failed', error);
          return throwError(() => error);
        }),
      );
    },
    clearPendingUser() {
      patchState(store, { pendingUser: null });
    },
    logout() {
      const refreshToken = localStorage.getItem('refreshToken') || '';
      authService.logout(refreshToken).subscribe({
        next: () => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          patchState(store, { user: null, isAuthenticated: false, pendingUser: null });
        },
      });
    },
  })),
);
