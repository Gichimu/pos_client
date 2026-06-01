import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { User } from '../../core/models/user.model';
import { inject } from '@angular/core';
import { UserService } from '../../core/services/user-service';
import { catchError, tap, throwError } from 'rxjs';

const initialState = {
  users: [] as User[],
  loading: false,
  error: null as any,
};

export const userStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods((store, userService = inject(UserService)) => ({
    setUsers(users: User[]) {},
    loadUsers() {
      patchState(store, { loading: true });
      return userService.getAll().pipe(
        tap((users: User[]) => {
          patchState(store, { users, loading: false, error: null });
        }),
        catchError((error) => {
          patchState(store, { loading: false, error });
          return throwError(() => error);
        }),
      );
    },
    addUser(user: User) {
      // userService.addUser(user).subscribe({
      //   next: (newUser) => {
      //     console.log('added user', newUser);
      //     const currentUsers = store.users() as User[];
      //     patchState(store, { users: [...currentUsers, newUser] });
      //   },
      //   error: (error) => {
      //     // Handle error as needed, e.g., patchState to set an error message
      //     patchState(store, { error: error });
      //   },
      // });
      return userService.addUser(user).pipe(
        tap((newUser: User) => {
          console.log('added user', newUser);
          // add new user to
          const currentUsers = store.users() as User[];
          patchState(store, { users: [...currentUsers, newUser] });
        }),
        catchError((error) => {
          console.error('Failed to add user:', error);
          patchState(store, { error: error });
          return throwError(() => error);
        }),
      );
    },
    updateUser(user: User) {
      userService.updateUser(user).subscribe({
        next: (updatedUser) => {
          console.log('updated user', updatedUser);
          const currentUsers = store.users() as User[];
          patchState(store, {
            users: currentUsers.map((u) => (u._id === updatedUser._id ? updatedUser : u)),
          });
        },
        error: (error) => {
          // Handle error as needed
          patchState(store, { error: error });
        },
      });
    },
    deleteUser(id: string) {
      userService.deleteUser(id).subscribe({
        next: () => {
          console.log('deleted user id', id);
          const currentUsers = store.users() as User[];
          patchState(store, { users: currentUsers.filter((u) => u._id !== id) });
        },
        error: (error) => {
          // Handle error as needed
          patchState(store, { error: error });
        },
      });
    },
  })),
  withHooks({
    onInit(store) {
      store.loadUsers();
    },
  }),
);
