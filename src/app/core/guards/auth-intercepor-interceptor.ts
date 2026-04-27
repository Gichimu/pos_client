import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

/** Auth endpoints must never trigger the refresh logic — they are the refresh. */
const AUTH_PATHS = ['/auth/login', '/auth/refresh-token', '/auth/logout', '/auth/confirm-account'];
const isAuthUrl = (url: string) => AUTH_PATHS.some((p) => url.includes(p));

export const authInterceporInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');

  // ── Auth endpoints: just pass through (no token injection, no refresh) ────
  if (isAuthUrl(req.url)) {
    return next(req);
  }

  // ── 1. Proactive token check ──────────────────────────────────────────────
  // If the stored token is already expired, refresh it BEFORE sending the
  // request so that workflows never experience a 401 mid-flight.
  if (token && !authService.tokenIsValid(token) && refreshToken) {
    return authService.refreshToken(refreshToken).pipe(
      switchMap((newToken: any) => {
        localStorage.setItem('token', newToken.token);
        localStorage.setItem('refreshToken', newToken.refreshToken);
        return next(
          req.clone({ setHeaders: { Authorization: `Bearer ${newToken.token}` } }),
        );
      }),
      catchError((err) => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        return throwError(() => err);
      }),
    );
  }

  // ── 2. Attach current token and send request ──────────────────────────────
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  // ── 3. React to unexpected 401 (e.g. token revoked server-side) ──────────
  return next(authReq).pipe(
    catchError((error) => {
      if (error.status !== 401 || !refreshToken) {
        return throwError(() => error);
      }

      localStorage.removeItem('token');

      return authService.refreshToken(refreshToken).pipe(
        switchMap((newToken: any) => {
          localStorage.setItem('token', newToken.token);
          localStorage.setItem('refreshToken', newToken.refreshToken);
          return next(
            req.clone({ setHeaders: { Authorization: `Bearer ${newToken.token}` } }),
          );
        }),
        catchError((refreshError) => {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
