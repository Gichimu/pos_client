import {
  APP_INITIALIZER,
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { authReducer } from './store/auth/auth.reducer';
import { productsReducer } from './store/products/products.reducer';
import { cartReducer } from './store/cart/cart.reducer';
import { AuthService } from './core/services/auth.service';
import { authInterceporInterceptor } from './core/guards/auth-intercepor-interceptor';

function initializeAuth(authService: AuthService) {
  return () => authService.initializeAuth();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideNativeDateAdapter(),
    provideHttpClient(withInterceptors([authInterceporInterceptor])),
    provideStore({
      auth: authReducer,
      products: productsReducer,
      cart: cartReducer,
    }),
  ],
};
