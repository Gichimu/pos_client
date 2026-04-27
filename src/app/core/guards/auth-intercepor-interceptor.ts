import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError, tap, switchMap } from 'rxjs';

export const authInterceporInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');
  if (token) {
    // Check if token is valid before attaching it to the request
    if (authService.tokenIsValid(token)) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    } else {
      // If token is expired, remove it from localStorage
      localStorage.removeItem('token');
      const refreshToken = localStorage.getItem('refreshToken') || '';
      return authService
        .refreshToken(refreshToken)
        .pipe(switchMap((token) => next(injectToken(req, token))));
    }
  }
  return next(req);
  // if request was not successful, remove token from localStorage (user may have been logged out from another tab)
  // return next(req).pipe(
  //   catchError((error) => {
  //     if (error.status === 401) {
  //       localStorage.removeItem('token');
  //       // use the refreshed token to retry the request once
  //       const refreshToken = localStorage.getItem('refreshToken') || '';
  //       authService.refreshToken(refreshToken).subscribe({
  //         next: (newToken: any) => {
  //           localStorage.setItem('token', newToken.token);
  //           localStorage.setItem('refreshToken', newToken.refreshToken);
  //           const retryReq = req.clone({
  //             setHeaders: {
  //               Authorization: `Bearer ${newToken.token}`,
  //             },
  //           });
  //           return next(retryReq).toPromise();
  //         },
  //         error: () => {
  //           // If token refresh also fails, propagate the original error
  //           return throwError(() => error);
  //         },
  //       });
  //     }
  //     return throwError(() => error);
  //   }),
  // );
};

const injectToken = (req: any, token: any) => {
  localStorage.setItem('token', token.token);
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token.token}`,
    },
  });
};
