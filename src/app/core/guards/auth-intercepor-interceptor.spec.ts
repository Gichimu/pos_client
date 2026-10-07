import { TestBed } from '@angular/core/testing';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { firstValueFrom, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { authInterceporInterceptor } from './auth-intercepor-interceptor';

describe('authInterceporInterceptor', () => {
  const authService = {
    tokenIsValid: vi.fn(() => true),
    refreshToken: vi.fn(),
  };
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceporInterceptor(req, next));

  beforeEach(() => {
    authService.tokenIsValid.mockReset().mockReturnValue(true);
    authService.refreshToken.mockReset();
    localStorage.setItem('token', 'active-token');
    localStorage.setItem('refreshToken', 'active-refresh-token');
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }],
    });
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('does not refresh or clear the active session for a re-authentication 401', async () => {
    const request = new HttpRequest(
      'POST',
      'http://localhost:3080/api/auth/reauthenticate',
      { password: 'incorrect' },
    );
    const next = () => throwError(() => new HttpErrorResponse({ status: 401 }));

    await expect(firstValueFrom(interceptor(request, next))).rejects.toMatchObject({
      status: 401,
    });

    expect(authService.refreshToken).not.toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBe('active-token');
    expect(localStorage.getItem('refreshToken')).toBe('active-refresh-token');
  });
});
