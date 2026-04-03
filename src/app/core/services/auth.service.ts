import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '../models/user.model';
import { AuthActions } from '../../store/auth/auth.actions';

const AUTH_STORAGE_KEY = 'pos_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly store = inject(Store);

  initializeAuth(): void {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      try {
        const user: User = JSON.parse(stored);
        this.store.dispatch(AuthActions.loginSuccess({ user }));
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
  }

  login(user: User): void {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    this.store.dispatch(AuthActions.loginSuccess({ user }));
  }

  logout(): void {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.store.dispatch(AuthActions.logout());
  }
}
