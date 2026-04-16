import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { User } from '../models/user.model';
import { AuthActions } from '../../store/auth/auth.actions';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment.development';
import { Observable } from 'rxjs';

const AUTH_STORAGE_KEY = 'pos_auth_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // private readonly store = inject(Store);
  http = inject(HttpClient);

  login(user: User): Observable<any> {
    // localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    // this.store.dispatch(AuthActions.loginSuccess({ user }));

    return this.http.post(`${environment.apiUrl}/auth/login`, {
      email: user.email,
      password: user.password,
    });
  }

  refreshToken(token: string): Observable<string> {
    return this.http.post<string>(`${environment.apiUrl}/auth/refresh-token`, {
      refreshToken: token,
    });
  }

  logout(refresh: string): Observable<any> {
    // localStorage.removeItem(AUTH_STORAGE_KEY);
    // this.store.dispatch(AuthActions.logout());

    return this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken: refresh });
  }
}
