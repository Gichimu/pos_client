import { patchState, signalStore, withHooks, withMethods, withState } from '@ngrx/signals';
import { User } from '../../core/models/user.model';
import { inject } from '@angular/core';
import { UserService } from '../../core/services/user-service';

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
    addUser(user: User) {
      userService.addUser(user).subscribe({
        next: (newUser) => {
          console.log('added user', newUser);
          const currentUsers = store.users() as User[];
          patchState(store, { users: [...currentUsers, newUser] });
        },
        error: (error) => {
          // Handle error as needed, e.g., patchState to set an error message
          patchState(store, { error: error });
        },
      });
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
    onInit(store, userService = inject(UserService)) {
      // Optionally, you can load initial users here by calling an API or using a service.
      // For example: this.loadUsers();
      userService.getAll().subscribe({
        next: (users: User[]) => {
          console.log('finding users', users);
          patchState(store, { users: users, loading: false, error: null });
        },
        error: (error) => patchState(store, { loading: false, error: error }), // Handle error as needed
      });
    },
  }),
);
