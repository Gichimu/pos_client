import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectIsAuthenticated } from '../../store/auth/auth.selectors';
import { authStore } from '../../store/auth/auth.store';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const authstore = inject(authStore);

  // return store.select(selectIsAuthenticated).pipe(
  //   take(1),
  //   map((isAuthenticated) =>
  //     isAuthenticated ? true : router.createUrlTree(['/login'])
  //   )
  // );

  return authstore.isAuthenticated() ? true : router.createUrlTree(['/login']);
};
