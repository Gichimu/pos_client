import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { User } from '../../core/models/user.model';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export const authStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, authService = inject(AuthService)) => ({
    login(user: User) {
      return authService.login(user).pipe(
        tap((response) => {
          // Assuming the response contains the authenticated user data
          const authenticatedUser: User = response.user;
          localStorage.setItem('token', response.token); // Store the token for future requests
          patchState(store, { user: authenticatedUser, isAuthenticated: true });
        }),
        catchError((error) => {
          // Handle login error as needed, e.g., set an error message in the state
          console.error('Login failed', error);
          return throwError(() => error);
        }),
      );
    },
    logout() {
      authService.logout().subscribe({
        next: () => {
          localStorage.removeItem('token'); // Clear the token on logout
          patchState(store, { user: null, isAuthenticated: false });
        },
      });
    },
  })),
);
