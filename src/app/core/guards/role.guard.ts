import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs/operators';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const store = inject(Store);
    const router = inject(Router);

    return store.select(selectCurrentUser).pipe(
      take(1),
      map((user) => {
        if (user && allowedRoles.includes(user.role)) return true;
        return router.createUrlTree(['/login']);
      })
    );
  };
};
