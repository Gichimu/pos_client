import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { User } from '../../core/models/user.model';
import { inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

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
      authService.login(user).subscribe({
        next: (response) => {
          // Assuming the response contains the authenticated user data
          const authenticatedUser: User = response.user;
          patchState(store, { user: authenticatedUser, isAuthenticated: true });
        },
        error: (error) => {
          // Handle login error as needed, e.g., set an error message in the state
          console.error('Login failed', error);
        },
      });
    },
    logout() {
      authService.logout().subscribe({
        next: () => {
          patchState(store, { user: null, isAuthenticated: false });
        },
        error: (error) => {
          // Handle logout error as needed
          console.error('Logout failed', error);
        },
      });
    },
  })),
);
