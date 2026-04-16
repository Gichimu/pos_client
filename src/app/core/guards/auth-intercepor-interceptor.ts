import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, tap } from 'rxjs';

export const authInterceporInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
  // if request was not successful, remove token from localStorage (user may have been logged out from another tab)
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('token');
        // use the refreshed token to retry the request once
        const refreshToken = localStorage.getItem('refreshToken') || '';
        authService.refreshToken(refreshToken).subscribe({
          next: (newToken: any) => {
            localStorage.setItem('token', newToken.token);
            localStorage.setItem('refreshToken', newToken.refreshToken);
            const retryReq = req.clone({
              setHeaders: {
                Authorization: `Bearer ${newToken.token}`,
              },
            });
            return next(retryReq).toPromise();
          },
          error: () => {
            // If token refresh also fails, propagate the original error
            return throwError(() => error);
          },
        });
      }
      return throwError(() => error);
    }),
  );
};
