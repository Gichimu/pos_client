import { createFeature, createReducer, on } from '@ngrx/store';
import { User } from '../../core/models/user.model';
import { AuthActions } from './auth.actions';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

export const authFeature = createFeature({
  name: 'auth',
  reducer: createReducer(
    initialState,
    on(AuthActions.loginSuccess, (state, { user }) => ({
      ...state,
      user,
      isAuthenticated: true,
    })),
    on(AuthActions.logout, () => ({ ...initialState }))
  ),
});

export const authReducer = authFeature.reducer;
