import { authFeature } from './auth.reducer';

export const {
  selectUser: selectCurrentUser,
  selectIsAuthenticated,
} = authFeature;
